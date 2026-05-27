import { useMemo } from 'react'
import type { Terrain, PlantedSpot } from '../lib/terrains'
import { SPECIES_CATALOG, type Species } from '../lib/species'
import { PlantSprite } from './PlantSprite'

/**
 * Diorama isométrico estilo Growdoro/Forest.
 * - Ilha orgânica composta por múltiplos tiles diamantes conectados
 * - Grama texturada (tons + tufos)
 * - Plantas SVG ilustradas (não emoji), ordenadas por Y para "z-index" isométrico
 */

interface IsoDioramaProps {
  terrain: Terrain
  foggy?: boolean
}

const THEME: Record<Terrain['theme'], {
  skyTop: string
  skyBot: string
  grassLight: string
  grassMid: string
  grassDark: string
  earthLight: string
  earthDark: string
  pathColor: string
}> = {
  sacada: {
    skyTop: '#fff8f6', skyBot: '#c4ebd1',
    grassLight: '#86efac', grassMid: '#22c55e', grassDark: '#15803d',
    earthLight: '#8b5a2b', earthDark: '#4a2f17',
    pathColor: '#a85e3a',
  },
  quintal: {
    skyTop: '#e0f2fe', skyBot: '#bbf7d0',
    grassLight: '#86efac', grassMid: '#16a34a', grassDark: '#14532d',
    earthLight: '#8b5a2b', earthDark: '#3e2723',
    pathColor: '#a85e3a',
  },
  horta: {
    skyTop: '#fef3c7', skyBot: '#bbf7d0',
    grassLight: '#a3e635', grassMid: '#65a30d', grassDark: '#3f6212',
    earthLight: '#a16207', earthDark: '#5c3a1c',
    pathColor: '#a85e3a',
  },
  sitio: {
    skyTop: '#fce7f3', skyBot: '#a7f3d0',
    grassLight: '#6ee7b7', grassMid: '#10b981', grassDark: '#064e3b',
    earthLight: '#a87c5c', earthDark: '#5c3a1c',
    pathColor: '#a85e3a',
  },
  reserva: {
    skyTop: '#1e3a8a', skyBot: '#065f46',
    grassLight: '#22c55e', grassMid: '#15803d', grassDark: '#052e16',
    earthLight: '#5c3a1c', earthDark: '#2e1c0e',
    pathColor: '#7c4a26',
  },
}

export function IsoDiorama({ terrain, foggy = false }: IsoDioramaProps) {
  const t = THEME[terrain.theme]

  // Ordena plantas por Y crescente — quem está mais "atrás" (Y menor) é desenhado primeiro
  const sortedPlants = useMemo(
    () => [...terrain.plants].sort((a, b) => a.y - b.y),
    [terrain.plants]
  )

  return (
    <div className="relative w-full" style={{ aspectRatio: '4 / 3' }}>
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${t.skyTop} 0%, ${t.skyBot} 100%)` }}
      >
        {/* Sol/lua */}
        <div
          className="absolute top-5 right-7 w-12 h-12 rounded-full"
          style={{
            background: terrain.theme === 'reserva'
              ? 'radial-gradient(circle, #fef9c3 0%, #fbbf24 70%, transparent 100%)'
              : 'radial-gradient(circle, #fff7ed 0%, #fbbf24 60%, transparent 100%)',
            boxShadow: '0 0 32px rgba(251,191,36,0.4)',
          }}
        />

        {/* Nuvens (não na reserva) */}
        {terrain.theme !== 'reserva' && (
          <>
            <div className="absolute top-6 left-8 text-3xl opacity-80">☁️</div>
            <div className="absolute top-14 left-24 text-2xl opacity-50">☁️</div>
            <div className="absolute top-3 left-1/2 text-2xl opacity-60">☁️</div>
          </>
        )}

        <svg
          viewBox="0 0 400 300"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={`grass-top-${terrain.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={t.grassLight} />
              <stop offset="60%" stopColor={t.grassMid} />
              <stop offset="100%" stopColor={t.grassDark} />
            </linearGradient>
            <linearGradient id={`earth-${terrain.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={t.earthLight} />
              <stop offset="100%" stopColor={t.earthDark} />
            </linearGradient>
            {/* Filter pra plantas sedentas */}
            <filter id="thirsty-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feColorMatrix type="saturate" values="0.45" />
            </filter>
          </defs>

          {/* ─── ILHA: multi-tile orgânico ─────────────────────── */}
          {/* Camada de TERRA (sides expostos) */}
          <path
            d={LANDMASS_EARTH_PATH}
            fill={`url(#earth-${terrain.id})`}
          />
          {/* Linhas de erosão na terra */}
          <path d="M 55 195 Q 200 215 345 195" stroke={t.earthDark} strokeWidth="1.2" fill="none" opacity="0.5" />
          <path d="M 75 210 Q 200 228 325 210" stroke={t.earthDark} strokeWidth="1" fill="none" opacity="0.35" />

          {/* Camada de GRAMA (topo) */}
          <path
            d={LANDMASS_GRASS_PATH}
            fill={`url(#grass-top-${terrain.id})`}
          />

          {/* Highlight (luz no topo direito) */}
          <path
            d="M 200 80 L 340 160 L 260 160 Z"
            fill="rgba(255,255,255,0.18)"
          />

          {/* ─── TEXTURA: tufos de grama escura espalhados ─── */}
          {GRASS_TUFTS.map((g, i) => (
            <ellipse
              key={i}
              cx={g.x}
              cy={g.y}
              rx={g.rx}
              ry={g.ry}
              fill={t.grassDark}
              opacity="0.35"
            />
          ))}
          {/* Mini blades de grama (linhas curtas) */}
          {GRASS_BLADES.map((b, i) => (
            <line
              key={i}
              x1={b.x}
              y1={b.y}
              x2={b.x + b.dx}
              y2={b.y - 2.5}
              stroke={t.grassLight}
              strokeWidth="0.8"
              opacity="0.7"
            />
          ))}

          {/* Pedras decorativas */}
          <ellipse cx="105" cy="178" rx="7" ry="3.5" fill="#9ca3af" />
          <ellipse cx="103" cy="176" rx="6" ry="2.5" fill="#d1d5db" />
          <ellipse cx="295" cy="172" rx="6" ry="3" fill="#9ca3af" />
          <ellipse cx="293" cy="170" rx="5" ry="2" fill="#d1d5db" />
          <circle cx="200" cy="195" r="3" fill="#9ca3af" />

          {/* Caminho de tábuas (apenas Sacada/Quintal) */}
          {(terrain.theme === 'sacada' || terrain.theme === 'quintal') && (
            <g>
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i} transform={`translate(${235 + i * 14} ${165 + i * 7})`}>
                  <rect x="-9" y="-2.5" width="18" height="5" rx="1.5" fill={t.pathColor} transform="rotate(-26)" />
                  <rect x="-9" y="-3" width="18" height="1" rx="0.5" fill="rgba(255,255,255,0.2)" transform="rotate(-26)" />
                </g>
              ))}
            </g>
          )}

          {/* Mini lago (Quintal+) */}
          {(terrain.theme === 'quintal' || terrain.theme === 'sitio' || terrain.theme === 'reserva') && (
            <g transform="translate(100 160)">
              <ellipse cx="0" cy="0" rx="18" ry="8" fill="#1e40af" />
              <ellipse cx="0" cy="-1.5" rx="15" ry="6" fill="#3b82f6" />
              <ellipse cx="0" cy="-2.5" rx="11" ry="4" fill="#60a5fa" />
              <ellipse cx="-3" cy="-3.5" rx="3" ry="1" fill="white" opacity="0.7" />
              <ellipse cx="4" cy="-2" rx="2" ry="0.6" fill="white" opacity="0.5" />
            </g>
          )}

          {/* Borboletas (animadas via CSS) */}
          <text x="280" y="105" fontSize="14" className="anim-float">🦋</text>
          <text x="155" y="95" fontSize="13" className="anim-float" style={{ animationDelay: '0.8s' }}>🦋</text>

          {/* ─── PLANTAS (sprites SVG, ordenadas por Y) ────────── */}
          {sortedPlants.map((spot, i) => {
            const species = SPECIES_CATALOG.find((s) => s.id === spot.speciesId)
            if (!species) return null
            const { sx, sy } = projectToSvg(spot.x, spot.y)
            return (
              <g key={i} transform={`translate(${sx} ${sy})`}>
                <PlantSprite species={species} scale={spot.scale ?? 1} thirsty={spot.status === 'thirsty'} />
              </g>
            )
          })}

          {/* Slots vazios (3 marcadores) */}
          {terrain.plants.length > 0 && terrain.plants.length < terrain.capacity && (
            <EmptySlots terrain={terrain} />
          )}
        </svg>
      </div>

      {/* Névoa pra bloqueados */}
      {foggy && (
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.85) 70%, rgba(255,248,246,0.98) 100%)',
            backdropFilter: 'blur(7px) grayscale(50%)',
          }}
        />
      )}
    </div>
  )
}

/* ─── Helpers de geometria ──────────────────────────────────── */

/**
 * Mapeia coordenadas relativas do terreno (0-100, 0-100) em coordenadas SVG (0-400, 0-300).
 * A área plantável é a parte superior do losango da grama: aprox. x ∈ [80, 320], y ∈ [90, 220].
 */
function projectToSvg(localX: number, localY: number) {
  // Centro do losango (200, 155). Distorção isométrica: variação em X é maior que em Y.
  const cx = 200
  const cy = 155
  const halfW = 130 // largura útil
  const halfH = 60  // altura útil (mais comprimida pelo iso)
  const nx = (localX - 50) / 50  // -1..1
  const ny = (localY - 50) / 50  // -1..1
  // Aplica perspectiva isométrica clássica
  const sx = cx + (nx - ny) * halfW * 0.5
  const sy = cy + (nx + ny) * halfH * 0.5
  return { sx, sy }
}

/* ─── Path da ilha (compartilhado, orgânico) ────────────────── */

// Topo da grama: contorno irregular (não um losango perfeito)
const LANDMASS_GRASS_PATH = `
  M 50 160
  Q 70 90 200 80
  Q 330 90 350 160
  Q 280 215 200 235
  Q 120 215 50 160 Z
`

// Camada de terra exposta (mesmo formato, deslocado pra baixo)
const LANDMASS_EARTH_PATH = `
  M 50 160
  Q 70 90 200 80
  Q 330 90 350 160
  L 350 195
  Q 280 250 200 270
  Q 120 250 50 195 Z
`

/* ─── Tufos de grama escura espalhados (decoração) ──────────── */
const GRASS_TUFTS = [
  { x: 95, y: 145, rx: 6, ry: 2 },
  { x: 165, y: 130, rx: 5, ry: 1.8 },
  { x: 230, y: 130, rx: 6, ry: 2 },
  { x: 305, y: 150, rx: 7, ry: 2.2 },
  { x: 130, y: 180, rx: 5, ry: 1.6 },
  { x: 270, y: 180, rx: 6, ry: 2 },
  { x: 200, y: 215, rx: 7, ry: 2.2 },
  { x: 75, y: 175, rx: 4, ry: 1.4 },
  { x: 335, y: 178, rx: 4.5, ry: 1.6 },
  { x: 175, y: 100, rx: 4, ry: 1.4 },
]

/* ─── Mini lâminas de grama (variação visual) ───────────────── */
const GRASS_BLADES = (() => {
  const out: { x: number; y: number; dx: number }[] = []
  // distribui umas 40 lâminas aleatórias mas determinísticas
  const seed = (n: number) => Math.sin(n * 999.13) * 10000 - Math.floor(Math.sin(n * 999.13) * 10000)
  for (let i = 0; i < 40; i++) {
    const x = 60 + seed(i + 1) * 280
    const y = 100 + seed(i + 7) * 130
    const dx = (seed(i + 13) - 0.5) * 2
    out.push({ x, y, dx })
  }
  return out
})()

/* ─── Slots vazios (indicadores "tem espaço pra plantar") ───── */
function EmptySlots({ terrain }: { terrain: Terrain }) {
  const positions = [
    { x: 50, y: 35 },
    { x: 88, y: 60 },
    { x: 30, y: 85 },
  ]
  return (
    <>
      {positions.map((p, i) => {
        const { sx, sy } = projectToSvg(p.x, p.y)
        return (
          <g key={i} transform={`translate(${sx} ${sy})`} opacity="0.5">
            <ellipse cx="0" cy="2" rx="9" ry="3" fill="none" stroke="white" strokeWidth="1.6" strokeDasharray="3 3" />
            <text x="0" y="-3" fontSize="11" textAnchor="middle" fill="white" fontWeight="bold">+</text>
          </g>
        )
      })}
    </>
  )
}
