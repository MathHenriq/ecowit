import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  SPECIES_CATALOG,
  UNLOCKED_SPECIES_IDS,
  type Species,
  type SpeciesCategory,
} from '../lib/species'
import { Chip } from '../components/ui'

/**
 * Jardim — Pokédex de espécies em prateleiras de loja vintage.
 * Plantas desbloqueadas aparecem coloridas. Bloqueadas: silhueta + cadeado.
 */

type Filter = 'all' | 'unlocked' | SpeciesCategory

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',        label: 'Tudo' },
  { id: 'unlocked',   label: 'Desbloqueadas' },
  { id: 'suculenta',  label: 'Suculentas' },
  { id: 'tropical',   label: 'Tropicais' },
  { id: 'erva',       label: 'Ervas' },
  { id: 'flor',       label: 'Flores' },
  { id: 'cacto',      label: 'Cactos' },
  { id: 'arvore',     label: 'Árvores' },
]

export function Jardim() {
  const [filter, setFilter] = useState<Filter>('all')

  const total = SPECIES_CATALOG.length
  const unlockedCount = UNLOCKED_SPECIES_IDS.size

  const visibleSpecies = useMemo(() => {
    if (filter === 'all') return SPECIES_CATALOG
    if (filter === 'unlocked') return SPECIES_CATALOG.filter((s) => UNLOCKED_SPECIES_IDS.has(s.id))
    return SPECIES_CATALOG.filter((s) => s.category === filter)
  }, [filter])

  // Quebra em "prateleiras" de 4 em 4
  const shelves = useMemo(() => {
    const rows: Species[][] = []
    for (let i = 0; i < visibleSpecies.length; i += 4) {
      rows.push(visibleSpecies.slice(i, i + 4))
    }
    return rows
  }, [visibleSpecies])

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-tight">Meu Jardim</h1>
          <p className="text-sm text-[var(--color-ink-faint)]">
            {unlockedCount} / {total} espécies
          </p>
        </div>
        <button
          aria-label="Buscar"
          className="w-10 h-10 rounded-full bg-white border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] flex items-center justify-center"
        >
          🔍
        </button>
      </header>

      {/* Tabs filtro */}
      <div className="px-4 mb-2">
        <div className="flex gap-2 overflow-x-auto -mx-2 px-2 pb-1" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map((f) => {
            const active = filter === f.id
            const count = f.id === 'all'
              ? total
              : f.id === 'unlocked'
              ? unlockedCount
              : SPECIES_CATALOG.filter((s) => s.category === f.id).length
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  active
                    ? 'bg-[var(--color-leaf-500)] text-white'
                    : 'bg-white border-2 border-[var(--color-earth-200)] text-[var(--color-ink-soft)]'
                }`}
              >
                {f.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Stats inline */}
      <div className="px-4 pb-3 flex gap-2">
        <Chip tone="leaf" icon={<span>🔓</span>}>
          {unlockedCount} desbloqueadas
        </Chip>
        <Chip tone="sun" icon={<span>🔒</span>}>
          {total - unlockedCount} a descobrir
        </Chip>
      </div>

      {/* Prateleiras */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-6">
        {shelves.map((row, i) => (
          <Shelf key={i} species={row} />
        ))}

        {shelves.length === 0 && (
          <div className="text-center py-12 text-sm text-[var(--color-ink-faint)]">
            Nenhuma espécie nesse filtro ainda 🌱
          </div>
        )}
      </div>

      {/* CTA fixo "Reconhecer planta" */}
      <div className="px-4 pb-3">
        <Link
          to="/scan"
          className="flex items-center gap-3 bg-white rounded-2xl p-3 border-2 border-[var(--color-earth-200)]"
          style={{ boxShadow: '0 4px 0 var(--color-earth-300)' }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: 'var(--color-sky-100)' }}
          >
            📷
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">Reconhecer planta</div>
            <div className="text-xs text-[var(--color-ink-faint)]">
              Aponte a câmera pra desbloquear uma nova espécie
            </div>
          </div>
          <div className="text-xl text-[var(--color-ink-faint)]">→</div>
        </Link>
      </div>
    </main>
  )
}

/* ─── Shelf (prateleira de 4 vasos) ─────────────────────────── */
function Shelf({ species }: { species: Species[] }) {
  return (
    <div className="relative">
      {/* Linha de 4 vasos */}
      <div className="grid grid-cols-4 gap-2 items-end px-1">
        {species.map((s) => (
          <PotCard key={s.id} species={s} />
        ))}
        {/* preencher slots vazios pra alinhar a prateleira */}
        {Array.from({ length: 4 - species.length }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
      </div>

      {/* Prateleira de madeira */}
      <div
        className="h-3 rounded-sm mt-[-2px]"
        style={{
          background: 'linear-gradient(180deg, #8b5a2b 0%, #6b4423 60%, #4a2f17 100%)',
          boxShadow: '0 4px 0 #2e1c0e, inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      />
    </div>
  )
}

/* ─── Pot (vaso individual) ─────────────────────────────────── */
function PotCard({ species }: { species: Species }) {
  const unlocked = UNLOCKED_SPECIES_IDS.has(species.id)
  const potColor = species.potColor === 'terracotta' ? '#c87060' : '#9ca3af'
  const potShadow = species.potColor === 'terracotta' ? '#8b4a3e' : '#6b7280'

  return (
    <Link
      to={unlocked ? `/jardim/${species.id}` : '#'}
      onClick={(e) => {
        if (!unlocked) e.preventDefault()
      }}
      className="flex flex-col items-center relative"
    >
      {/* Folhas/Planta */}
      <div
        className={`text-3xl leading-none transition-transform ${unlocked ? '' : 'grayscale opacity-40'}`}
        style={{ filter: unlocked ? 'none' : 'brightness(0.5)' }}
      >
        {species.emoji}
      </div>

      {/* Cadeado dourado sobre as plantas bloqueadas */}
      {!unlocked && (
        <div className="absolute top-1 right-0 text-base" aria-hidden>
          🔒
        </div>
      )}

      {/* Vaso */}
      <div
        className="relative w-12 h-10 rounded-b-xl rounded-t-md mt-1"
        style={{
          background: unlocked
            ? `linear-gradient(180deg, ${potColor} 0%, ${potShadow} 100%)`
            : `linear-gradient(180deg, #d1d5db 0%, #9ca3af 100%)`,
          boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.15)',
        }}
      >
        <div
          className="absolute -top-1 left-0 right-0 h-1.5 rounded-full"
          style={{ background: unlocked ? potShadow : '#6b7280', opacity: 0.7 }}
        />
      </div>

      {/* Badge raridade */}
      {unlocked && species.rarity && species.rarity !== 'common' && (
        <div
          className="absolute -top-1 -left-1 text-[8px] font-bold px-1 py-0.5 rounded-full"
          style={{
            background: species.rarity === 'epic' ? '#d7ae00' : '#92ccff',
            color: 'white',
          }}
        >
          {species.rarity === 'epic' ? 'ÉPICA' : 'RARA'}
        </div>
      )}

      {/* Nome */}
      <div
        className={`text-[10px] font-bold mt-1 text-center leading-tight ${
          unlocked ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-faint)]'
        }`}
      >
        {unlocked ? species.popularName : '???'}
      </div>
    </Link>
  )
}
