import { lazy, Suspense, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ARLoading } from '../components/ARLoading'
import { Brotin } from '../components/Brotin'
import {
  CAPACITY,
  computePlantStatus,
  loadGarden,
  plantAt,
  type GardenPlant,
} from '../lib/garden'
import { SPECIES_CATALOG, type Species } from '../lib/species'

/**
 * Jardim — o jardim 3D único do usuário.
 *
 * Uma ilha de grama viva em three.js com os modelos 3D reais das espécies.
 * Órbita/zoom com o dedo, toque numa planta pra cuidar dela, e ao
 * desbloquear uma espécie no scan você escolhe o canteiro onde plantar
 * (?plantar=<speciesId>).
 */

const GardenScene = lazy(() =>
  import('../components/GardenScene').then((m) => ({ default: m.GardenScene })),
)
const ARView = lazy(() =>
  import('../components/ARView').then((m) => ({ default: m.ARView })),
)

export function Jardim() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [garden, setGarden] = useState<GardenPlant[]>(() => loadGarden())
  const [selected, setSelected] = useState<GardenPlant | null>(null)
  const [arOpen, setArOpen] = useState(false)
  const [justPlanted, setJustPlanted] = useState<Species | null>(null)

  // Modo plantio: /jardim?plantar=<speciesId>
  const plantingSpecies = useMemo(() => {
    const id = searchParams.get('plantar')
    return id ? SPECIES_CATALOG.find((s) => s.id === id) ?? null : null
  }, [searchParams])
  const plantingMode = !!plantingSpecies && garden.length < CAPACITY

  const statusById = useMemo(() => {
    const map = new Map<string, 'healthy' | 'thirsty'>()
    for (const p of garden) {
      if (!map.has(p.speciesId)) map.set(p.speciesId, computePlantStatus(p.speciesId))
    }
    return map
  }, [garden])

  const thirstyIds = useMemo(
    () => new Set([...statusById.entries()].filter(([, st]) => st === 'thirsty').map(([id]) => id)),
    [statusById],
  )
  const thirstyCount = garden.filter((p) => thirstyIds.has(p.speciesId)).length

  const arSpecies = useMemo(() => {
    const seen = new Set<string>()
    const out: Species[] = []
    for (const p of garden) {
      if (seen.has(p.speciesId)) continue
      seen.add(p.speciesId)
      const sp = SPECIES_CATALOG.find((s) => s.id === p.speciesId)
      if (sp) out.push(sp)
    }
    return out
  }, [garden])

  const selectedSpecies = selected
    ? SPECIES_CATALOG.find((s) => s.id === selected.speciesId) ?? null
    : null

  function handlePlotTap(gx: number, gz: number) {
    if (!plantingSpecies) return
    setGarden(plantAt(plantingSpecies.id, gx, gz))
    setJustPlanted(plantingSpecies)
    setSearchParams({}, { replace: true })
    setTimeout(() => setJustPlanted(null), 3200)
  }

  return (
    <main className="flex-1 flex flex-col min-h-0 relative">
      {/* Cena 3D ocupa a tela toda da aba */}
      <div className="absolute inset-0">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ background: 'linear-gradient(180deg, #aeddff, #f2f7e8)' }}
            >
              <Brotin size={72} mood="happy" className="anim-float" />
              <p className="text-xs font-bold text-[var(--color-ink-soft)]">Regando o jardim…</p>
            </div>
          }
        >
          <GardenScene
            plants={garden}
            thirstyIds={thirstyIds}
            plantingMode={plantingMode}
            onSelectPlant={(p) => setSelected(p)}
            onPlotTap={handlePlotTap}
          />
        </Suspense>
      </div>

      {/* Header flutuante */}
      <header className="relative z-10 px-4 pt-4 flex items-start justify-between pointer-events-none">
        <div
          className="rounded-2xl px-3.5 py-2 pointer-events-auto"
          style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 10px rgba(30,60,30,0.12)' }}
        >
          <h1 className="text-lg font-extrabold leading-tight">Meu Jardim</h1>
          <p className="text-[11px] font-bold text-[var(--color-ink-faint)]">
            🌱 {garden.length}/{CAPACITY} canteiros
            {thirstyCount > 0 && <span className="text-amber-600"> · 💧 {thirstyCount} com sede</span>}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <button
            aria-label="Ver jardim em AR"
            onClick={() => setArOpen(true)}
            className="h-9 px-3 rounded-full flex items-center gap-1 text-[11px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #0a1628, #0d2a1e)', border: '1.5px solid rgba(0,255,210,0.5)' }}
          >
            ✦ AR
          </button>
          <Link
            to="/catalogo"
            className="h-9 px-3 rounded-full flex items-center gap-1 text-[11px] font-extrabold"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.9)', color: 'var(--color-leaf-700)' }}
          >
            📖 Catálogo
          </Link>
        </div>
      </header>

      {/* Banner de plantio */}
      {plantingMode && plantingSpecies && (
        <div className="absolute left-4 right-4 top-24 z-10 pointer-events-none">
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(0,40,20,0.82)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(46,204,113,0.7)' }}
          >
            <span className="text-2xl">{plantingSpecies.emoji}</span>
            <div className="flex-1 text-white">
              <div className="text-sm font-extrabold">Onde plantar sua {plantingSpecies.popularName}?</div>
              <div className="text-[11px] opacity-85">Toque num canteiro vazio com o anel verde ✚</div>
            </div>
            <button
              onClick={() => setSearchParams({}, { replace: true })}
              className="pointer-events-auto w-7 h-7 rounded-full bg-white/20 text-white text-xs font-bold"
              aria-label="Cancelar plantio"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Confirmação de plantio */}
      {justPlanted && (
        <div className="absolute left-1/2 -translate-x-1/2 top-24 z-10 pointer-events-none">
          <div
            className="rounded-full px-4 py-2 text-sm font-extrabold text-white whitespace-nowrap"
            style={{ background: 'rgba(46,204,113,0.95)', boxShadow: '0 6px 18px rgba(46,204,113,0.5)' }}
          >
            🌱 {justPlanted.popularName} plantada!
          </div>
        </div>
      )}

      {/* Dica de gestos */}
      {!plantingMode && !selected && (
        <div className="absolute bottom-3 inset-x-0 z-10 text-center pointer-events-none">
          <span
            className="inline-block px-3 py-1.5 rounded-full text-[10px] font-bold text-[var(--color-ink-soft)]"
            style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)' }}
          >
            👆 arraste pra girar · belisque pro zoom · toque numa planta
          </span>
        </div>
      )}

      {/* Card da planta selecionada */}
      {selected && selectedSpecies && (
        <div className="absolute inset-x-4 bottom-4 z-10">
          <div
            className="rounded-2xl p-3 flex items-center gap-3 bg-white"
            style={{ border: '2px solid var(--color-leaf-300)', boxShadow: '0 4px 0 var(--color-leaf-500), 0 10px 24px rgba(0,60,30,0.25)' }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'var(--color-leaf-50)' }}
            >
              {selectedSpecies.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-extrabold leading-tight truncate">{selectedSpecies.popularName}</div>
              <div className={`text-[10px] font-bold ${thirstyIds.has(selectedSpecies.id) ? 'text-amber-600' : 'text-[var(--color-leaf-600)]'}`}>
                {thirstyIds.has(selectedSpecies.id)
                  ? `💧 com sede — rega a cada ${selectedSpecies.waterDays}d`
                  : `💚 saudável — rega a cada ${selectedSpecies.waterDays}d`}
              </div>
              <div className="flex gap-1.5 mt-1.5">
                <button
                  onClick={() => navigate(`/jardim/${selectedSpecies.id}`)}
                  className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-[var(--color-leaf-500)] text-white uppercase"
                >
                  Cuidar
                </button>
                {thirstyIds.has(selectedSpecies.id) && (
                  <button
                    onClick={() => navigate('/streak/rega')}
                    className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase"
                    style={{ background: '#fff3cd', color: '#92600a', border: '1.5px solid #fcd34d' }}
                  >
                    💧 Regar
                  </button>
                )}
              </div>
            </div>
            <button
              aria-label="Fechar"
              onClick={() => setSelected(null)}
              className="w-7 h-7 rounded-full bg-[var(--color-earth-100)] text-xs font-bold shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Jardim cheio durante plantio */}
      {plantingSpecies && garden.length >= CAPACITY && (
        <div className="absolute inset-x-4 bottom-4 z-10">
          <div className="rounded-2xl p-3 bg-white text-center text-sm font-bold"
            style={{ border: '2px solid var(--color-earth-300)' }}
          >
            Seu jardim está cheio! 🌿 ({CAPACITY} canteiros)
          </div>
        </div>
      )}

      {arOpen && (
        <Suspense fallback={<ARLoading />}>
          <ARView
            title="Meu Jardim"
            species={arSpecies}
            layout="ring"
            onClose={() => setArOpen(false)}
          />
        </Suspense>
      )}
    </main>
  )
}
