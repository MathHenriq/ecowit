import { NavLink, useNavigate } from 'react-router-dom'

/**
 * BottomNav — 6 abas + botão central de câmera flutuante (a la Duolingo).
 * 3 abas de cada lado da câmera pra ela ficar centralizada de verdade.
 * Aparece em todas as rotas autenticadas via AppLayout.
 */

const LEFT_TABS: { to: string; label: string; icon: string }[] = [
  { to: '/home',      label: 'Feed',       icon: '🏠' },
  { to: '/streak',    label: 'Hábito',     icon: '🔥' },
  { to: '/jardim',    label: 'Jardim',     icon: '🌿' },
]

const RIGHT_TABS: { to: string; label: string; icon: string }[] = [
  { to: '/catalogo',  label: 'Catálogo',   icon: '📖' },
  { to: '/perfil',    label: 'Perfil',     icon: '👤' },
  { to: '/config',    label: 'Ajustes',    icon: '⚙️' },
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
      <div className="flex items-end px-1">
        {LEFT_TABS.map((t) => (
          <TabLink key={t.to} {...t} />
        ))}

        {/* Botão central — câmera */}
        <div className="shrink-0 flex justify-center" style={{ width: 64 }}>
          <button
            onClick={() => navigate('/scan')}
            aria-label="Identificar planta"
            className="relative -mt-5"
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
        </div>

        {RIGHT_TABS.map((t) => (
          <TabLink key={t.to} {...t} />
        ))}
      </div>
    </nav>
  )
}

function TabLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-colors ${
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
          <span className="text-[9px] font-extrabold leading-none whitespace-nowrap">{label}</span>
        </>
      )}
    </NavLink>
  )
}
