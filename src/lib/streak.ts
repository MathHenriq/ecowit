/**
 * Estado de streak (sequência) do usuário.
 * MVP: persistido em localStorage. Vai migrar pra Supabase.
 */

export interface WateringEntry {
  /** ISO date string YYYY-MM-DD */
  date: string
  /** Data URL da foto (ou null se ainda não capturou) */
  photo: string | null
  speciesId?: string
  xp: number
}

const STORAGE_KEY = 'ecowit:waterings'

export function getWaterings(): WateringEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED_WATERINGS
    return JSON.parse(raw) as WateringEntry[]
  } catch {
    return SEED_WATERINGS
  }
}

export function addWatering(entry: WateringEntry) {
  const all = getWaterings()
  // Substitui se já existe entrada do mesmo dia
  const idx = all.findIndex((e) => e.date === entry.date)
  if (idx >= 0) all[idx] = entry
  else all.push(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Conta dias consecutivos com rega até hoje (inclusivo). */
export function getStreakDays(): number {
  const waterings = getWaterings()
  const watered = new Set(waterings.filter((w) => w.photo).map((w) => w.date))
  let count = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (watered.has(iso)) count++
    else break
  }
  return count
}

/** Retorna os últimos 7 dias com info de rega (do mais antigo pro mais novo). */
export function getLast7Days(): { date: string; day: number; weekday: string; watered: boolean; isToday: boolean }[] {
  const all = getWaterings()
  const wateredSet = new Set(all.filter((w) => w.photo).map((w) => w.date))
  const today = new Date()
  const todayStr = todayISO()
  const out = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    out.push({
      date: iso,
      day: d.getDate(),
      weekday: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d.getDay()],
      watered: wateredSet.has(iso),
      isToday: iso === todayStr,
    })
  }
  return out
}

/** Mock inicial: 6 dias regados antes de hoje (pra mostrar visualmente um streak). */
const SEED_WATERINGS: WateringEntry[] = (() => {
  const out: WateringEntry[] = []
  const today = new Date()
  for (let i = 6; i >= 1; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    out.push({
      date: iso,
      photo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjNGFlMTgzIi8+PHRleHQgeD0iNDAiIHk9IjQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjMwIj7wn4yvPC90ZXh0Pjwvc3ZnPg==',
      xp: 25,
    })
  }
  return out
})()
