import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brotin } from '../components/Brotin'
import { Button, Chip } from '../components/ui'
import { Card } from '../components/ui'
import { addWatering, getStreakDays, todayISO } from '../lib/streak'

/**
 * Rega diária — flow de captura da foto pra somar +1 no streak.
 *  capture  →  preview  →  confirm (celebração)
 */

type Mode = 'capture' | 'preview' | 'celebrate'

export function Rega() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>('capture')
  const [photo, setPhoto] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Inicializa câmera
  useEffect(() => {
    if (mode !== 'capture') return
    let active = true
    let stream: MediaStream | null = null

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (!active) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (e: unknown) {
        if (!active) return
        const name = e instanceof Error ? e.name : ''
        let msg = 'Câmera indisponível. Use a galeria.'
        if (name === 'NotAllowedError') msg = 'Você precisa autorizar a câmera nas configurações.'
        else if (name === 'NotFoundError') msg = 'Sem câmera nesse aparelho. Use a galeria.'
        setCameraError(msg)
      }
    }
    start()
    return () => {
      active = false
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [mode])

  function snap() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
    setPhoto(dataUrl)
    setMode('preview')
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPhoto(reader.result as string)
      setMode('preview')
    }
    reader.readAsDataURL(file)
  }

  function confirm() {
    if (!photo) return
    addWatering({
      date: todayISO(),
      photo,
      xp: 25,
    })
    setMode('celebrate')
  }

  function retake() {
    setPhoto(null)
    setMode('capture')
  }

  /* ─── render por modo ─────────────────────────────────────── */
  if (mode === 'celebrate' && photo) {
    return <Celebration photo={photo} onClose={() => navigate('/streak', { replace: true })} />
  }

  if (mode === 'preview' && photo) {
    return (
      <main className="flex-1 flex flex-col min-h-0 bg-[var(--color-cream)]">
        <header className="px-4 pt-4 pb-2 flex items-center justify-between">
          <button
            onClick={retake}
            aria-label="Refazer"
            className="px-3 py-1.5 rounded-full bg-white border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] text-xs font-bold"
          >
            ✕ Refazer
          </button>
          <div className="font-bold">Sua rega de hoje</div>
          <div className="w-16" />
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
          <div className="relative rounded-3xl overflow-hidden border-2 border-[var(--color-leaf-300)] shadow-[0_4px_0_var(--color-leaf-500)]">
            <img src={photo} alt="Foto da rega" className="w-full aspect-square object-cover" />
            <div className="absolute top-3 right-3">
              <Chip tone="leaf">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Chip>
            </div>
          </div>

          <Card padding="lg">
            <div className="flex items-center gap-3">
              <div className="text-3xl">💧</div>
              <div>
                <div className="text-xl font-extrabold">Dia {getStreakDays() + 1} 🔥</div>
                <div className="text-xs font-bold text-[var(--color-ink-soft)]">+25 XP · +1 dia de streak</div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Brotin size={48} mood="cheer" />
              <div className="text-sm font-bold text-[var(--color-leaf-700)]">
                "Tu é fera! 🌱"
              </div>
            </div>
          </Card>
        </div>

        <div className="px-4 pb-4 flex flex-col gap-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
          <Button full icon={<span>✓</span>} onClick={confirm}>
            Confirmar rega
          </Button>
          <button
            onClick={retake}
            className="text-sm font-semibold text-[var(--color-ink-faint)] py-2"
          >
            Refazer foto
          </button>
        </div>
      </main>
    )
  }

  // mode === 'capture'
  return (
    <main className="fixed inset-0 bg-black flex flex-col text-white">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ background: '#000' }}
      />
      <canvas ref={canvasRef} hidden />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }}
      />

      {cameraError && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center px-6 z-30 text-center">
          <div className="text-5xl mb-3">📷</div>
          <p className="text-sm mb-6 max-w-sm opacity-80">{cameraError}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-squish btn-primary mb-2"
          >
            Escolher da galeria
          </button>
          <button onClick={() => navigate(-1)} className="text-sm underline opacity-70">Voltar</button>
        </div>
      )}

      {/* HEADER */}
      <header className="relative z-20 flex items-center justify-between px-4 pt-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Fechar"
          className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-xl"
        >
          ✕
        </button>
        <div className="text-base font-bold drop-shadow-lg">Foto de hoje</div>
        <div className="w-10" />
      </header>

      {/* dica central */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pointer-events-none">
        <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
          💧 Mostre sua rega
        </div>
      </div>

      {/* FOOTER */}
      <footer
        className="relative z-20 pb-6"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        <div className="flex items-center justify-around px-8">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-xl"
            aria-label="Galeria"
          >
            🖼️
          </button>

          <button
            onClick={snap}
            disabled={!!cameraError}
            aria-label="Capturar"
            className="relative w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="absolute inset-0 rounded-full border-4 border-white" />
            <div className="w-14 h-14 rounded-full bg-white" style={{ boxShadow: '0 4px 0 #ccc inset' }} />
          </button>

          <div className="w-10" />
        </div>
      </footer>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFilePicked}
        hidden
      />
    </main>
  )
}

/* ─── Modal de celebração depois de confirmar ──────────────── */
function Celebration({ photo, onClose }: { photo: string; onClose: () => void }) {
  const streak = getStreakDays()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-hidden">
      {/* Backdrop com godrays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(26,26,46,0.65) 0%, rgba(26,26,46,0.92) 100%)',
        }}
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-[600px] opacity-25"
            style={{
              background: 'linear-gradient(to bottom, transparent, #fbbf24, transparent)',
              transform: `rotate(${i * 45}deg)`,
            }}
          />
        ))}
      </div>
      {/* Confete de folhas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-xl anim-float"
            style={{
              left: `${(i * 41) % 95}%`,
              top: `${(i * 53) % 85}%`,
              animationDelay: `${i * 0.13}s`,
              transform: `rotate(${i * 30}deg)`,
            }}
          >
            🌿
          </div>
        ))}
      </div>

      {/* Card */}
      <div
        className="relative z-10 bg-[var(--color-cream)] rounded-3xl p-6 max-w-sm w-full"
        style={{ border: '2px solid var(--color-earth-300)', boxShadow: '0 6px 0 var(--color-earth-500)' }}
      >
        <div className="flex justify-center mb-3">
          <Chip tone="sun" icon={<span>🔥</span>}>
            +1 DIA
          </Chip>
        </div>

        {/* Foto + Brotin sobreposto */}
        <div className="relative mb-4 rounded-2xl overflow-hidden">
          <img src={photo} alt="" className="w-full aspect-square object-cover" />
          <div className="absolute -bottom-2 -right-2">
            <Brotin size={80} mood="cheer" />
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold leading-tight" style={{ letterSpacing: '-0.02em' }}>
          Dia {streak} 🔥
        </h2>
        <p className="text-center text-sm text-[var(--color-ink-soft)] mt-1 mb-3">
          Mais um dia somado à sua sequência. Volta amanhã pro próximo!
        </p>

        <div className="flex justify-center gap-2 mb-4">
          <Chip tone="leaf">+25 XP</Chip>
          <Chip tone="sun">+1 dia</Chip>
          {streak > 0 && streak % 7 === 0 && (
            <Chip tone="earth">+ semana completa</Chip>
          )}
        </div>

        <Button full onClick={onClose}>Continuar</Button>
      </div>
    </div>
  )
}
