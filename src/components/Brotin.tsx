/**
 * Brotin — broto mascote do EcoWit (estilo Duolingo, mas vegetal).
 *
 * v2: visual "sticker" — gradientes de volume, contorno grosso consistente,
 * olhos grandes com brilho duplo, bochechas, broto de duas folhas na cabeça
 * e barriguinha iluminada. Mesma API de sempre (size / mood / className).
 */

type Mood = 'happy' | 'cheer' | 'worried' | 'sleep' | 'wave' | 'crown'

interface BrotinProps {
  size?: number
  mood?: Mood
  className?: string
}

const OUTLINE = '#0e6b3c'
const OUT_W = 4.5

export function Brotin({ size = 120, mood = 'happy', className }: BrotinProps) {
  const uid = mood // gradientes por mood evitam colisão de id quando há vários Brotins

  const eyes = (() => {
    switch (mood) {
      case 'sleep':
        return (
          <>
            <path d="M64 102 Q75 110 86 102" stroke="#123f26" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M114 102 Q125 110 136 102" stroke="#123f26" strokeWidth="5" fill="none" strokeLinecap="round" />
          </>
        )
      case 'cheer':
      case 'crown':
        return (
          <>
            <path d="M63 104 Q75 90 87 104" stroke="#123f26" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M113 104 Q125 90 137 104" stroke="#123f26" strokeWidth="6" fill="none" strokeLinecap="round" />
          </>
        )
      case 'worried':
        return (
          <>
            <ellipse cx="75" cy="103" rx="8.5" ry="10" fill="#123f26" />
            <ellipse cx="125" cy="103" rx="8.5" ry="10" fill="#123f26" />
            <circle cx="78" cy="99" r="3" fill="white" />
            <circle cx="128" cy="99" r="3" fill="white" />
            <path d="M64 87 Q74 92 84 90 M116 90 Q126 92 136 87" stroke="#123f26" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )
      default:
        return (
          <>
            <ellipse cx="75" cy="102" rx="9.5" ry="11.5" fill="#123f26" />
            <ellipse cx="125" cy="102" rx="9.5" ry="11.5" fill="#123f26" />
            <circle cx="78.5" cy="97.5" r="3.6" fill="white" />
            <circle cx="128.5" cy="97.5" r="3.6" fill="white" />
            <circle cx="72" cy="105" r="1.8" fill="white" opacity="0.75" />
            <circle cx="122" cy="105" r="1.8" fill="white" opacity="0.75" />
          </>
        )
    }
  })()

  const mouth = (() => {
    switch (mood) {
      case 'sleep':
        return <ellipse cx="100" cy="126" rx="5" ry="6" fill="#1c5c36" opacity="0.85" />
      case 'worried':
        return <path d="M90 130 Q100 122 110 130" stroke="#123f26" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      case 'cheer':
      case 'crown':
        return (
          <g>
            <path d="M83 121 Q100 145 117 121 Z" fill="#7a3040" stroke="#123f26" strokeWidth="4" strokeLinejoin="round" />
            <path d="M91 133 Q100 140 109 133 Q100 147 91 133 Z" fill="#ff8fa0" />
          </g>
        )
      default:
        return (
          <g>
            <path d="M89 123 Q100 136 111 123" stroke="#123f26" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M96 130 Q100 134 104 130" stroke="#ff8fa0" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        )
    }
  })()

  return (
    <svg
      viewBox="0 0 200 230"
      width={size}
      height={(size / 200) * 230}
      className={className}
      role="img"
      aria-label="Brotin, o brotinho mascote"
    >
      <defs>
        <linearGradient id={`bt-body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5fe89a" />
          <stop offset="55%" stopColor="#2ecc71" />
          <stop offset="100%" stopColor="#17a457" />
        </linearGradient>
        <radialGradient id={`bt-belly-${uid}`} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#f2fff2" />
          <stop offset="70%" stopColor="#cfeeda" />
          <stop offset="100%" stopColor="#b2e2c4" />
        </radialGradient>
        <linearGradient id={`bt-leaf-${uid}`} x1="0" y1="1" x2="0.4" y2="0">
          <stop offset="0%" stopColor="#1fae5d" />
          <stop offset="100%" stopColor="#6bfe9c" />
        </linearGradient>
        <linearGradient id={`bt-crown-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe27a" />
          <stop offset="100%" stopColor="#e8a200" />
        </linearGradient>
      </defs>

      {/* sombra no chão */}
      <ellipse cx="100" cy="213" rx="52" ry="9" fill="#0e6b3c" opacity="0.16" />

      {/* broto na cabeça: caule + duas folhas (a coroa toma o lugar dele) */}
      {mood !== 'crown' && (
        <g>
          <path d="M100 62 Q99 44 100 34" stroke={OUTLINE} strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M100 62 Q99 44 100 34" stroke="#2ecc71" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M99 38 Q68 40 62 16 Q92 8 100 34 Z" fill={`url(#bt-leaf-${uid})`} stroke={OUTLINE} strokeWidth={OUT_W} strokeLinejoin="round" />
          <path d="M96 32 Q82 28 74 20" stroke="#0e6b3c" strokeWidth="2.4" fill="none" opacity="0.55" strokeLinecap="round" />
          <path d="M101 38 Q132 40 138 16 Q108 8 100 34 Z" fill={`url(#bt-leaf-${uid})`} stroke={OUTLINE} strokeWidth={OUT_W} strokeLinejoin="round" />
          <path d="M104 32 Q118 28 126 20" stroke="#0e6b3c" strokeWidth="2.4" fill="none" opacity="0.55" strokeLinecap="round" />
        </g>
      )}

      {/* bracinhos (atrás do corpo) */}
      <ellipse
        cx="38" cy="150" rx="15" ry="22" fill="#1fae5d" stroke={OUTLINE} strokeWidth={OUT_W}
        transform={mood === 'wave' ? 'rotate(-125 38 150) translate(-6 18)' : 'rotate(-22 38 150)'}
      />
      <ellipse cx="162" cy="150" rx="15" ry="22" fill="#1fae5d" stroke={OUTLINE} strokeWidth={OUT_W} transform="rotate(22 162 150)" />

      {/* pés */}
      <ellipse cx="76" cy="205" rx="17" ry="10" fill="#8a5a34" stroke="#5c3a1c" strokeWidth="4" />
      <ellipse cx="124" cy="205" rx="17" ry="10" fill="#8a5a34" stroke="#5c3a1c" strokeWidth="4" />
      <ellipse cx="72" cy="202" rx="6" ry="3" fill="#b58152" opacity="0.9" />
      <ellipse cx="120" cy="202" rx="6" ry="3" fill="#b58152" opacity="0.9" />

      {/* corpo (gota arredondada) */}
      <path
        d="M100 58
           C 145 58 168 92 168 136
           C 168 178 138 206 100 206
           C 62 206 32 178 32 136
           C 32 92 55 58 100 58 Z"
        fill={`url(#bt-body-${uid})`}
        stroke={OUTLINE}
        strokeWidth={OUT_W}
      />
      {/* brilho no topo do corpo */}
      <path d="M62 84 Q78 66 102 64" stroke="#b8ffd6" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.65" />

      {/* barriga */}
      <path
        d="M100 92
           C 130 92 148 114 148 143
           C 148 174 126 194 100 194
           C 74 194 52 174 52 143
           C 52 114 70 92 100 92 Z"
        fill={`url(#bt-belly-${uid})`}
      />

      {/* olhos + boca */}
      {eyes}
      {mouth}

      {/* bochechas */}
      {mood !== 'worried' && (
        <>
          <ellipse cx="60" cy="119" rx="8.5" ry="5.5" fill="#ff9d8a" opacity="0.55" />
          <ellipse cx="140" cy="119" rx="8.5" ry="5.5" fill="#ff9d8a" opacity="0.55" />
        </>
      )}

      {/* acessórios por mood */}
      {mood === 'sleep' && (
        <g fill="#1fae5d" fontWeight="800" fontFamily="inherit">
          <text x="148" y="70" fontSize="20" transform="rotate(12 148 70)">z</text>
          <text x="162" y="52" fontSize="26" transform="rotate(18 162 52)">Z</text>
        </g>
      )}
      {mood === 'worried' && (
        <path d="M158 78 Q166 90 158 97 Q150 90 158 78 Z" fill="#7ec8ff" stroke="#3498db" strokeWidth="3" strokeLinejoin="round" />
      )}
      {mood === 'crown' && (
        <g transform="translate(0 -4)">
          <path
            d="M70 34 L79 16 L92 27 L100 10 L108 27 L121 16 L130 34 L128 46 L72 46 Z"
            fill={`url(#bt-crown-${uid})`}
            stroke="#9a6b00"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <circle cx="85" cy="34" r="3.4" fill="#e84855" />
          <circle cx="100" cy="31" r="3.4" fill="#3498db" />
          <circle cx="115" cy="34" r="3.4" fill="#e84855" />
        </g>
      )}
    </svg>
  )
}
