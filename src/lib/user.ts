/**
 * Estado do usuário logado (mock — vai virar tabela `profiles` no Supabase).
 */

import { getStreakDays } from './streak'
import { UNLOCKED_SPECIES_IDS } from './species'

export interface UserProfile {
  name: string
  handle: string
  level: number
  xp: number
  xpToNextLevel: number
  joinedAt: string
}

export interface Badge {
  id: string
  name: string
  emoji: string
  description: string
  /** Função pura que decide se está desbloqueada com base no estado atual */
  isUnlocked: () => boolean
}

export const CURRENT_USER: UserProfile = {
  name: 'Lucas Verdejante',
  handle: 'lucasv',
  level: 12,
  xp: 2_450,
  xpToNextLevel: 3_000,
  joinedAt: '2026-03-01',
}

export const BADGES: Badge[] = [
  { id: 'primeiro-broto',   name: 'Primeiro Broto',  emoji: '🌱', description: 'Desbloqueou sua 1ª espécie',         isUnlocked: () => UNLOCKED_SPECIES_IDS.size >= 1 },
  { id: 'trio',             name: 'Trio',            emoji: '🪴', description: '3 espécies coletadas',                isUnlocked: () => UNLOCKED_SPECIES_IDS.size >= 3 },
  { id: 'dezena',           name: 'Coletor',         emoji: '🎒', description: '10 espécies coletadas',               isUnlocked: () => UNLOCKED_SPECIES_IDS.size >= 10 },
  { id: 'duas-dezenas',     name: 'Naturalista',     emoji: '🌿', description: '20 espécies coletadas',               isUnlocked: () => UNLOCKED_SPECIES_IDS.size >= 20 },
  { id: 'semana-cheia',     name: 'Semana Cheia',    emoji: '🔥', description: '7 dias seguidos regando',             isUnlocked: () => getStreakDays() >= 7 },
  { id: 'mes-cheio',        name: 'Mês Cheio',       emoji: '🏆', description: '30 dias seguidos',                    isUnlocked: () => getStreakDays() >= 30 },
  { id: 'madrugador',       name: 'Madrugador',      emoji: '🌅', description: 'Regue antes das 8h',                  isUnlocked: () => false },
  { id: 'verde-mao',        name: 'Verde-Mão',       emoji: '✋', description: 'Cuide de 5 plantas vivas',            isUnlocked: () => UNLOCKED_SPECIES_IDS.size >= 5 },
  { id: 'explorador',       name: 'Explorador',      emoji: '🔍', description: 'Escaneie 25 plantas no mundo',        isUnlocked: () => false },
  { id: 'social',           name: 'Social',          emoji: '👥', description: 'Siga 10 pessoas',                     isUnlocked: () => false },
  { id: 'pioneiro',         name: 'Pioneiro',        emoji: '🚀', description: 'Esteve aqui no lançamento',           isUnlocked: () => true },
  { id: 'lenda',            name: 'Lenda',           emoji: '👑', description: '100 dias seguidos',                   isUnlocked: () => getStreakDays() >= 100 },
]
