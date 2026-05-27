import { Link, useNavigate } from 'react-router-dom'
import { Brotin } from '../components/Brotin'
import { Card, Chip, GrowthBar } from '../components/ui'
import { BADGES, CURRENT_USER } from '../lib/user'
import { SPECIES_CATALOG, UNLOCKED_SPECIES_IDS } from '../lib/species'
import { getStreakDays } from '../lib/streak'

/**
 * Perfil do usuário — avatar Brotin, level, XP, badges, plantas favoritas.
 */
export function Perfil() {
  const navigate = useNavigate()
  const u = CURRENT_USER
  const streak = getStreakDays()
  const unlockedCount = UNLOCKED_SPECIES_IDS.size
  const unlockedBadges = BADGES.filter((b) => b.isUnlocked()).length
  const xpPercent = (u.xp / u.xpToNextLevel) * 100

  // 3 plantas favoritas (mock — pega 3 desbloqueadas com descrição)
  const favorites = SPECIES_CATALOG
    .filter((s) => UNLOCKED_SPECIES_IDS.has(s.id) && s.description)
    .slice(0, 3)

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* HEADER com gradient — agora self-contained, sem overlap */}
      <header
        className="relative px-5 pt-6 pb-6 text-white"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, var(--color-leaf-400) 0%, var(--color-leaf-700) 100%)',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px',
        }}
      >
        <button
          aria-label="Configurações"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-base z-10"
          onClick={() => navigate('/config')}
        >
          ⚙️
        </button>

        {/* Avatar Brotin */}
        <div className="flex flex-col items-center mt-2">
          <div className="relative">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
                border: '4px solid white',
                boxShadow: '0 6px 0 rgba(0,0,0,0.15)',
              }}
            >
              <Brotin size={92} mood="cheer" />
            </div>
            {/* Level chip — agora no canto superior direito DO AVATAR, sem flutuar livre */}
            <div
              className="absolute -top-1 -right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap"
              style={{
                background: 'var(--color-sun-500)',
                color: 'white',
                boxShadow: '0 2px 0 var(--color-sun-700)',
                border: '2px solid white',
              }}
            >
              ⭐ NV. {u.level}
            </div>
          </div>

          <h1 className="mt-3 text-xl font-extrabold" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.2)' }}>
            {u.name}
          </h1>
          <p className="text-xs font-bold opacity-80">@{u.handle}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 flex flex-col gap-4">
        {/* XP bar */}
        <Card padding="md">
          <div className="flex justify-between items-baseline mb-1.5">
            <div className="text-xs font-extrabold tracking-wider text-[var(--color-ink-soft)] uppercase">
              XP
            </div>
            <div className="text-xs font-bold text-[var(--color-ink-faint)]">
              Próximo: Nv. {u.level + 1}
            </div>
          </div>
          <GrowthBar value={xpPercent} label={`${u.xp.toLocaleString('pt-BR')} / ${u.xpToNextLevel.toLocaleString('pt-BR')} XP`} />
        </Card>

        {/* 3 stat cards */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard emoji="🌱" big={unlockedCount} label="espécies" />
          <StatCard emoji="🔥" big={streak} label="dias streak" />
          <StatCard emoji="🏆" big={unlockedBadges} label="conquistas" />
        </div>

        {/* Conquistas */}
        <section>
          <div className="flex justify-between items-baseline mb-2">
            <h2 className="text-xs font-extrabold tracking-wider text-[var(--color-ink-soft)] uppercase">
              Conquistas
            </h2>
            <span className="text-xs font-bold text-[var(--color-ink-faint)]">
              {unlockedBadges}/{BADGES.length}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.map((b) => {
              const unlocked = b.isUnlocked()
              return (
                <button
                  key={b.id}
                  onClick={() => alert(`${b.name}\n\n${b.description}`)}
                  className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-0.5 p-1.5 text-center transition-transform active:scale-95"
                  style={{
                    background: unlocked ? 'var(--color-cream)' : '#f3f4f6',
                    border: unlocked ? '2px solid var(--color-leaf-300)' : '2px solid #e5e7eb',
                    boxShadow: unlocked ? '0 3px 0 var(--color-leaf-500)' : '0 3px 0 #d1d5db',
                    opacity: unlocked ? 1 : 0.55,
                  }}
                >
                  <div className="text-2xl">{unlocked ? b.emoji : '🔒'}</div>
                  <div
                    className="text-[9px] font-extrabold leading-tight px-0.5"
                    style={{ color: unlocked ? 'var(--color-ink)' : '#6b7280' }}
                  >
                    {unlocked ? b.name : '???'}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Plantas favoritas */}
        {favorites.length > 0 && (
          <section>
            <div className="flex justify-between items-baseline mb-2">
              <h2 className="text-xs font-extrabold tracking-wider text-[var(--color-ink-soft)] uppercase">
                Plantas favoritas
              </h2>
              <Link to="/jardim" className="text-xs font-bold text-[var(--color-leaf-700)]">
                Ver tudo →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {favorites.map((s) => (
                <Link
                  key={s.id}
                  to={`/jardim/${s.id}`}
                  className="flex flex-col items-center bg-white rounded-2xl p-3 border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)]"
                >
                  <div className="text-3xl mb-1">{s.emoji}</div>
                  <div className="text-[11px] font-extrabold text-center leading-tight">{s.popularName}</div>
                  <Chip tone="sun" className="mt-1">Nv. {Math.floor(Math.random() * 4 + 2)}</Chip>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sair / Editar */}
        <div className="flex flex-col gap-2 mt-2">
          <button className="text-sm font-bold py-2 text-[var(--color-ink-soft)]">
            Editar perfil
          </button>
          <button
            onClick={() => {
              if (confirm('Sair da conta?')) {
                localStorage.removeItem('ecowit:onboardingDone')
                window.location.href = '/login'
              }
            }}
            className="text-sm font-bold py-2 text-red-600"
          >
            Sair
          </button>
        </div>
      </div>
    </main>
  )
}

function StatCard({ emoji, big, label }: { emoji: string; big: number; label: string }) {
  return (
    <div
      className="bg-white rounded-2xl p-3 flex flex-col items-center"
      style={{
        border: '2px solid var(--color-earth-200)',
        boxShadow: '0 3px 0 var(--color-earth-300)',
      }}
    >
      <div className="text-2xl">{emoji}</div>
      <div className="text-2xl font-extrabold leading-none mt-1">{big}</div>
      <div className="text-[10px] font-bold text-[var(--color-ink-faint)] mt-1 text-center">
        {label}
      </div>
    </div>
  )
}
