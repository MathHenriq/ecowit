import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IsoDiorama } from '../components/IsoDiorama'
import { Brotin } from '../components/Brotin'
import { Chip } from '../components/ui'
import { SPECIES_CATALOG } from '../lib/species'
import { TERRAINS, USER_LEVEL, isTerrainUnlocked } from '../lib/terrains'

/* ─── Jardim AR ─────────────────────────────────────────────── */
function JardimAR({ terrain, onClose }: { terrain: import('../lib/terrains').Terrain; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [camError, setCamError] = useState(false)
  const [opacity, setOpacity] = useState(0.72)

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.play()
        }
      })
      .catch(() => setCamError(true))
    return () => { stream?.getTracks().forEach((t) => t.stop()) }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Feed da câmera */}
      {!camError ? (
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0a1628' }}>
          <div className="text-center text-white px-6">
            <div className="text-4xl mb-3">📷</div>
            <div className="font-bold text-sm mb-1">Câmera indisponível</div>
            <div className="text-xs opacity-60">Mostrando modo simulado</div>
          </div>
        </div>
      )}

      {/* Scanlines sobre câmera */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,200,0.03) 3px, rgba(0,255,200,0.03) 4px)',
        }}
      />

      {/* Vinheta */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)' }}
      />

      {/* Diorama sobreposto com opacidade ajustável */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity }}
      >
        <div
          style={{
            width: '88vw',
            maxWidth: 380,
            aspectRatio: '4/3',
            position: 'relative',
            filter: 'drop-shadow(0 0 24px rgba(0,255,200,0.4))',
          }}
        >
          {/* Borda holográfica do diorama */}
          <div
            style={{
              position: 'absolute',
              inset: -2,
              border: '2px solid rgba(0,255,200,0.5)',
              borderRadius: 20,
              boxShadow: '0 0 30px rgba(0,255,200,0.2), inset 0 0 20px rgba(0,255,200,0.05)',
            }}
          />
          <IsoDiorama terrain={terrain} foggy={false} />
        </div>
      </div>

      {/* Badges flutuantes das plantas no topo */}
      <div
        className="absolute top-16 left-0 right-0 flex justify-center gap-2 flex-wrap px-4 pointer-events-none"
      >
        {terrain.plants.slice(0, 4).map((p, i) => {
          const sp = SPECIES_CATALOG.find((s) => s.id === p.speciesId)
          if (!sp) return null
          return (
            <div
              key={i}
              className="anim-float"
              style={{
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2.5s',
                background: 'rgba(0,10,20,0.8)',
                border: `1.5px solid ${p.status === 'thirsty' ? 'rgba(255,180,0,0.6)' : 'rgba(0,255,200,0.5)'}`,
                borderRadius: 10,
                padding: '4px 10px',
                backdropFilter: 'blur(4px)',
                color: p.status === 'thirsty' ? '#ffe066' : '#0fffe0',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {sp.emoji} {sp.popularName} {p.status === 'thirsty' ? '💧' : '✓'}
            </div>
          )
        })}
      </div>

      {/* Header */}
      <header
        className="relative z-10 flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
      >
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl"
          style={{ background: 'rgba(0,10,20,0.7)', border: '1.5px solid rgba(0,255,200,0.4)' }}
        >
          ✕
        </button>
        <div
          style={{
            background: 'rgba(0,10,20,0.8)',
            border: '1.5px solid rgba(0,255,200,0.4)',
            borderRadius: 20,
            padding: '4px 14px',
            color: '#0fffe0',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
          }}
        >
          ✦ AR · {terrain.name}
        </div>
        <div className="w-10" />
      </header>

      {/* Slider de opacidade do diorama */}
      <div
        className="absolute bottom-20 left-0 right-0 px-6 flex items-center gap-3"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <span style={{ color: 'rgba(0,255,200,0.6)', fontSize: 10, fontWeight: 700 }}>🌍</span>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: '#0fffe0' }}
        />
        <span style={{ color: 'rgba(0,255,200,0.6)', fontSize: 10, fontWeight: 700 }}>🌱</span>
      </div>

      {/* Footer label */}
      <div
        className="absolute bottom-6 left-0 right-0 text-center"
        style={{ color: 'rgba(0,255,200,0.45)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em' }}
      >
        ARRASTE O SLIDER PARA MISTURAR COM O MUNDO REAL
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 5%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 95%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}

/**
 * Plantação — carrossel de terrenos isométricos progressivos.
 * Cada terreno: cena 3D-ish com plantas + UI overlay.
 * Terrenos bloqueados aparecem com névoa (não cadeado tradicional).
 */
export function Plantacao() {
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [arOpen, setArOpen] = useState(false)

  const active = TERRAINS[activeIdx]
  const activeUnlocked = isTerrainUnlocked(active)

  // Stats agregados do terreno ativo
  const stats = useMemo(() => {
    const total = active.plants.length
    const thirsty = active.plants.filter((p) => p.status === 'thirsty').length
    const healthy = total - thirsty
    return { total, thirsty, healthy }
  }, [active])

  // Nome da primeira sedenta (pra mensagem do Brotin)
  const thirstySpeciesName = useMemo(() => {
    const t = active.plants.find((p) => p.status === 'thirsty')
    if (!t) return null
    return SPECIES_CATALOG.find((s) => s.id === t.speciesId)?.popularName ?? null
  }, [active])

  function goToTerrain(i: number) {
    setActiveIdx(i)
    // Scroll do carrossel pra centralizar a tab
    const el = scrollerRef.current?.children[i] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight">Minha Plantação</h1>
          <p className="text-sm text-[var(--color-ink-faint)]">
            Nível {USER_LEVEL} · {active.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Ver jardim em AR"
            onClick={() => setArOpen(true)}
            className="h-10 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #0a1628, #0d2a1e)',
              border: '1.5px solid rgba(0,255,210,0.5)',
              boxShadow: '0 0 12px rgba(0,255,210,0.2)',
            }}
          >
            <span>✦</span> AR
          </button>
          <button
            aria-label="Rodar vista"
            className="w-10 h-10 rounded-full bg-white border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] flex items-center justify-center"
          >
            🔄
          </button>
        </div>
      </header>

      {/* Carrossel de terrenos */}
      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto px-4 py-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {TERRAINS.map((t, i) => {
          const unlocked = isTerrainUnlocked(t)
          const active = i === activeIdx
          return (
            <button
              key={t.id}
              onClick={() => goToTerrain(i)}
              className={`shrink-0 snap-start flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
                active
                  ? 'bg-[var(--color-leaf-500)] text-white'
                  : unlocked
                  ? 'bg-white border-2 border-[var(--color-earth-200)] text-[var(--color-ink-soft)]'
                  : 'bg-[var(--color-earth-50)] border-2 border-dashed border-[var(--color-earth-300)] text-[var(--color-ink-faint)]'
              }`}
              style={!unlocked ? { filter: 'grayscale(0.4)', opacity: 0.7 } : undefined}
            >
              <span className="text-base">{t.emoji}</span>
              <span className="text-xs font-bold whitespace-nowrap">{t.name}</span>
              {!unlocked && (
                <span className="text-[10px] font-bold opacity-70">Nv.{t.unlockedAt}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Stats do terreno ativo */}
      <div className="px-4 py-2 flex gap-2">
        <Chip tone="leaf" icon={<span>🌱</span>}>
          {stats.total} / {active.capacity} plantas
        </Chip>
        {stats.healthy > 0 && (
          <Chip tone="leaf" icon={<span>💚</span>}>
            {stats.healthy} saudáveis
          </Chip>
        )}
        {stats.thirsty > 0 && (
          <Chip tone="sun" icon={<span>💧</span>}>
            {stats.thirsty} sedentas
          </Chip>
        )}
      </div>

      {/* DIORAMA */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pt-2 pb-4 relative">
        <IsoDiorama terrain={active} foggy={!activeUnlocked} />

        {/* Overlay "bloqueado" */}
        {!activeUnlocked && (
          <div className="absolute inset-x-4 top-2 bottom-4 rounded-3xl flex flex-col items-center justify-center text-center px-6 pointer-events-none">
            <div className="text-5xl mb-2 anim-float">{active.emoji}</div>
            <h2 className="text-xl font-bold text-white drop-shadow-lg">{active.name}</h2>
            <p className="text-sm text-white/85 mt-1 max-w-[260px] drop-shadow">
              Desbloqueia ao chegar no <strong>nível {active.unlockedAt}</strong>.
              <br />
              Faltam {active.unlockedAt - USER_LEVEL} nível(is) — bora regar! 🌱
            </p>
            <div className="mt-3 text-xs text-white/70 italic">
              {active.capacity} espaços te esperando aqui
            </div>
          </div>
        )}

        {/* Card flutuante do Brotin com dica (só se desbloqueado) */}
        {activeUnlocked && thirstySpeciesName && (
          <div
            className="absolute left-6 bottom-6 max-w-[200px] rounded-2xl p-3 flex items-center gap-2 bg-white"
            style={{
              border: '2px solid var(--color-earth-200)',
              boxShadow: '0 4px 0 var(--color-earth-300)',
            }}
          >
            <Brotin size={44} mood="worried" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold leading-tight">
                Falta regar {thirstySpeciesName}! 💧
              </div>
              <Link
                to="/streak/rega"
                className="inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-[var(--color-leaf-500)] text-white uppercase"
              >
                Regar
              </Link>
            </div>
          </div>
        )}

        {/* FAB plantar (só se desbloqueado e tem espaço) */}
        {activeUnlocked && active.plants.length < active.capacity && (
          <Link
            to="/jardim"
            aria-label="Plantar nova espécie"
            className="absolute right-6 bottom-6 w-14 h-14 rounded-full flex items-center justify-center text-3xl"
            style={{
              background: 'linear-gradient(180deg, var(--color-leaf-400), var(--color-leaf-600))',
              color: 'white',
              boxShadow: '0 4px 0 var(--color-leaf-800), 0 8px 20px rgba(46,204,113,0.4)',
            }}
          >
            +
          </Link>
        )}
      </div>

      {/* Dica embaixo */}
      <div className="px-4 pb-3 text-center text-[10px] text-[var(--color-ink-faint)] font-bold uppercase tracking-wider">
        Toque numa planta pra cuidar · arraste pra explorar
      </div>

      {arOpen && <JardimAR terrain={active} onClose={() => setArOpen(false)} />}
    </main>
  )
}
