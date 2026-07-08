/**
 * O Jardim — um único jardim 3D persistente do usuário.
 *
 * Grade de canteiros (GRID × GRID) sobre a ilha de grama. Cada planta ocupa
 * um canteiro; a posição escolhida na hora de plantar fica salva em
 * localStorage. O status (saudável/sedenta) deriva do histórico real de regas.
 */

import { SPECIES_CATALOG } from './species'
import { getWaterings, todayISO } from './streak'

export interface GardenPlant {
  speciesId: string
  /** Coordenadas de grade (0..GRID-1). */
  gx: number
  gz: number
  plantedAt: string // ISO date
}

export const GRID = 4
export const CAPACITY = GRID * GRID
/** Espaçamento entre canteiros no mundo 3D (metros). */
export const PLOT_SPACING = 0.62

const STORAGE_KEY = 'ecowit:garden'

/** Jardim inicial — plantinhas já crescidas pra receber o usuário. */
const DEFAULT_GARDEN: GardenPlant[] = [
  { speciesId: 'monstera-deliciosa', gx: 1, gz: 1, plantedAt: '2026-05-02' },
  { speciesId: 'echeveria-elegans',  gx: 2, gz: 2, plantedAt: '2026-05-10' },
  { speciesId: 'cacto-vela',         gx: 3, gz: 0, plantedAt: '2026-05-18' },
  { speciesId: 'manjericao',         gx: 0, gz: 2, plantedAt: '2026-06-01' },
  { speciesId: 'hortela',            gx: 1, gz: 3, plantedAt: '2026-06-07' },
  { speciesId: 'lavanda',            gx: 3, gz: 2, plantedAt: '2026-06-14' },
  { speciesId: 'pilea',              gx: 0, gz: 0, plantedAt: '2026-06-20' },
  { speciesId: 'espada-sao-jorge',   gx: 2, gz: 0, plantedAt: '2026-06-25' },
]

export function loadGarden(): GardenPlant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const list = JSON.parse(raw) as GardenPlant[]
      if (Array.isArray(list)) return list.filter(isValid)
    }
  } catch {
    // corrompido — volta pro padrão
  }
  return [...DEFAULT_GARDEN]
}

function isValid(p: GardenPlant): boolean {
  return (
    !!SPECIES_CATALOG.find((s) => s.id === p.speciesId) &&
    p.gx >= 0 && p.gx < GRID && p.gz >= 0 && p.gz < GRID
  )
}

function save(list: GardenPlant[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/** Planta uma espécie num canteiro vazio. Retorna o jardim atualizado. */
export function plantAt(speciesId: string, gx: number, gz: number): GardenPlant[] {
  const garden = loadGarden()
  if (garden.some((p) => p.gx === gx && p.gz === gz)) return garden // ocupado
  const next = [...garden, { speciesId, gx, gz, plantedAt: todayISO() }]
  save(next)
  return next
}

/** Posição no mundo 3D do centro de um canteiro. */
export function plotToWorld(gx: number, gz: number): { x: number; z: number } {
  const half = ((GRID - 1) / 2) * PLOT_SPACING
  return { x: gx * PLOT_SPACING - half, z: gz * PLOT_SPACING - half }
}

/* ─── Status real (deriva do histórico de regas) ─────────────── */

function daysSinceWatered(speciesId: string): number | null {
  const waterings = getWaterings().filter((w) => w.photo)
  const matching = waterings.filter((w) => w.speciesId === speciesId)
  const relevant = matching.length > 0 ? matching : waterings
  if (relevant.length === 0) return null
  const lastDate = relevant.map((w) => w.date).sort().pop()!
  const diffMs = new Date(todayISO()).getTime() - new Date(lastDate).getTime()
  return Math.round(diffMs / 86_400_000)
}

export function computePlantStatus(speciesId: string): 'healthy' | 'thirsty' {
  const waterDays = SPECIES_CATALOG.find((s) => s.id === speciesId)?.waterDays ?? 7
  const days = daysSinceWatered(speciesId)
  if (days === null) return 'thirsty'
  return days >= waterDays ? 'thirsty' : 'healthy'
}
