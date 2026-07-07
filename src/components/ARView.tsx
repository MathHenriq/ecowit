import '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import type { Species } from '../lib/species'
import { CATEGORY_HUMIDITY, modelPathsFor } from '../lib/species'

/**
 * ARView — AR real via <model-viewer> (Google).
 *
 *  - Android (Chrome): WebXR / Scene Viewer (.glb) — rastreamento real de
 *    superfície, a planta fica ancorada no chão da sua casa.
 *  - iOS: AR Quick Look (.usdz) — ancoragem real no chão via câmera.
 *
 * Cada espécie tem seu próprio modelo 3D em escala real (gerados em
 * scripts/plantgen), então a planta que você vê no AR é a planta de verdade:
 * uma Costela-de-Adão aparece com folhas recortadas, um mandacaru com braços.
 *
 * Além de "ver a planta no seu espaço", o AR tem função prática:
 *  - painel de cuidados da espécie (rega, sol, dificuldade)
 *  - medidor de luz ambiente pela câmera, comparado com a necessidade da planta
 *  - faixa de umidade do ar recomendada, com dica prática
 */

type LightLevel = 'sombra' | 'meia-sombra' | 'sol pleno'

interface LightReading {
  level: LightLevel
  luma: number
}

const LIGHT_ORDER: LightLevel[] = ['sombra', 'meia-sombra', 'sol pleno']

function classifyLuma(luma: number): LightLevel {
  if (luma < 50) return 'sombra'
  if (luma < 135) return 'meia-sombra'
  return 'sol pleno'
}

/** Mede a luz ambiente pela câmera traseira (média de luminância de frames). */
async function measureAmbientLight(): Promise<LightReading> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: { ideal: 320 } },
    audio: false,
  })
  try {
    const video = document.createElement('video')
    video.srcObject = stream
    video.muted = true
    video.playsInline = true
    await video.play()
    // deixa a exposição da câmera assentar
    await new Promise((r) => setTimeout(r, 900))
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 48
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    let total = 0
    const samples = 4
    for (let s = 0; s < samples; s++) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let sum = 0
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
      }
      total += sum / (data.length / 4)
      await new Promise((r) => setTimeout(r, 250))
    }
    const luma = total / samples
    return { level: classifyLuma(luma), luma }
  } finally {
    stream.getTracks().forEach((t) => t.stop())
  }
}

function lightVerdict(measured: LightLevel, needed: LightLevel) {
  const diff = Math.abs(LIGHT_ORDER.indexOf(measured) - LIGHT_ORDER.indexOf(needed))
  if (diff === 0) {
    return { icon: '✅', text: 'Luz ideal pra ela ficar aqui!', color: '#4ade80' }
  }
  const darker = LIGHT_ORDER.indexOf(measured) < LIGHT_ORDER.indexOf(needed)
  if (diff === 1) {
    return {
      icon: '⚠️',
      text: darker
        ? 'Um pouco escuro pro gosto dela — tente mais perto da janela.'
        : 'Um pouco de luz demais — vale filtrar com cortina.',
      color: '#facc15',
    }
  }
  return {
    icon: '🚫',
    text: darker
      ? 'Escuro demais pra essa espécie. Ela precisa de bem mais luz.'
      : 'Luz direta demais — as folhas podem queimar nesse lugar.',
    color: '#f87171',
  }
}

interface ARViewProps {
  title: string
  species: Species[]
  /** 'ring' = várias espécies pra escolher (jardim). 'front' = uma só (scan). */
  layout?: 'ring' | 'front'
  onClose: () => void
}

export function ARView({ title, species, layout = 'ring', onClose }: ARViewProps) {
  const list = species.slice(0, 12)
  const [activeIdx, setActiveIdx] = useState(0)
  const [showCare, setShowCare] = useState(true)
  const [light, setLight] = useState<LightReading | null>(null)
  const [measuring, setMeasuring] = useState(false)
  const [lightError, setLightError] = useState(false)
  const viewerRef = useRef<HTMLElement & { activateAR?: () => Promise<void> }>(null)

  const active = list[activeIdx]

  // leitura de luz é do ambiente, não da planta — mantém entre trocas de espécie
  useEffect(() => {
    setLightError(false)
  }, [activeIdx])

  async function handleActivateAR() {
    await viewerRef.current?.activateAR?.()
  }

  async function handleMeasureLight() {
    setMeasuring(true)
    setLightError(false)
    try {
      setLight(await measureAmbientLight())
    } catch {
      setLightError(true)
    } finally {
      setMeasuring(false)
    }
  }

  const humidity = active ? CATEGORY_HUMIDITY[active.category] : null
  const verdict = light && active ? lightVerdict(light.level, active.sunNeeds) : null

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
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
        <button
          onClick={() => setShowCare((v) => !v)}
          aria-label="Cuidados da planta"
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{
            background: showCare ? 'rgba(0,255,200,0.85)' : 'rgba(0,10,20,0.7)',
            border: '1.5px solid rgba(0,255,200,0.4)',
          }}
        >
          🌿
        </button>
      </header>

      {/* Visualizador 3D / AR */}
      <div className="relative flex-1 min-h-0">
        {active ? (
          <model-viewer
            ref={viewerRef as never}
            key={active.id}
            src={modelPathsFor(active).glb}
            ios-src={modelPathsFor(active).usdz}
            alt={`Modelo 3D de ${active.popularName}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-placement="floor"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            exposure="1.05"
            environment-image="neutral"
            interaction-prompt="none"
            style={{ width: '100%', height: '100%', background: 'transparent', '--poster-color': 'transparent' } as React.CSSProperties}
          >
            <button
              slot="ar-button"
              onClick={handleActivateAR}
              className="absolute left-1/2 bottom-4 -translate-x-1/2 px-7 py-3 rounded-full font-extrabold text-sm whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, #00d6b0, #00fff0)',
                color: '#012',
                boxShadow: '0 0 24px rgba(0,255,200,0.4)',
              }}
            >
              ✦ Ver no meu espaço (AR)
            </button>
          </model-viewer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <div>
              <div className="text-3xl mb-2">🌱</div>
              <p className="text-sm text-white/80">Nenhuma planta pra mostrar em AR ainda.</p>
            </div>
          </div>
        )}

        {/* Nome da espécie atual */}
        {active && (
          <div
            className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap"
            style={{
              background: 'rgba(0,12,22,0.78)',
              border: '1px solid rgba(0,255,200,0.5)',
              borderRadius: 10,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 800,
              color: '#bafff0',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 0 12px rgba(0,255,200,0.25)',
            }}
          >
            {active.emoji} {active.popularName}
            <span style={{ fontWeight: 500, fontStyle: 'italic', opacity: 0.7 }}> · {active.scientificName}</span>
          </div>
        )}
      </div>

      {/* Painel de cuidados: o que dá função real ao AR */}
      {active && showCare && (
        <div
          className="relative z-20 mx-3 mb-2 rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(0,14,24,0.92)',
            border: '1px solid rgba(0,255,200,0.35)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex gap-2 text-center mb-2">
            <div className="flex-1 rounded-xl py-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="text-base leading-none">☀️</div>
              <div className="text-[10px] text-white/60 mt-1">Luz</div>
              <div className="text-[11px] font-bold text-white capitalize">{active.sunNeeds}</div>
            </div>
            <div className="flex-1 rounded-xl py-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="text-base leading-none">💧</div>
              <div className="text-[10px] text-white/60 mt-1">Rega</div>
              <div className="text-[11px] font-bold text-white">a cada {active.waterDays}d</div>
            </div>
            <div className="flex-1 rounded-xl py-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="text-base leading-none">💦</div>
              <div className="text-[10px] text-white/60 mt-1">Umidade</div>
              <div className="text-[11px] font-bold text-white">{humidity!.min}–{humidity!.max}%</div>
            </div>
            <div className="flex-1 rounded-xl py-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="text-base leading-none">🎯</div>
              <div className="text-[10px] text-white/60 mt-1">Cuidado</div>
              <div className="text-[11px] font-bold text-white capitalize">{active.careLevel}</div>
            </div>
          </div>

          {/* Medidor de luz do ambiente */}
          {verdict ? (
            <div
              className="rounded-xl px-3 py-2 mb-2 text-[12px] font-semibold flex items-start gap-2"
              style={{ background: 'rgba(255,255,255,0.06)', color: verdict.color }}
            >
              <span>{verdict.icon}</span>
              <span>
                Luz medida aqui: <b className="capitalize">{light!.level}</b>. {verdict.text}
              </span>
            </div>
          ) : lightError ? (
            <div className="rounded-xl px-3 py-2 mb-2 text-[12px] text-white/70" style={{ background: 'rgba(255,255,255,0.06)' }}>
              Não consegui acessar a câmera pra medir a luz. Verifique a permissão.
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              onClick={handleMeasureLight}
              disabled={measuring}
              className="flex-1 rounded-xl py-2 text-[12px] font-extrabold"
              style={{
                background: measuring ? 'rgba(0,255,200,0.25)' : 'rgba(0,255,200,0.85)',
                color: measuring ? '#bafff0' : '#012',
              }}
            >
              {measuring ? '💡 Medindo a luz…' : light ? '💡 Medir luz de novo' : '💡 A luz aqui é boa pra ela?'}
            </button>
          </div>

          <p className="text-[11px] text-white/60 mt-2 leading-snug">
            💦 {humidity!.tip}
          </p>
        </div>
      )}

      {/* Seletor de espécies (só faz sentido com várias) */}
      {layout === 'ring' && list.length > 1 && (
        <div className="relative z-20 px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {list.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveIdx(i)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
              style={{
                background: i === activeIdx ? 'rgba(0,255,200,0.85)' : 'rgba(255,255,255,0.08)',
                color: i === activeIdx ? '#012' : 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,255,200,0.35)',
              }}
            >
              {s.emoji} {s.popularName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
