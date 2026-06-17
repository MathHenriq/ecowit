import { NavLink, useNavigate } from 'react-router-dom'

/**
 * BottomNav — 5 abas + botão central de câmera flutuante (a la Duolingo).
 * Aparece em todas as rotas autenticadas via AppLayout.
 */

const TABS: { to: string; label: string; icon: string }[] = [
  { to: '/home',      label: 'Feed',       icon: '🏠' },
  { to: '/streak',    label: 'Hábito',     icon: '🔥' },
  // botão central (câmera) renderizado separadamente
  { to: '/jardim',    label: 'Jardim',     icon: '🌿' },
  { to: '/plantacao', label: 'Plantação',  icon: '🌱' },
]

export function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav
      className="sticky bottom-0 z-30 pb-safe"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,248,246,0.5) 0%, rgba(255,248,246,1) 30%)',
        backdropFilter: 'blur(20px) saturate(160%)',
        borderTop: '0.5px solid var(--color-earth-200)',
        paddingTop: 6,
        paddingBottom: 'max(env(safe-area-inset-bottom), 14px)',
      }}
    >
      <div className="flex items-center justify-around px-2">
        {TABS.slice(0, 2).map((t) => (
          <TabLink key={t.to} {...t} />
        ))}

        {/* Botão central — câmera */}
        <button
          onClick={() => navigate('/scan')}
          aria-label="Identificar planta"
          className="relative -mt-5 shrink-0"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: 'linear-gradient(180deg, var(--color-leaf-400), var(--color-leaf-600))',
              boxShadow: '0 -3px 0 var(--color-leaf-800) inset, 0 6px 14px rgba(46,204,113,0.35)',
              color: 'white',
            }}
          >
            📷
          </div>
        </button>

        {TABS.slice(2).map((t) => (
          <TabLink key={t.to} {...t} />
        ))}

        <TabLink to="/perfil" label="Perfil" icon="👤" />
      </div>
    </nav>
  )
}

function TabLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 py-1.5 px-1 min-w-[52px] transition-colors ${
          isActive ? 'text-[var(--color-leaf-700)]' : 'text-[var(--color-ink-faint)]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div
            className="relative text-xl flex items-center justify-center rounded-xl transition-colors"
            style={{
              width: 34,
              height: 28,
              background: isActive ? 'var(--color-leaf-100)' : 'transparent',
            }}
          >
            {icon}
          </div>
          <span className="text-[10px] font-extrabold">{label}</span>
        </>
      )}
    </NavLink>
  )
}
