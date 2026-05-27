/**
 * Brotin — broto-coruja mascote do EcoWit (estilo Duolingo, mas vegetal).
 * Inspirado nos assets gerados no Stitch.
 * SVG inline para escala perfeita + customização de mood.
 */

type Mood = 'happy' | 'cheer' | 'worried' | 'sleep' | 'wave' | 'crown'

interface BrotinProps {
  size?: number
  mood?: Mood
  className?: string
}

export function Brotin({ size = 120, mood = 'happy', className }: BrotinProps) {
  // Olhos mudam por mood
  const eyes = (() => {
    switch (mood) {
      case 'sleep':
        return <path d="M68 100 Q76 96 84 100 M116 100 Q124 96 132 100" stroke="#2b1613" strokeWidth="4" fill="none" strokeLinecap="round" />
      case 'cheer':
      case 'crown':
        return (
          <>
            <path d="M68 102 Q76 92 84 102" stroke="#2b1613" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M116 102 Q124 92 132 102" stroke="#2b1613" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )
      case 'worried':
        return (
          <>
            <circle cx="76" cy="100" r="5" fill="#2b1613" />
            <circle cx="124" cy="100" r="5" fill="#2b1613" />
            <path d="M70 90 L82 95 M118 95 L130 90" stroke="#2b1613" strokeWidth="3" strokeLinecap="round" />
          </>
        )
      default:
        return (
          <>
            <circle cx="76" cy="100" r="6" fill="#2b1613" />
            <circle cx="124" cy="100" r="6" fill="#2b1613" />
            <circle cx="78" cy="98" r="2" fill="white" />
            <circle cx="126" cy="98" r="2" fill="white" />
          </>
        )
    }
  })()

  // Boca muda por mood
  const mouth = (() => {
    switch (mood) {
      case 'sleep':
        return <text x="100" y="130" textAnchor="middle" fontSize="20" fill="#2b1613">z z</text>
      case 'worried':
        return <path d="M88 128 Q100 122 112 128" stroke="#2b1613" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      case 'cheer':
        return <path d="M84 124 Q100 142 116 124" stroke="#2b1613" strokeWidth="4" fill="#f8d1cb" strokeLinecap="round" />
      default:
        return <path d="M88 126 Q100 138 112 126" stroke="#2b1613" strokeWidth="3.5" fill="#ffb4a8" strokeLinecap="round" />
    }
  })()

  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={(size / 200) * 220}
      className={className}
      role="img"
      aria-label="Brotin, o broto-coruja"
    >
      {/* Folhas/orelhas */}
      <path d="M55 50 Q40 30 50 12 Q70 22 70 50 Z" fill="#4ae183" />
      <path d="M145 50 Q160 30 150 12 Q130 22 130 50 Z" fill="#4ae183" />
      <path d="M55 50 Q60 38 64 32" stroke="#1fae5d" strokeWidth="2" fill="none" />
      <path d="M145 50 Q140 38 136 32" stroke="#1fae5d" strokeWidth="2" fill="none" />

      {/* Corpo (gota/oval verde) */}
      <ellipse cx="100" cy="125" rx="68" ry="72" fill="#2ecc71" />
      <ellipse cx="100" cy="135" rx="50" ry="55" fill="#c4ebd1" />

      {/* Olhos */}
      {eyes}

      {/* Boca */}
      {mouth}

      {/* Bracinhos */}
      <ellipse cx="42" cy="155" rx="12" ry="18" fill="#2ecc71" transform="rotate(-20 42 155)" />
      <ellipse cx="158" cy="155" rx="12" ry="18" fill="#2ecc71" transform="rotate(20 158 155)" />

      {/* Pés */}
      <ellipse cx="80" cy="200" rx="14" ry="8" fill="#6b4423" />
      <ellipse cx="120" cy="200" rx="14" ry="8" fill="#6b4423" />

      {/* Acessórios por mood */}
      {mood === 'crown' && (
        <g>
          <path d="M70 30 L80 15 L90 25 L100 10 L110 25 L120 15 L130 30 L130 42 L70 42 Z" fill="#d7ae00" stroke="#735c00" strokeWidth="2" />
          <circle cx="85" cy="30" r="3" fill="#ba1a1a" />
          <circle cx="100" cy="28" r="3" fill="#3498db" />
          <circle cx="115" cy="30" r="3" fill="#ba1a1a" />
        </g>
      )}
      {mood === 'worried' && (
        <text x="155" y="80" fontSize="20">💧</text>
      )}
    </svg>
  )
}
