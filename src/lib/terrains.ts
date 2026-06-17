/**
 * Terrenos progressivos da Plantação.
 * Cada terreno é uma cena isométrica própria com capacidade limitada.
 */

import { getWaterings, todayISO } from './streak'
import { SPECIES_CATALOG } from './species'

export interface PlantedSpot {
  speciesId: string
  /** Posição relativa dentro do terreno isométrico (0-100 em ambos os eixos). */
  x: number
  y: number
  status: 'healthy' | 'thirsty'
  scale?: number
}

export interface Terrain {
  id: string
  name: string
  emoji: string
  unlockedAt: number
  capacity: number
  plants: PlantedSpot[]
  theme: 'sacada' | 'quintal' | 'horta' | 'sitio' | 'reserva'
}

export const USER_LEVEL = 12

export const TERRAINS: Terrain[] = [
  {
    id: 'sacada',
    name: 'Vasos da Sacada',
    emoji: '🪴',
    unlockedAt: 1,
    capacity: 6,
    theme: 'sacada',
    plants: [
      { speciesId: 'echeveria-elegans', x: 28, y: 30, status: 'healthy' },
      { speciesId: 'manjericao',        x: 58, y: 22, status: 'thirsty', scale: 1.1 },
      { speciesId: 'pilea',             x: 40, y: 48, status: 'healthy' },
      { speciesId: 'hortela',           x: 70, y: 50, status: 'healthy', scale: 0.95 },
      { speciesId: 'cacto-vela',        x: 18, y: 60, status: 'healthy', scale: 1.05 },
      { speciesId: 'echeveria-elegans', x: 80, y: 72, status: 'healthy', scale: 0.85 },
    ],
  },
  {
    id: 'quintal',
    name: 'Quintal de Casa',
    emoji: '🌳',
    unlockedAt: 5,
    capacity: 20,
    theme: 'quintal',
    plants: [
      { speciesId: 'lavanda',           x: 18, y: 25, status: 'healthy', scale: 1.15 },
      { speciesId: 'lavanda',           x: 28, y: 35, status: 'healthy', scale: 1.05 },
      { speciesId: 'cravo-defunto',     x: 45, y: 20, status: 'healthy' },
      { speciesId: 'cravo-defunto',     x: 55, y: 28, status: 'healthy', scale: 0.9 },
      { speciesId: 'narciso',           x: 70, y: 25, status: 'healthy' },
      { speciesId: 'narciso',           x: 80, y: 32, status: 'healthy', scale: 0.95 },
      { speciesId: 'strelitzia',        x: 38, y: 55, status: 'thirsty', scale: 1.3 },
      { speciesId: 'monstera-deliciosa',x: 65, y: 55, status: 'healthy', scale: 1.2 },
      { speciesId: 'manjericao',        x: 22, y: 70, status: 'healthy' },
      { speciesId: 'hortela',           x: 50, y: 75, status: 'healthy' },
      { speciesId: 'pilea',             x: 82, y: 70, status: 'healthy', scale: 0.9 },
      { speciesId: 'echeveria-elegans', x: 8,  y: 50, status: 'healthy', scale: 0.85 },
    ],
  },
  {
    id: 'horta',
    name: 'Horta Comunitária',
    emoji: '🥬',
    unlockedAt: 15,
    capacity: 40,
    theme: 'horta',
    plants: [],
  },
  {
    id: 'sitio',
    name: 'Sítio dos Amigos',
    emoji: '🏡',
    unlockedAt: 30,
    capacity: 80,
    theme: 'sitio',
    plants: [],
  },
  {
    id: 'reserva',
    name: 'Reserva Particular',
    emoji: '🌲',
    unlockedAt: 50,
    capacity: 200,
    theme: 'reserva',
    plants: [],
  },
]

export function isTerrainUnlocked(t: Terrain): boolean {
  return USER_LEVEL >= t.unlockedAt
}

/** Dias desde a última rega relevante (da própria espécie, ou geral se não houver registro específico). */
function daysSinceWatered(speciesId: string): number | null {
  const waterings = getWaterings().filter((w) => w.photo)
  const matching = waterings.filter((w) => w.speciesId === speciesId)
  const relevant = matching.length > 0 ? matching : waterings
  if (relevant.length === 0) return null
  const lastDate = relevant.map((w) => w.date).sort().pop()!
  const diffMs = new Date(todayISO()).getTime() - new Date(lastDate).getTime()
  return Math.round(diffMs / 86_400_000)
}

/** Deriva o status real (saudável/sedenta) com base no histórico de regas. */
export function computePlantStatus(speciesId: string): 'healthy' | 'thirsty' {
  const waterDays = SPECIES_CATALOG.find((s) => s.id === speciesId)?.waterDays ?? 7
  const days = daysSinceWatered(speciesId)
  if (days === null) return 'thirsty'
  return days >= waterDays ? 'thirsty' : 'healthy'
}

/** Retorna o terreno com o status de cada planta recalculado a partir de dados reais de rega. */
export function withLiveStatus(terrain: Terrain): Terrain {
  return {
    ...terrain,
    plants: terrain.plants.map((p) => ({ ...p, status: computePlantStatus(p.speciesId) })),
  }
}
