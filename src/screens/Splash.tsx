import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brotin } from '../components/Brotin'

/**
 * Tela de Splash — exibida por ~1.6s ao abrir o app.
 * Depois navega pra /login (ou /home se usuário já logado, futuramente).
 */
export function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => navigate('/login', { replace: true }), 1800)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <main
      className="relative flex-1 flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 50% 40%, var(--color-leaf-50) 0%, var(--color-cream) 70%)',
      }}
    >
      {/* Raios em estrela atrás do Brotin */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
        <div className="w-80 h-80 relative anim-pulse-soft">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-1.5 h-32 -translate-x-1/2 -translate-y-1/2 opacity-30"
              style={{
                background: 'linear-gradient(to bottom, var(--color-leaf-300), transparent)',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-100px)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Folhas flutuando */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl anim-float"
            style={{
              left: `${(i * 37) % 90 + 5}%`,
              top: `${(i * 53) % 80 + 5}%`,
              animationDelay: `${i * 0.3}s`,
              opacity: 0.4,
              transform: `rotate(${i * 30}deg)`,
            }}
          >
            🌿
          </div>
        ))}
      </div>

      {/* Brotin centralizado sobre disco verde */}
      <div className="relative z-10 mb-8">
        <div
          className="w-44 h-44 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, var(--color-leaf-100) 0%, var(--color-leaf-50) 100%)',
            border: '6px solid var(--color-leaf-500)',
            boxShadow: '0 8px 0 var(--color-leaf-700)',
          }}
        >
          <Brotin size={140} mood="happy" className="anim-float" />
        </div>
      </div>

      {/* Wordmark */}
      <h1
        className="text-5xl font-bold mb-2 z-10"
        style={{ color: 'var(--color-leaf-700)', letterSpacing: '-0.03em' }}
      >
        EcoWit
      </h1>

      <p className="text-sm font-medium text-[var(--color-ink-faint)] z-10 mb-12">
        plante, regue, colecione
      </p>

      {/* Loading dots */}
      <div className="absolute bottom-24 flex flex-col items-center gap-3 z-10">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-[var(--color-leaf-500)] anim-pulse-soft"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <p className="text-xs font-medium text-[var(--color-ink-faint)]">preparando seu jardim…</p>
      </div>

      <p className="absolute bottom-6 text-[10px] font-medium text-[var(--color-ink-faint)] z-10">
        v0.1 · feito com 🌿
      </p>
    </main>
  )
}
