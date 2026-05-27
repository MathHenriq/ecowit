import { Link } from 'react-router-dom'
import { Brotin } from '../components/Brotin'
import { Card, Chip } from '../components/ui'
import {
  getLast7Days,
  getStreakDays,
  getWaterings,
  todayISO,
} from '../lib/streak'

/**
 * Streak / Hábito — núcleo Duolingo do app.
 * Mostra dias consecutivos, semana atual, fotos recentes e CTA pra registrar hoje.
 */
export function Streak() {
  const streak = getStreakDays()
  const week = getLast7Days()
  const allWaterings = getWaterings()
  const recentPhotos = allWaterings
    .filter((w) => w.photo)
    .slice(-9)
    .reverse()

  const today = todayISO()
  const todayDone = allWaterings.some((w) => w.date === today && w.photo)

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold leading-tight">Ofensiva</h1>
        <p className="text-sm text-[var(--color-ink-faint)]">
          Rega todo dia. Brotin tá de olho 👀
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        {/* HERO — número grande do streak */}
        <div
          className="relative rounded-3xl px-5 pt-6 pb-5 text-white overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, #ffe084 0%, transparent 55%), linear-gradient(135deg, #ff8a5b 0%, #d4602f 100%)',
            boxShadow: '0 8px 24px rgba(212,96,47,0.3)',
          }}
        >
          {/* Brotin no canto */}
          <div className="absolute -right-3 -bottom-4 anim-float">
            <Brotin size={120} mood={streak > 0 ? 'cheer' : 'sleep'} />
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider"
            style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)' }}
          >
            <span>🔥</span> SEQUÊNCIA
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <div
              className="text-7xl font-extrabold leading-none"
              style={{ letterSpacing: '-0.04em', textShadow: '0 4px 0 rgba(0,0,0,0.15)' }}
            >
              {streak}
            </div>
            <div className="text-lg font-extrabold opacity-95">{streak === 1 ? 'dia' : 'dias'}</div>
          </div>

          <p className="text-sm font-bold mt-1 max-w-[210px]">
            {streak === 0
              ? 'Bora começar hoje! 🌱'
              : streak < 7
              ? 'Tá indo bem. Não para agora!'
              : streak < 30
              ? 'Você tá voando 🚀'
              : 'Lenda absoluta 👑'}
          </p>
        </div>

        {/* SEMANA */}
        <section>
          <div className="flex justify-between items-baseline mb-2">
            <h2 className="text-xs font-extrabold tracking-wider text-[var(--color-ink-soft)] uppercase">
              Esta semana
            </h2>
            <span className="text-xs font-bold text-[var(--color-ink-faint)]">
              {week.filter((d) => d.watered).length}/7
            </span>
          </div>
          <Card padding="sm">
            <div className="flex justify-between gap-1.5">
              {week.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={`text-[10px] font-extrabold tracking-wider ${
                      d.isToday ? 'text-[var(--color-leaf-700)]' : 'text-[var(--color-ink-faint)]'
                    }`}
                  >
                    {d.weekday}
                  </div>
                  <div
                    className={`w-9 h-11 rounded-xl flex items-center justify-center transition-all ${
                      d.watered
                        ? 'bg-[var(--color-leaf-500)] text-white'
                        : 'bg-[var(--color-earth-100)] text-[var(--color-ink-faint)]'
                    } ${d.isToday ? 'ring-2 ring-[#ff8a5b] ring-offset-2 ring-offset-white' : ''}`}
                    style={{
                      boxShadow: d.watered ? '0 3px 0 var(--color-leaf-700)' : 'none',
                    }}
                  >
                    {d.watered ? <span className="text-lg">💧</span> : <span className="font-bold text-sm">{d.day}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* CTA hoje (se ainda não regou) */}
        {!todayDone && (
          <Link
            to="/streak/rega"
            className="flex items-center gap-3 rounded-2xl p-4 transition-transform active:translate-y-0.5"
            style={{
              background: 'linear-gradient(180deg, #fff8e6 0%, #fde68a 100%)',
              border: '2px solid #fbbf24',
              boxShadow: '0 4px 0 #d97706',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: '#fcd34d' }}
            >
              📷
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-sm">Foto de hoje</div>
              <div className="text-xs text-[var(--color-ink-soft)] font-semibold">
                Registre a rega pra somar mais um dia
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded-full text-xs font-extrabold uppercase text-white"
              style={{ background: '#d4602f' }}
            >
              Tirar →
            </div>
          </Link>
        )}

        {todayDone && (
          <div
            className="flex items-center gap-3 rounded-2xl p-3"
            style={{
              background: 'var(--color-leaf-50)',
              border: '2px solid var(--color-leaf-300)',
            }}
          >
            <div className="text-2xl">✓</div>
            <div className="flex-1">
              <div className="font-bold text-sm">Já regou hoje!</div>
              <div className="text-xs text-[var(--color-ink-soft)]">Volta amanhã pra somar +1.</div>
            </div>
          </div>
        )}

        {/* STRIP DE FOTOS RECENTES */}
        {recentPhotos.length > 0 && (
          <section>
            <div className="flex justify-between items-baseline mb-2">
              <h2 className="text-xs font-extrabold tracking-wider text-[var(--color-ink-soft)] uppercase">
                Últimas regas
              </h2>
              <span className="text-xs font-bold text-[var(--color-ink-faint)]">
                {recentPhotos.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {recentPhotos.map((entry, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl overflow-hidden border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] relative"
                >
                  <img src={entry.photo!} alt={`Rega de ${entry.date}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 left-1">
                    <Chip tone="leaf" icon={<span>💧</span>}>
                      {new Date(entry.date).getDate()}/{new Date(entry.date).getMonth() + 1}
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Conquistas relacionadas a streak */}
        <section>
          <h2 className="text-xs font-extrabold tracking-wider text-[var(--color-ink-soft)] uppercase mb-2">
            Marcos
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { days: 3, label: '3 dias',  emoji: '🌱', color: '#86efac' },
              { days: 7, label: 'Semana',   emoji: '🔥', color: '#fbbf24' },
              { days: 30, label: 'Mês',     emoji: '🏆', color: '#f97316' },
              { days: 90, label: '90 dias', emoji: '👑', color: '#a855f7' },
            ].map((m) => {
              const reached = streak >= m.days
              return (
                <div
                  key={m.days}
                  className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 p-2 text-center"
                  style={{
                    background: reached ? m.color : '#f3f4f6',
                    opacity: reached ? 1 : 0.55,
                    border: reached ? '2px solid rgba(0,0,0,0.15)' : '2px solid #e5e7eb',
                  }}
                >
                  <div className="text-2xl">{reached ? m.emoji : '🔒'}</div>
                  <div className={`text-[10px] font-extrabold ${reached ? 'text-white' : 'text-gray-500'}`}>
                    {m.label}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
