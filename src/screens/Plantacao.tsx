import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IsoDiorama } from '../components/IsoDiorama'
import { ARView } from '../components/ARView'
import { Brotin } from '../components/Brotin'
import { Chip } from '../components/ui'
import { SPECIES_CATALOG, type Species } from '../lib/species'
import { TERRAINS, USER_LEVEL, isTerrainUnlocked, withLiveStatus } from '../lib/terrains'

/**
 * Plantação — carrossel de terrenos isométricos progressivos.
 * Cada terreno: cena 3D-ish com plantas + UI overlay.
 * Terrenos bloqueados aparecem com névoa (não cadeado tradicional).
 */
export function Plantacao() {
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [arOpen, setArOpen] = useState(false)

  const active = useMemo(() => withLiveStatus(TERRAINS[activeIdx]), [activeIdx])
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

  // Espécies do terreno ativo pra montar o jardim em AR
  const arSpecies = useMemo(
    () =>
      active.plants
        .map((p) => SPECIES_CATALOG.find((s) => s.id === p.speciesId))
        .filter((s): s is Species => !!s),
    [active],
  )

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

      {arOpen && (
        <ARView
          title={active.name}
          species={arSpecies}
          layout="ring"
          onClose={() => setArOpen(false)}
        />
      )}
    </main>
  )
}
