import { useCallback, useEffect, useRef, useState } from 'react'
import { PlantSprite } from './PlantSprite'
import type { Species } from '../lib/species'

/**
 * ARView — AR markerless ancorado por giroscópio.
 *
 * Como funciona (AR de verdade, sem libs 3D pesadas):
 *  - Câmera traseira via getUserMedia entra como "mundo real" de fundo.
 *  - DeviceOrientation (giroscópio/bússola) dá a direção pra onde o celular aponta.
 *  - Cada planta ganha uma âncora no espaço (yaw/pitch relativos ao ponto inicial).
 *  - Ao girar o aparelho, recalculamos a posição na tela: as plantas ficam
 *    "presas" no mundo — saem de quadro quando você vira pro lado e voltam
 *    quando você volta. Isso é o que dá a sensação real de AR.
 *
 * Fallback: sem giroscópio (desktop/permissão negada), arrastar o dedo/mouse
 * gira a cena manualmente — continua explorável.
 */

interface ARViewProps {
  title: string
  species: Species[]
  /** 'ring' espalha as plantas ao seu redor (jardim). 'front' coloca à sua frente (scan). */
  layout?: 'ring' | 'front'
  onClose: () => void
}

interface Anchor {
  species: Species
  yaw: number // graus, relativo ao ponto onde a AR iniciou
  pitch: number // graus acima/abaixo do horizonte
  dist: number // 0.8 (perto/grande) .. 1.3 (longe/pequeno)
}

type Phase = 'intro' | 'live'

const FOV_DEG = 70 // campo de visão horizontal aproximado da câmera do celular

function angleDiff(a: number, b: number) {
  let d = a - b
  while (d > 180) d -= 360
  while (d < -180) d += 360
  return d
}

function lerpAngle(from: number, to: number, t: number) {
  return from + angleDiff(to, from) * t
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

/** Distribui as plantas no espaço conforme o layout. */
function buildAnchors(species: Species[], layout: 'ring' | 'front'): Anchor[] {
  const list = species.slice(0, 8)
  const n = list.length
  if (n === 0) return []

  if (layout === 'front') {
    const spread = Math.min(46, n * 22)
    return list.map((s, i) => ({
      species: s,
      yaw: n === 1 ? 0 : -spread / 2 + (i * spread) / (n - 1),
      pitch: -8 - (i % 2) * 4,
      dist: 0.95,
    }))
  }

  // ring: espalha num arco amplo (300°) ao redor, deixando uma "porta" atrás
  const spread = 300
  return list.map((s, i) => ({
    species: s,
    yaw: n === 1 ? 0 : -spread / 2 + (i * spread) / (n - 1),
    pitch: -6 + ((i * 37) % 14) - 6, // leve variação vertical
    dist: 0.85 + ((i * 53) % 40) / 100, // 0.85 .. 1.25
  }))
}

export function ARView({ title, species, layout = 'ring', onClose }: ARViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [phase, setPhase] = useState<Phase>('intro')
  const [camOk, setCamOk] = useState(true)
  const [hasGyro, setHasGyro] = useState(false)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [pose, setPose] = useState({ yaw: 0, pitch: -6 })

  const anchorsRef = useRef<Anchor[]>(buildAnchors(species, layout))

  // refs do loop de orientação (evita re-render por evento)
  const refYaw = useRef<number | null>(null)
  const manualYaw = useRef(0)
  const manualPitch = useRef(-6)
  const target = useRef({ yaw: 0, pitch: -6 })
  const current = useRef({ yaw: 0, pitch: -6 })
  const hasGyroRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  const onOrient = useCallback((e: DeviceOrientationEvent) => {
    if (e.alpha == null) return
    if (!hasGyroRef.current) {
      hasGyroRef.current = true
      setHasGyro(true)
    }
    if (refYaw.current == null) refYaw.current = e.alpha
    const rel = angleDiff(e.alpha, refYaw.current)
    target.current.yaw = rel
    target.current.pitch = clamp((e.beta ?? 90) - 90, -55, 55)
  }, [])

  // Loop de animação: suaviza a pose e atualiza a tela
  useEffect(() => {
    if (phase !== 'live') return
    const tick = () => {
      const t = hasGyroRef.current ? 0.18 : 0.22
      current.current.yaw = lerpAngle(current.current.yaw, target.current.yaw, t)
      current.current.pitch = current.current.pitch + (target.current.pitch - current.current.pitch) * t
      setPose({ yaw: current.current.yaw, pitch: current.current.pitch })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase])

  // Detecta ausência de giroscópio depois de iniciar → ativa modo arrasto
  useEffect(() => {
    if (phase !== 'live') return
    const id = setTimeout(() => {
      if (!hasGyroRef.current) setHasGyro(false)
    }, 1300)
    return () => clearTimeout(id)
  }, [phase])

  async function start() {
    // 1) Permissão de orientação (iOS 13+ exige gesto do usuário)
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    try {
      if (DOE && typeof DOE.requestPermission === 'function') {
        const res = await DOE.requestPermission()
        if (res === 'granted') window.addEventListener('deviceorientation', onOrient, true)
      } else {
        window.addEventListener('deviceorientation', onOrient, true)
      }
    } catch {
      window.addEventListener('deviceorientation', onOrient, true)
    }

    // 2) Câmera traseira
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCamOk(true)
    } catch {
      setCamOk(false)
    }

    setPhase('live')
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      window.removeEventListener('deviceorientation', onOrient, true)
    }
  }, [onOrient])

  // Arrasto (fallback sem giroscópio)
  function onPointerDown(e: React.PointerEvent) {
    if (hasGyroRef.current) return
    dragRef.current = { x: e.clientX, y: e.clientY }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (hasGyroRef.current || !dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    dragRef.current = { x: e.clientX, y: e.clientY }
    manualYaw.current = manualYaw.current - dx * 0.3
    manualPitch.current = clamp(manualPitch.current + dy * 0.2, -45, 35)
    target.current.yaw = manualYaw.current
    target.current.pitch = manualPitch.current
  }
  function onPointerUp() {
    dragRef.current = null
  }

  const cx = size.w / 2
  const cy = size.h / 2
  const ppd = size.w / FOV_DEG // pixels por grau

  const anchors = anchorsRef.current

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden select-none" style={{ touchAction: 'none' }}>
      {/* Câmera / mundo real */}
      {camOk ? (
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 30%, #12324a 0%, #060e1a 70%)' }}
        />
      )}

      {/* Scanlines + vinheta */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,200,0.025) 3px, rgba(0,255,200,0.025) 4px)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)' }}
      />

      {/* Camada das plantas ancoradas no espaço */}
      <div
        className="absolute inset-0"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {phase === 'live' &&
          anchors.map((a, i) => {
            const dYaw = angleDiff(pose.yaw, a.yaw)
            const dPitch = pose.pitch - a.pitch
            if (Math.abs(dYaw) > 95) return null // está "atrás" de você
            const x = cx - dYaw * ppd
            const y = cy + dPitch * ppd
            const px = 168 / a.dist
            // some suavemente nas bordas laterais
            const edge = clamp(1 - (Math.abs(dYaw) - 55) / 40, 0, 1)
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: x,
                  top: y,
                  width: px,
                  height: px,
                  transform: `translate(-50%, -78%) rotateY(${clamp(dYaw * 0.5, -45, 45)}deg)`,
                  transformStyle: 'preserve-3d',
                  opacity: edge,
                  pointerEvents: 'none',
                  willChange: 'left, top, transform',
                }}
              >
                {/* halo de ancoragem no "chão" */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '6%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '70%',
                    height: 14,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(ellipse, rgba(0,255,200,0.45) 0%, rgba(0,255,200,0) 70%)',
                    filter: 'blur(1px)',
                  }}
                />
                {/* sprite da planta */}
                <svg
                  viewBox="-26 -44 52 54"
                  className="w-full h-full anim-float"
                  style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.45))', animationDelay: `${i * 0.2}s` }}
                >
                  <PlantSprite species={a.species} scale={1} />
                </svg>
                {/* plaquinha holográfica do nome */}
                <div
                  style={{
                    position: 'absolute',
                    top: -6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    background: 'rgba(0,12,22,0.78)',
                    border: '1px solid rgba(0,255,200,0.5)',
                    borderRadius: 8,
                    padding: '2px 8px',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#bafff0',
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 0 12px rgba(0,255,200,0.25)',
                  }}
                >
                  {a.species.emoji} {a.species.popularName}
                </div>
              </div>
            )
          })}
      </div>

      {/* Reticle central */}
      {phase === 'live' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            style={{
              width: 40,
              height: 40,
              border: '1.5px solid rgba(0,255,200,0.5)',
              borderRadius: '50%',
              boxShadow: '0 0 14px rgba(0,255,200,0.25)',
            }}
          />
          <div className="absolute w-1 h-1 rounded-full" style={{ background: 'rgba(0,255,200,0.9)' }} />
        </div>
      )}

      {/* HUD topo */}
      <header
        className="relative z-20 flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
      >
        <button
          onClick={onClose}
          aria-label="Fechar AR"
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl"
          style={{ background: 'rgba(0,10,20,0.7)', border: '1.5px solid rgba(0,255,200,0.4)' }}
        >
          ✕
        </button>
        <div
          style={{
            background: 'rgba(0,10,20,0.78)',
            border: '1.5px solid rgba(0,255,200,0.4)',
            borderRadius: 20,
            padding: '4px 14px',
            color: '#0fffe0',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
          }}
        >
          ✦ AR · {title}
        </div>
        <div className="w-10" />
      </header>

      {/* Dica inferior */}
      {phase === 'live' && (
        <div className="absolute left-0 right-0 bottom-8 px-6 text-center pointer-events-none">
          <div
            className="inline-block anim-pulse-soft"
            style={{
              background: 'rgba(0,10,20,0.7)',
              border: '1px solid rgba(0,255,200,0.3)',
              borderRadius: 20,
              padding: '8px 16px',
              color: 'rgba(186,255,240,0.9)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {hasGyro
              ? layout === 'ring'
                ? '🔄 Gire o celular — seu jardim está ao seu redor'
                : '🔄 Mexa o celular pra ver a planta no seu espaço'
              : '👆 Arraste pra olhar em volta'}
          </div>
        </div>
      )}

      {/* Intro / gate de permissão (precisa de gesto do usuário) */}
      {phase === 'intro' && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-8"
          style={{ background: 'rgba(2,8,16,0.92)' }}
        >
          <div className="text-5xl mb-4 anim-float">🪴</div>
          <h2 className="text-white text-xl font-extrabold mb-2">Entrar no modo AR</h2>
          <p className="text-sm mb-1" style={{ color: 'rgba(186,255,240,0.8)' }}>
            {layout === 'ring'
              ? 'Suas plantas vão aparecer ancoradas no espaço ao seu redor.'
              : 'A planta vai aparecer fixa à sua frente, no seu mundo real.'}
          </p>
          <p className="text-xs mb-6" style={{ color: 'rgba(186,255,240,0.5)' }}>
            Vamos pedir acesso à câmera e ao sensor de movimento.
          </p>
          <button
            onClick={start}
            className="px-7 py-3 rounded-full font-extrabold text-sm"
            style={{
              background: 'linear-gradient(135deg, #00d6b0, #00fff0)',
              color: '#012',
              boxShadow: '0 0 24px rgba(0,255,200,0.4)',
            }}
          >
            ✦ Iniciar AR
          </button>
          <button onClick={onClose} className="mt-4 text-sm underline" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Agora não
          </button>
        </div>
      )}

      {phase === 'live' && anchors.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-white px-6">
            <div className="text-3xl mb-2">🌱</div>
            <p className="text-sm opacity-80">Nenhuma planta pra mostrar em AR ainda.</p>
          </div>
        </div>
      )}
    </div>
  )
}
