/**
 * PlantSprite — sprites SVG de plantas no estilo Growdoro/Forest.
 * Isométrico-friendly, com gradientes, sombras e silhuetas reconhecíveis.
 * Cada planta é renderizada dentro de um <g> e posicionada pelo pai.
 */

import type { Species, SpeciesCategory } from '../lib/species'

interface PlantSpriteProps {
  species: Species
  scale?: number
  thirsty?: boolean
}

export function PlantSprite({ species, scale = 1, thirsty = false }: PlantSpriteProps) {
  const filter = thirsty ? 'url(#thirsty-filter)' : undefined
  // Renderiza a planta certa por id, com fallback por categoria
  const renderer = SPRITES[species.id] ?? CATEGORY_FALLBACK[species.category]
  return (
    <g transform={`scale(${scale})`} style={{ filter, opacity: thirsty ? 0.85 : 1 }}>
      {renderer()}
    </g>
  )
}

/* ────────────────────────────────────────────────────────
   Sprites individuais por espécie (silhuetas reconhecíveis)
   Centro: (0, 0). Cresce pra cima (negativo Y). Sombra fica embaixo.
   ──────────────────────────────────────────────────────── */

const Lavanda = () => (
  <g>
    {/* sombra base */}
    <ellipse cx="0" cy="2" rx="14" ry="3" fill="rgba(0,0,0,0.18)" />
    {/* folhas verdes na base */}
    <path d="M -10 0 Q -12 -8 -6 -10 Q -8 -4 -4 0 Z" fill="#2ecc71" />
    <path d="M 10 0 Q 12 -8 6 -10 Q 8 -4 4 0 Z" fill="#2ecc71" />
    <path d="M -4 0 Q -3 -10 0 -12 Q 3 -10 4 0 Z" fill="#4ae183" />
    {/* hastes roxas */}
    {[-6, -2, 2, 6].map((x, i) => (
      <g key={i}>
        <rect x={x - 0.6} y={-22} width="1.2" height="14" fill="#1fae5d" />
        {/* florzinhas roxas em cluster */}
        {[0, 3, 6, 9].map((dy) => (
          <circle key={dy} cx={x} cy={-22 - dy * 1.2} r="2.2" fill="#a855f7" />
        ))}
        <circle cx={x} cy={-31} r="1.6" fill="#c084fc" />
      </g>
    ))}
  </g>
)

const CravoDefunto = () => (
  <g>
    <ellipse cx="0" cy="2" rx="13" ry="3" fill="rgba(0,0,0,0.18)" />
    {/* folhas */}
    <path d="M -10 -2 Q -14 -10 -6 -12 Q -10 -6 -4 -3 Z" fill="#2ecc71" />
    <path d="M 10 -2 Q 14 -10 6 -12 Q 10 -6 4 -3 Z" fill="#2ecc71" />
    <path d="M 0 -2 Q -3 -10 0 -14 Q 3 -10 0 -2 Z" fill="#4ae183" />
    {/* flores laranja (multi-camada) */}
    <circle cx="-5" cy="-14" r="5" fill="#c2410c" />
    <circle cx="-5" cy="-14" r="3.5" fill="#f97316" />
    <circle cx="-5" cy="-14" r="2" fill="#fbbf24" />
    <circle cx="6" cy="-16" r="5.5" fill="#c2410c" />
    <circle cx="6" cy="-16" r="4" fill="#f97316" />
    <circle cx="6" cy="-16" r="2.2" fill="#fbbf24" />
    <circle cx="0" cy="-22" r="4.5" fill="#c2410c" />
    <circle cx="0" cy="-22" r="3" fill="#f97316" />
    <circle cx="0" cy="-22" r="1.8" fill="#fbbf24" />
  </g>
)

const Narciso = () => (
  <g>
    <ellipse cx="0" cy="2" rx="10" ry="2.5" fill="rgba(0,0,0,0.18)" />
    {/* folhas finas verticais */}
    <path d="M -3 0 L -2 -18" stroke="#2ecc71" strokeWidth="2" strokeLinecap="round" />
    <path d="M 3 0 L 2 -19" stroke="#2ecc71" strokeWidth="2" strokeLinecap="round" />
    <path d="M 0 0 L 0 -16" stroke="#1fae5d" strokeWidth="2" strokeLinecap="round" />
    {/* haste central */}
    <path d="M 0 0 L 0 -22" stroke="#1fae5d" strokeWidth="1.5" />
    {/* flor branca em estrela */}
    {[0, 72, 144, 216, 288].map((deg, i) => (
      <ellipse
        key={i}
        cx="0"
        cy="-26"
        rx="2.5"
        ry="6"
        fill="#fafafa"
        transform={`rotate(${deg} 0 -22)`}
      />
    ))}
    <circle cx="0" cy="-22" r="3" fill="#fbbf24" />
    <circle cx="0" cy="-22" r="1.6" fill="#f59e0b" />
  </g>
)

const Strelitzia = () => (
  <g>
    <ellipse cx="0" cy="2" rx="16" ry="3" fill="rgba(0,0,0,0.18)" />
    {/* folhas grandes ovais (tropical) */}
    <ellipse cx="-8" cy="-10" rx="6" ry="13" fill="#1fae5d" transform="rotate(-25 -8 -10)" />
    <ellipse cx="8" cy="-10" rx="6" ry="13" fill="#2ecc71" transform="rotate(25 8 -10)" />
    <ellipse cx="0" cy="-13" rx="6" ry="15" fill="#4ae183" />
    {/* nervura */}
    <line x1="0" y1="0" x2="0" y2="-26" stroke="#006d37" strokeWidth="0.8" />
    {/* flor laranja/azul ave-do-paraíso */}
    <path d="M 0 -22 L 6 -28 L 4 -23 L 9 -25 L 5 -20 Z" fill="#f97316" />
    <path d="M 4 -23 L 8 -22 L 5 -19 Z" fill="#3b82f6" />
  </g>
)

const Monstera = () => (
  <g>
    <ellipse cx="0" cy="2" rx="18" ry="4" fill="rgba(0,0,0,0.18)" />
    {/* 3 folhas grandes com "buracos" típicos da Monstera */}
    <g transform="rotate(-30)">
      <ellipse cx="0" cy="-12" rx="9" ry="13" fill="#1fae5d" />
      <circle cx="-3" cy="-10" r="1.5" fill="#c4ebd1" />
      <circle cx="2" cy="-14" r="1.5" fill="#c4ebd1" />
      <path d="M 0 -22 L 0 0" stroke="#006d37" strokeWidth="0.6" />
    </g>
    <g transform="rotate(20)">
      <ellipse cx="0" cy="-16" rx="10" ry="14" fill="#2ecc71" />
      <circle cx="-3" cy="-12" r="1.6" fill="#c4ebd1" />
      <circle cx="3" cy="-18" r="1.6" fill="#c4ebd1" />
      <circle cx="0" cy="-22" r="1.4" fill="#c4ebd1" />
    </g>
  </g>
)

const Echeveria = () => (
  <g>
    <ellipse cx="0" cy="2" rx="9" ry="2.5" fill="rgba(0,0,0,0.18)" />
    {/* vaso terracota pequeno */}
    <path d="M -7 0 L -5 -6 L 5 -6 L 7 0 Z" fill="#c87060" />
    <ellipse cx="0" cy="-6" rx="5" ry="1.2" fill="#8b4a3e" />
    {/* rosa de pétalas verde-acinzentada */}
    {[0, 60, 120, 180, 240, 300].map((deg, i) => (
      <ellipse
        key={i}
        cx="0"
        cy="-12"
        rx="2.5"
        ry="5"
        fill="#86efac"
        stroke="#22c55e"
        strokeWidth="0.5"
        transform={`rotate(${deg} 0 -8)`}
      />
    ))}
    {[0, 90, 180, 270].map((deg, i) => (
      <ellipse
        key={i}
        cx="0"
        cy="-10"
        rx="1.8"
        ry="3.5"
        fill="#bbf7d0"
        transform={`rotate(${deg} 0 -8)`}
      />
    ))}
    <circle cx="0" cy="-8" r="1.5" fill="#fda4af" />
  </g>
)

const CactoVela = () => (
  <g>
    <ellipse cx="0" cy="2" rx="9" ry="2.5" fill="rgba(0,0,0,0.18)" />
    {/* vaso */}
    <path d="M -7 0 L -5 -6 L 5 -6 L 7 0 Z" fill="#c87060" />
    {/* coluna principal */}
    <path d="M -4 -6 L -4 -24 Q -4 -28 0 -28 Q 4 -28 4 -24 L 4 -6 Z" fill="#16a34a" />
    {/* costelas verticais (linhas) */}
    <line x1="-2" y1="-7" x2="-2" y2="-26" stroke="#15803d" strokeWidth="0.8" />
    <line x1="0"  y1="-7" x2="0"  y2="-27" stroke="#15803d" strokeWidth="0.8" />
    <line x1="2"  y1="-7" x2="2"  y2="-26" stroke="#15803d" strokeWidth="0.8" />
    {/* braço lateral */}
    <path d="M 4 -16 Q 8 -16 8 -20 L 8 -24 Q 8 -26 6 -26 L 6 -22 L 4 -22 Z" fill="#16a34a" />
    {/* flor amarela no topo */}
    <circle cx="0" cy="-30" r="3" fill="#fbbf24" />
    <circle cx="0" cy="-30" r="1.5" fill="#f59e0b" />
    {/* espinhos */}
    {[-3, -1, 1, 3].map((x, i) => (
      <line key={i} x1={x} y1={-10 - i * 4} x2={x + 0.5} y2={-9 - i * 4} stroke="white" strokeWidth="0.4" />
    ))}
  </g>
)

const Manjericao = () => (
  <g>
    <ellipse cx="0" cy="2" rx="11" ry="2.5" fill="rgba(0,0,0,0.18)" />
    <path d="M -8 0 L -6 -5 L 6 -5 L 8 0 Z" fill="#9ca3af" />
    {/* folhas em cluster bushy */}
    <ellipse cx="-4" cy="-10" rx="4" ry="5" fill="#22c55e" />
    <ellipse cx="4"  cy="-10" rx="4" ry="5" fill="#16a34a" />
    <ellipse cx="0"  cy="-13" rx="4.5" ry="5.5" fill="#4ade80" />
    <ellipse cx="-5" cy="-15" rx="3" ry="4" fill="#22c55e" />
    <ellipse cx="5"  cy="-15" rx="3" ry="4" fill="#22c55e" />
    <ellipse cx="0"  cy="-18" rx="3.5" ry="4" fill="#86efac" />
    {/* veias */}
    <line x1="0" y1="-5" x2="0" y2="-20" stroke="#15803d" strokeWidth="0.5" />
  </g>
)

const Hortela = () => (
  <g>
    <ellipse cx="0" cy="2" rx="11" ry="2.5" fill="rgba(0,0,0,0.18)" />
    <path d="M -8 0 L -6 -5 L 6 -5 L 8 0 Z" fill="#9ca3af" />
    {/* folhinhas dentadas pequenas (várias) */}
    {[
      { x: -5, y: -8, r: 0 },
      { x: 5, y: -9, r: 15 },
      { x: 0, y: -12, r: 0 },
      { x: -6, y: -14, r: -20 },
      { x: 5, y: -15, r: 20 },
      { x: 0, y: -18, r: 0 },
    ].map((p, i) => (
      <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.r})`}>
        <ellipse cx="0" cy="0" rx="3" ry="4" fill="#22c55e" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="#16a34a" strokeWidth="0.4" />
        {/* dentes */}
        <path d="M -3 -2 L -4 -2 M -3 0 L -4 0 M -3 2 L -4 2" stroke="#16a34a" strokeWidth="0.3" />
      </g>
    ))}
  </g>
)

const Pilea = () => (
  <g>
    <ellipse cx="0" cy="2" rx="10" ry="2.5" fill="rgba(0,0,0,0.18)" />
    <path d="M -7 0 L -5 -5 L 5 -5 L 7 0 Z" fill="#c87060" />
    {/* hastes finas com "moedinhas" redondas no topo */}
    {[
      { x: -4, y: -6, h: 8 },
      { x: 0, y: -6, h: 10 },
      { x: 4, y: -6, h: 7 },
      { x: -2, y: -6, h: 11 },
      { x: 3, y: -6, h: 9 },
    ].map((p, i) => (
      <g key={i}>
        <line x1={p.x} y1={p.y} x2={p.x} y2={p.y - p.h} stroke="#16a34a" strokeWidth="0.6" />
        <circle cx={p.x} cy={p.y - p.h} r="3" fill="#4ade80" stroke="#16a34a" strokeWidth="0.4" />
        <circle cx={p.x - 0.7} cy={p.y - p.h - 0.7} r="0.8" fill="#86efac" />
      </g>
    ))}
  </g>
)

// fallback genéricos por categoria
const GenericFlower = () => (
  <g>
    <ellipse cx="0" cy="2" rx="10" ry="2.5" fill="rgba(0,0,0,0.18)" />
    <line x1="0" y1="0" x2="0" y2="-15" stroke="#16a34a" strokeWidth="1.5" />
    <ellipse cx="-4" cy="-6" rx="3" ry="5" fill="#22c55e" transform="rotate(-30 -4 -6)" />
    <ellipse cx="4" cy="-6" rx="3" ry="5" fill="#22c55e" transform="rotate(30 4 -6)" />
    {[0, 72, 144, 216, 288].map((d, i) => (
      <ellipse key={i} cx="0" cy="-22" rx="2.5" ry="5" fill="#f472b6" transform={`rotate(${d} 0 -18)`} />
    ))}
    <circle cx="0" cy="-18" r="2.5" fill="#fbbf24" />
  </g>
)

const GenericSucculent = () => (
  <g>
    <ellipse cx="0" cy="2" rx="9" ry="2.5" fill="rgba(0,0,0,0.18)" />
    <path d="M -7 0 L -5 -6 L 5 -6 L 7 0 Z" fill="#c87060" />
    {[0, 90, 180, 270].map((d, i) => (
      <ellipse key={i} cx="0" cy="-12" rx="3" ry="6" fill="#86efac" transform={`rotate(${d} 0 -8)`} />
    ))}
    <circle cx="0" cy="-8" r="2" fill="#22c55e" />
  </g>
)

const GenericTropical = () => (
  <g>
    <ellipse cx="0" cy="2" rx="14" ry="3" fill="rgba(0,0,0,0.18)" />
    <ellipse cx="-6" cy="-10" rx="5" ry="12" fill="#16a34a" transform="rotate(-20 -6 -10)" />
    <ellipse cx="6" cy="-10" rx="5" ry="12" fill="#22c55e" transform="rotate(20 6 -10)" />
    <ellipse cx="0" cy="-14" rx="5" ry="13" fill="#4ade80" />
  </g>
)

const GenericHerb = () => (
  <g>
    <ellipse cx="0" cy="2" rx="10" ry="2.5" fill="rgba(0,0,0,0.18)" />
    <path d="M -7 0 L -5 -5 L 5 -5 L 7 0 Z" fill="#9ca3af" />
    <ellipse cx="-3" cy="-9" rx="4" ry="5" fill="#22c55e" />
    <ellipse cx="3" cy="-9" rx="4" ry="5" fill="#4ade80" />
    <ellipse cx="0" cy="-13" rx="4" ry="5" fill="#86efac" />
  </g>
)

const GenericCactus = () => (
  <g>
    <ellipse cx="0" cy="2" rx="9" ry="2.5" fill="rgba(0,0,0,0.18)" />
    <path d="M -7 0 L -5 -6 L 5 -6 L 7 0 Z" fill="#c87060" />
    <path d="M -4 -6 L -4 -22 Q -4 -26 0 -26 Q 4 -26 4 -22 L 4 -6 Z" fill="#16a34a" />
    <line x1="-2" y1="-8" x2="-2" y2="-24" stroke="#15803d" strokeWidth="0.6" />
    <line x1="2" y1="-8" x2="2" y2="-24" stroke="#15803d" strokeWidth="0.6" />
  </g>
)

const GenericTree = () => (
  <g>
    <ellipse cx="0" cy="2" rx="14" ry="3" fill="rgba(0,0,0,0.18)" />
    <rect x="-2" y="-6" width="4" height="14" fill="#6b4423" />
    <circle cx="0" cy="-18" r="14" fill="#16a34a" />
    <circle cx="-7" cy="-14" r="6" fill="#22c55e" />
    <circle cx="7" cy="-14" r="6" fill="#22c55e" />
    <circle cx="0" cy="-22" r="6" fill="#4ade80" />
  </g>
)

/* ─── Dicionário ─────────────────────────────────────────── */
const SPRITES: Record<string, () => JSX.Element> = {
  lavanda: Lavanda,
  'cravo-defunto': CravoDefunto,
  narciso: Narciso,
  strelitzia: Strelitzia,
  'monstera-deliciosa': Monstera,
  'echeveria-elegans': Echeveria,
  'cacto-vela': CactoVela,
  manjericao: Manjericao,
  hortela: Hortela,
  pilea: Pilea,
}

const CATEGORY_FALLBACK: Record<SpeciesCategory, () => JSX.Element> = {
  flor: GenericFlower,
  suculenta: GenericSucculent,
  tropical: GenericTropical,
  erva: GenericHerb,
  cacto: GenericCactus,
  arvore: GenericTree,
}
