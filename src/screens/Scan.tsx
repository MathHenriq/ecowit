import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brotin } from '../components/Brotin'
import { identify } from '../lib/identify'

/**
 * Scan — tela de identificação de planta via câmera.
 * - Stream real do dispositivo via getUserMedia (com fallback pra upload de imagem)
 * - Mira de 4 corner brackets pulsando
 * - Captura -> "identificando..." -> /scan/resultado
 *
 * Integração com PlantNet vai entrar na próxima task (#24).
 * Por enquanto, mock de 2s + navigate.
 */

type Mode = 'preview' | 'capturing' | 'identifying' | 'error'

export function Scan() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>('preview')
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'camera' | 'identify'>('camera')
  const [flashOn, setFlashOn] = useState(false)
  const [tab, setTab] = useState<'galeria' | 'camera' | 'recentes'>('camera')

  // Inicializa câmera
  useEffect(() => {
    let active = true
    let stream: MediaStream | null = null

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } },
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
        console.warn('camera error', e)
        setMode('error')
        setErrorType('camera')
        const name = e instanceof Error ? e.name : ''
        let msg = 'Não consegui acessar a câmera. Tente usar a galeria.'
        if (name === 'NotAllowedError') {
          msg = 'Você negou o acesso à câmera. Autorize nas configurações do navegador ou use a galeria.'
        } else if (name === 'NotFoundError') {
          msg = 'Nenhuma câmera encontrada nesse dispositivo. Use a galeria pra escolher uma foto que já tem.'
        } else if (name === 'NotReadableError') {
          msg = 'Câmera está em uso por outro app. Feche os outros e tente de novo.'
        }
        setError(msg)
      }
    }

    start()

    return () => {
      active = false
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function capture() {
    if (!videoRef.current || !canvasRef.current) return
    setMode('capturing')

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    sessionStorage.setItem('ecowit:lastScan', dataUrl)

    setMode('identifying')
    try {
      const result = await identify(dataUrl, 'plantnet')
      sessionStorage.setItem('ecowit:lastScanResult', JSON.stringify(result))
      navigate('/scan/resultado')
    } catch (err) {
      console.error('identify error', err)
      setErrorType('identify')
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao identificar.')
      setMode('error')
    }
  }

  function pickFromGallery() {
    fileInputRef.current?.click()
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      sessionStorage.setItem('ecowit:lastScan', dataUrl)
      setMode('identifying')
      try {
        const result = await identify(dataUrl, 'plantnet')
        sessionStorage.setItem('ecowit:lastScanResult', JSON.stringify(result))
        navigate('/scan/resultado')
      } catch (err) {
        console.error('identify error', err)
        setError('Erro ao identificar. Tente novamente.')
        setMode('error')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <main className="fixed inset-0 bg-black flex flex-col text-white">
      {/* Vídeo da câmera (full screen) */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ background: '#000' }}
      />
      <canvas ref={canvasRef} hidden />

      {/* Overlay escuro nas bordas pra contrastar UI */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Erro / fallback */}
      {mode === 'error' && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center px-6 z-30 overflow-y-auto py-6">
          <div className="text-5xl mb-3">{errorType === 'camera' ? '📷' : '🔬'}</div>
          <h2 className="text-xl font-bold mb-2">
            {errorType === 'camera' ? 'Câmera indisponível' : 'Falha ao identificar'}
          </h2>
          <p className="text-sm opacity-80 mb-2 max-w-sm break-words">{error}</p>
          {errorType === 'identify' && (
            <p className="text-xs opacity-50 mb-6 max-w-sm">
              Abre o console (F12) pra ver detalhes. Pode ser CORS, chave inválida, ou limite atingido.
            </p>
          )}
          <button
            onClick={() => {
              setMode('preview')
              setError(null)
            }}
            className="btn-squish btn-primary mb-2"
          >
            Tentar de novo
          </button>
          <button
            onClick={pickFromGallery}
            className="btn-squish btn-outline mb-2"
          >
            Escolher da galeria
          </button>
          <button
            onClick={() => navigate(-1)}
            className="mt-2 text-sm underline opacity-70"
          >
            Voltar
          </button>
        </div>
      )}

      {/* Identificando overlay */}
      {mode === 'identifying' && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30">
          <div className="anim-pulse-soft mb-4">
            <Brotin size={100} mood="cheer" />
          </div>
          <div className="text-lg font-bold mb-2">Identificando espécie…</div>
          <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-leaf-500)] anim-pulse-soft" style={{ width: '70%' }} />
          </div>
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
        <div className="text-base font-bold drop-shadow-lg">Identificar Planta</div>
        <button
          onClick={() => setFlashOn((v) => !v)}
          aria-label="Flash"
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
            flashOn ? 'bg-[var(--color-sun-500)] text-black' : 'bg-white/15 backdrop-blur-md'
          }`}
        >
          ⚡
        </button>
      </header>

      {/* MIRA central */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="relative w-[260px] h-[260px]">
          {/* 4 corner brackets */}
          {[
            { top: 0, left: 0, borders: 'border-t-4 border-l-4 rounded-tl-3xl' },
            { top: 0, right: 0, borders: 'border-t-4 border-r-4 rounded-tr-3xl' },
            { bottom: 0, left: 0, borders: 'border-b-4 border-l-4 rounded-bl-3xl' },
            { bottom: 0, right: 0, borders: 'border-b-4 border-r-4 rounded-br-3xl' },
          ].map((b, i) => (
            <div
              key={i}
              className={`absolute w-12 h-12 ${b.borders} anim-pulse-soft`}
              style={{
                top: b.top,
                left: b.left,
                right: b.right,
                bottom: b.bottom,
                borderColor: 'var(--color-leaf-400)',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}

          {/* Chip "Aproxime a folha" acima */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: -42 }}
          >
            <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
              🌿 Aproxime a folha
            </div>
          </div>

          {/* Indicador embaixo */}
          {mode === 'preview' && (
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 text-xs font-medium opacity-90">
              <span className="anim-pulse-soft">pronto pra escanear</span>
            </div>
          )}
        </div>

        {/* Brotin no canto inferior direito */}
        <div className="absolute right-4 bottom-32 opacity-90">
          <Brotin size={70} mood="happy" />
        </div>
      </div>

      {/* FOOTER — tabs + botão captura */}
      <footer
        className="relative z-20 pb-6"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-4">
          {(['galeria', 'camera', 'recentes'] as const).map((id) => {
            const active = tab === id
            const label = id === 'galeria' ? 'Galeria' : id === 'camera' ? 'Câmera' : 'Recentes'
            return (
              <button
                key={id}
                onClick={() => {
                  setTab(id)
                  if (id === 'galeria') pickFromGallery()
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  active
                    ? 'bg-[var(--color-leaf-500)] text-white'
                    : 'bg-white/15 backdrop-blur-md text-white'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Botão de captura (anel + miolo) */}
        <div className="flex justify-center">
          <button
            onClick={capture}
            aria-label="Capturar foto"
            disabled={mode !== 'preview'}
            className="relative w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="absolute inset-0 rounded-full border-4 border-white" />
            <div
              className="w-14 h-14 rounded-full bg-white"
              style={{ boxShadow: '0 4px 0 #ccc inset' }}
            />
          </button>
        </div>
      </footer>

      {/* Input file invisível (fallback galeria) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFilePicked}
        hidden
      />
    </main>
  )
}
