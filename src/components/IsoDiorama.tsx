import { useMemo } from 'react'
import type { Terrain, PlantedSpot } from '../lib/terrains'
import { SPECIES_CATALOG } from '../lib/species'
import { PlantSprite } from './PlantSprite'

/**
 * Diorama isométrico estilo "garden builder" (referência: imagens fornecidas).
 *
 * Cada tile é um VOXEL CUBE de 3 faces:
 *  - top:   diamante de grama com pequenas variações de tom
 *  - left:  face de terra (mais escura, lateral esquerda)
 *  - right: face de terra (mais clara, recebe luz)
 *
 * Tiles arranjam-se em layouts orgânicos (irregular). Plantas ficam sobre o topo.
 * Fundo azul-noite com grid sutil. Glow ciano embaixo de cada bloco.
 */

interface IsoDioramaProps {
  terrain: Terrain
  foggy?: boolean
}

/* ─── Dimensões e helpers ─────────────────────────────────── */
const TILE_W = 80   // largura do diamante (de ponta a ponta)
const TILE_H = 40   // altura do diamante (de cima a baixo)
const DIRT_H = 36   // altura da face de terra (lateral)

/** Converte coords de grid (gx, gy) em posição central do topo do tile. */
function gridToScreen(gx: number, gy: number, originX: number, originY: number) {
  return {
    cx: originX + (gx - gy) * (TILE_W / 2),
    cy: originY + (gx + gy) * (TILE_H / 2),
  }
}

/* ─── Layout dos terrenos (posições de grid dos tiles) ────── */
const LAYOUTS: Record<Terrain['theme'], { gx: number; gy: number }[]> = {
  sacada: [
    { gx: 0, gy: 0 }, { gx: 1, gy: 0 }, { gx: 2, gy: 0 },
    { gx: 0, gy: 1 }, { gx: 1, gy: 1 }, { gx: 2, gy: 1 },
  ],
  quintal: [
    { gx: 0, gy: 0 }, { gx: 1, gy: 0 }, { gx: 2, gy: 0 }, { gx: 3, gy: 0 },
    { gx: 0, gy: 1 }, { gx: 1, gy: 1 }, { gx: 2, gy: 1 }, { gx: 3, gy: 1 },
    { gx: 1, gy: 2 }, { gx: 2, gy: 2 }, { gx: 3, gy: 2 }, { gx: 4, gy: 2 },
  ],
  horta: [
    { gx: 0, gy: 0 }, { gx: 1, gy: 0 }, { gx: 2, gy: 0 }, { gx: 3, gy: 0 },
    { gx: 0, gy: 1 }, { gx: 1, gy: 1 }, { gx: 2, gy: 1 }, { gx: 3, gy: 1 },
    { gx: 0, gy: 2 }, { gx: 1, gy: 2 }, { gx: 2, gy: 2 }, { gx: 3, gy: 2 },
  ],
  sitio: [
    { gx: 0, gy: 0 }, { gx: 1, gy: 0 }, { gx: 2, gy: 0 }, { gx: 3, gy: 0 }, { gx: 4, gy: 0 },
    { gx: 0, gy: 1 }, { gx: 1, gy: 1 }, { gx: 2, gy: 1 }, { gx: 3, gy: 1 }, { gx: 4, gy: 1 },
    { gx: 1, gy: 2 }, { gx: 2, gy: 2 }, { gx: 3, gy: 2 },
  ],
  reserva: [
    { gx: 0, gy: 0 }, { gx: 1, gy: 0 }, { gx: 2, gy: 0 }, { gx: 3, gy: 0 }, { gx: 4, gy: 0 },
    { gx: 0, gy: 1 }, { gx: 1, gy: 1 }, { gx: 2, gy: 1 }, { gx: 3, gy: 1 }, { gx: 4, gy: 1 },
    { gx: 0, gy: 2 }, { gx: 1, gy: 2 }, { gx: 2, gy: 2 }, { gx: 3, gy: 2 }, { gx: 4, gy: 2 },
  ],
}

/* ─── Paletas por tema (lighting + atmosfera) ─────────────── */
const THEME: Record<Terrain['theme'], {
  bgTop: string
  bgBot: string
  gridLine: string
  grassLight: string
  grassMid: string
  grassDark: string
  dirtLight: string
  dirtMid: string
  dirtDark: string
  glow: string
}> = {
  sacada: {
    bgTop: '#1a3a52',     bgBot: '#0f2236',     gridLine: 'rgba(96,165,250,0.08)',
    grassLight: '#86efac', grassMid: '#34d399',  grassDark: '#15803d',
    dirtLight: '#a87c5c',  dirtMid: '#7c4a26',   dirtDark: '#4a2f17',
    glow: 'rgba(74,222,128,0.55)',
  },
  quintal: {
    bgTop: '#16334e',     bgBot: '#0d1f33',     gridLine: 'rgba(96,165,250,0.10)',
    grassLight: '#86efac', grassMid: '#22c55e',  grassDark: '#14532d',
    dirtLight: '#a87c5c',  dirtMid: '#7c4a26',   dirtDark: '#3e2723',
    glow: 'rgba(74,222,128,0.6)',
  },
  horta: {
    bgTop: '#1f3a25',     bgBot: '#0f1f15',     gridLine: 'rgba(163,230,53,0.08)',
    grassLight: '#bef264', grassMid: '#65a30d',  grassDark: '#3f6212',
    dirtLight: '#c2783c',  dirtMid: '#92400e',   dirtDark: '#5c3a1c',
    glow: 'rgba(163,230,53,0.55)',
  },
  sitio: {
    bgTop: '#1e3a5f',     bgBot: '#0c1a2e',     gridLine: 'rgba(96,165,250,0.10)',
    grassLight: '#6ee7b7', grassMid: '#10b981',  grassDark: '#064e3b',
    dirtLight: '#b08968',  dirtMid: '#7c4a26',   dirtDark: '#5c3a1c',
    glow: 'rgba(74,222,128,0.5)',
  },
  reserva: {
    bgTop: '#0c1a2e',     bgBot: '#020617',     gridLine: 'rgba(96,165,250,0.06)',
    grassLight: '#4ade80', grassMid: '#15803d',  grassDark: '#052e16',
    dirtLight: '#7c4a26',  dirtMid: '#4a2f17',   dirtDark: '#1c0f08',
    glow: 'rgba(96,165,250,0.6)',
  },
}

export function IsoDiorama({ terrain, foggy = false }: IsoDioramaProps) {
  const t = THEME[terrain.theme]
  const layout = LAYOUTS[terrain.theme] ?? LAYOUTS.sacada

  // Calcula bounding box do layout pra centralizar a cena
  const { originX, originY, viewBoxW, viewBoxH } = useMemo(() => {
    const positions = layout.map((p) => gridToScreen(p.gx, p.gy, 0, 0))
    const xs = positions.map((p) => p.cx)
    const ys = positions.map((p) => p.cy)
    const minX = Math.min(...xs) - TILE_W / 2 - 20
    const maxX = Math.max(...xs) + TILE_W / 2 + 20
    const minY = Math.min(...ys) - 100 // espaço pras plantas altas em cima
    const maxY = Math.max(...ys) + TILE_H / 2 + DIRT_H + 40
    return {
      originX: -minX,
      originY: -minY,
      viewBoxW: maxX - minX,
      viewBoxH: maxY - minY,
    }
  }, [layout])

  // Ordena tiles back-to-front pra z-order isométrico (gx+gy menor = atrás)
  const sortedTiles = useMemo(() => {
    return [...layout].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy))
  }, [layout])

  // Agrupa plantas por tile (distribui as plantas existentes entre os tiles do layout)
  const plantsByTile = useMemo(() => {
    const map = new Map<string, PlantedSpot[]>()
    if (sortedTiles.length === 0) return map
    terrain.plants.forEach((p, i) => {
      const tile = sortedTiles[i % sortedTiles.length]
      const key = `${tile.gx},${tile.gy}`
      const list = map.get(key) ?? []
      list.push(p)
      map.set(key, list)
    })
    return map
  }, [terrain.plants, sortedTiles])

  return (
    <div className="relative w-full" style={{ aspectRatio: '4 / 3' }}>
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${t.bgTop} 0%, ${t.bgBot} 100%)`,
        }}
      >
        {/* Grid de fundo (sutil) */}
        <svg className="absolute inset-0 w-full h-full opacity-50 pointer-events-none" aria-hidden>
          <defs>
            <pattern id={`grid-${terrain.id}`} width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={t.gridLine} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${terrain.id})`} />
        </svg>

        {/* Atmosfera celestial (estrelinhas/bolhas) */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full anim-pulse-soft"
              style={{
                left: `${(i * 47) % 95}%`,
                top: `${(i * 31) % 60}%`,
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                background: 'rgba(255,255,255,0.5)',
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* SVG do diorama */}
        <svg
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Gradientes reutilizáveis */}
            <linearGradient id={`grass-top-${terrain.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={t.grassLight} />
              <stop offset="50%" stopColor={t.grassMid} />
              <stop offset="100%" stopColor={t.grassDark} />
            </linearGradient>
            <linearGradient id={`dirt-left-${terrain.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"  stopColor={t.dirtMid} />
              <stop offset="100%" stopColor={t.dirtDark} />
            </linearGradient>
            <linearGradient id={`dirt-right-${terrain.id}`} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={t.dirtLight} />
              <stop offset="100%" stopColor={t.dirtMid} />
            </linearGradient>
            <radialGradient id={`glow-${terrain.id}`} cx="50%" cy="100%" r="50%">
              <stop offset="0%" stopColor={t.glow} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            {/* Filter sedenta */}
            <filter id="thirsty-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feColorMatrix type="saturate" values="0.5" />
            </filter>
          </defs>

          {/* PASS 1: Glows ciano embaixo dos tiles (sombra/aurora) */}
          {sortedTiles.map((tile) => {
            const { cx, cy } = gridToScreen(tile.gx, tile.gy, originX, originY)
            return (
              <ellipse
                key={`glow-${tile.gx}-${tile.gy}`}
                cx={cx}
                cy={cy + DIRT_H + 6}
                rx={TILE_W / 2 + 4}
                ry={6}
                fill={`url(#glow-${terrain.id})`}
                opacity="0.85"
              />
            )
          })}

          {/* PASS 2: Tiles (voxels) */}
          {sortedTiles.map((tile) => {
            const { cx, cy } = gridToScreen(tile.gx, tile.gy, originX, originY)
            return <VoxelTile key={`tile-${tile.gx}-${tile.gy}`} cx={cx} cy={cy} themeId={terrain.id} theme={t} />
          })}

          {/* PASS 3: Plantas — ordenadas por tile (back-to-front) */}
          {sortedTiles.map((tile) => {
            const plants = plantsByTile.get(`${tile.gx},${tile.gy}`) ?? []
            const { cx, cy } = gridToScreen(tile.gx, tile.gy, originX, originY)
            return (
              <g key={`plants-${tile.gx}-${tile.gy}`}>
                {plants.map((spot, i) => {
                  const species = SPECIES_CATALOG.find((s) => s.id === spot.speciesId)
                  if (!species) return null
                  // Distribui plantas dentro do topo do tile
                  const offsets = [
                    { dx: 0, dy: -2 },
                    { dx: -14, dy: 4 },
                    { dx: 14, dy: 4 },
                    { dx: 0, dy: 10 },
                  ]
                  const off = offsets[i % offsets.length]
                  const scale = (spot.scale ?? 1) * 1.15
                  return (
                    <g key={i} transform={`translate(${cx + off.dx} ${cy + off.dy})`}>
                      <PlantSprite species={species} scale={scale} thirsty={spot.status === 'thirsty'} />
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Névoa pra bloqueados */}
      {foggy && (
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, rgba(15,34,54,0.85) 70%, rgba(15,34,54,0.98) 100%)',
            backdropFilter: 'blur(7px)',
          }}
        />
      )}
    </div>
  )
}

/* ─── Voxel Tile (3 faces) ─────────────────────────────────── */
function VoxelTile({
  cx,
  cy,
  themeId,
  theme,
}: {
  cx: number
  cy: number
  themeId: string
  theme: typeof THEME['sacada']
}) {
  const halfW = TILE_W / 2
  const halfH = TILE_H / 2

  // Pontos do diamante (topo de grama)
  const topN = { x: cx,         y: cy - halfH }
  const topE = { x: cx + halfW, y: cy }
  const topS = { x: cx,         y: cy + halfH }
  const topW = { x: cx - halfW, y: cy }

  // Pontos das laterais (descem DIRT_H)
  const botE = { x: topE.x, y: topE.y + DIRT_H }
  const botS = { x: topS.x, y: topS.y + DIRT_H }
  const botW = { x: topW.x, y: topW.y + DIRT_H }

  return (
    <g>
      {/* Face direita (mais clara — luz) */}
      <path
        d={`M ${topE.x} ${topE.y} L ${botE.x} ${botE.y} L ${botS.x} ${botS.y} L ${topS.x} ${topS.y} Z`}
        fill={`url(#dirt-right-${themeId})`}
      />
      {/* Linhas de erosão na face direita */}
      <line x1={topE.x - 2} y1={topE.y + 8}  x2={topS.x + 6}  y2={topS.y + 6}  stroke={theme.dirtDark} strokeWidth="0.8" opacity="0.4" />
      <line x1={topE.x - 6} y1={topE.y + 22} x2={topS.x + 10} y2={topS.y + 20} stroke={theme.dirtDark} strokeWidth="0.8" opacity="0.35" />

      {/* Face esquerda (mais escura — sombra) */}
      <path
        d={`M ${topW.x} ${topW.y} L ${botW.x} ${botW.y} L ${botS.x} ${botS.y} L ${topS.x} ${topS.y} Z`}
        fill={`url(#dirt-left-${themeId})`}
      />
      {/* Linhas de erosão na face esquerda */}
      <line x1={topW.x + 2} y1={topW.y + 8}  x2={topS.x - 6}  y2={topS.y + 6}  stroke="black" strokeWidth="0.8" opacity="0.25" />
      <line x1={topW.x + 6} y1={topW.y + 22} x2={topS.x - 10} y2={topS.y + 20} stroke="black" strokeWidth="0.8" opacity="0.2" />

      {/* Topo (grama — diamante) */}
      <path
        d={`M ${topN.x} ${topN.y} L ${topE.x} ${topE.y} L ${topS.x} ${topS.y} L ${topW.x} ${topW.y} Z`}
        fill={`url(#grass-top-${themeId})`}
        stroke={theme.grassDark}
        strokeWidth="0.6"
      />

      {/* Highlight sutil no topo (lado direito recebe luz) */}
      <path
        d={`M ${topN.x} ${topN.y} L ${topE.x} ${topE.y} L ${cx} ${cy} Z`}
        fill="rgba(255,255,255,0.10)"
      />

      {/* Tufos de grama (pequenos dots escuros aleatórios em posições determinísticas) */}
      {[
        { dx: -8,  dy: -4, rx: 3,   ry: 1.2 },
        { dx: 12,  dy: -2, rx: 2.5, ry: 1   },
        { dx: -4,  dy: 6,  rx: 3,   ry: 1.2 },
        { dx: 8,   dy: 8,  rx: 2.5, ry: 1.2 },
        { dx: -14, dy: 4,  rx: 2,   ry: 0.8 },
      ].map((g, i) => (
        <ellipse
          key={i}
          cx={cx + g.dx}
          cy={cy + g.dy}
          rx={g.rx}
          ry={g.ry}
          fill={theme.grassDark}
          opacity="0.35"
        />
      ))}

      {/* Mini lâminas de grama (linhas curtas claras) */}
      {[-10, -2, 6, 14].map((dx, i) => (
        <line
          key={i}
          x1={cx + dx}
          y1={cy + (i % 2 === 0 ? -3 : 5)}
          x2={cx + dx + 0.5}
          y2={cy + (i % 2 === 0 ? -7 : 1)}
          stroke={theme.grassLight}
          strokeWidth="0.8"
          opacity="0.7"
        />
      ))}

      {/* Borda inferior dos lados — toque de luz/grama caindo */}
      <line
        x1={botW.x}
        y1={botW.y - 1}
        x2={botS.x}
        y2={botS.y - 1}
        stroke={theme.grassDark}
        strokeWidth="1.5"
        opacity="0.6"
      />
      <line
        x1={botS.x}
        y1={botS.y - 1}
        x2={botE.x}
        y2={botE.y - 1}
        stroke={theme.grassDark}
        strokeWidth="1.5"
        opacity="0.4"
      />
    </g>
  )
}
