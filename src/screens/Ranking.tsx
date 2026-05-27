import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brotin } from '../components/Brotin'
import { Card, Chip } from '../components/ui'
import { CURRENT_USER } from '../lib/user'

/**
 * Ranking semanal de amigos — estilo Liga do Duolingo.
 */

type Period = 'semana' | 'mes' | 'all'

interface Player {
  id: string
  name: string
  handle: string
  brotinTint: 'gold' | 'silver' | 'bronze' | 'default'
  xpWeek: number
  delta: number  // +N (subiu), -N (caiu), 0 (igual)
  isYou?: boolean
}

const MOCK_RANKING: Player[] = [
  { id: 'carla', name: 'Carla 🌻',        handle: 'carlasol',  brotinTint: 'gold',    xpWeek: 3250, delta: 1 },
  { id: 'lucas', name: 'Lucas V. (você)', handle: 'lucasv',    brotinTint: 'silver',  xpWeek: 2140, delta: 3, isYou: true },
  { id: 'maria', name: 'Maria Verde',     handle: 'mariav',    brotinTint: 'bronze',  xpWeek: 1890, delta: -1 },
  { id: 'joao',  name: 'João Folha',      handle: 'jfolha',    brotinTint: 'default', xpWeek: 1520, delta: 2 },
  { id: 'bia',   name: 'Bia Brota',       handle: 'biabrota',  brotinTint: 'default', xpWeek: 1280, delta: 0 },
  { id: 'pedro', name: 'Pedro Verdão',    handle: 'pedrov',    brotinTint: 'default', xpWeek: 1100, delta: -2 },
  { id: 'ana',   name: 'Ana Florista',    handle: 'anaflor',   brotinTint: 'default', xpWeek: 920,  delta: 1 },
  { id: 'tiago', name: 'Tiago Mato',      handle: 'tmato',     brotinTint: 'default', xpWeek: 750,  delta: 0 },
]

const TINT_COLORS: Record<Player['brotinTint'], string> = {
  gold: '#fbbf24',
  silver: '#cbd5e1',
  bronze: '#d97706',
  default: 'var(--color-leaf-300)',
}

export function Ranking() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('semana')

  const top3 = MOCK_RANKING.slice(0, 3)
  const rest = MOCK_RANKING.slice(3)

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-9 h-9 rounded-full bg-white border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] flex items-center justify-center"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">Ranking</h1>
        <div className="text-2xl">🏆</div>
      </header>

      {/* Tabs período */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 bg-[var(--color-earth-100)] rounded-full p-1">
          {(['semana', 'mes', 'all'] as const).map((p) => {
            const labels: Record<Period, string> = { semana: 'Semana', mes: 'Mês', all: 'Sempre' }
            const active = period === p
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-1.5 rounded-full text-xs font-extrabold transition-colors ${
                  active ? 'bg-[var(--color-leaf-500)] text-white' : 'text-[var(--color-ink-faint)]'
                }`}
              >
                {labels[p]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-4">
        {/* PÓDIO */}
        <section
          className="rounded-3xl px-3 pt-5 pb-2 relative overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at top, #fef3c7 0%, var(--color-cream) 60%)',
          }}
        >
          {/* Raios atrás do 1º lugar */}
          <div className="absolute inset-0 flex items-start justify-center pointer-events-none" aria-hidden>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute top-8 w-1 h-24 opacity-30"
                style={{
                  background: 'linear-gradient(to bottom, #fbbf24, transparent)',
                  transform: `rotate(${i * 45}deg) translateY(-60px)`,
                  transformOrigin: 'center 84px',
                }}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 items-end relative">
            {/* 2º (esquerda, prata) */}
            <PodiumSlot player={top3[1]} place={2} height={100} medalEmoji="🥈" />
            {/* 1º (centro, ouro - mais alto) */}
            <PodiumSlot player={top3[0]} place={1} height={140} medalEmoji="👑" />
            {/* 3º (direita, bronze) */}
            <PodiumSlot player={top3[2]} place={3} height={80} medalEmoji="🥉" />
          </div>
        </section>

        {/* Lista do 4º em diante */}
        <section>
          <h2 className="text-xs font-extrabold tracking-wider text-[var(--color-ink-soft)] uppercase mb-2">
            Próximos colocados
          </h2>
          <div className="flex flex-col gap-2">
            {rest.map((p, i) => {
              const position = i + 4
              const isYou = p.isYou
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${isYou ? 'bg-[var(--color-leaf-50)]' : 'bg-white'}`}
                  style={{
                    border: isYou ? '2px solid var(--color-leaf-500)' : '2px solid var(--color-earth-200)',
                    boxShadow: isYou ? '0 3px 0 var(--color-leaf-700)' : '0 3px 0 var(--color-earth-300)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0"
                    style={{
                      background: 'var(--color-earth-100)',
                      color: 'var(--color-ink-soft)',
                    }}
                  >
                    {position}
                  </div>
                  <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: TINT_COLORS[p.brotinTint] }}>
                    <Brotin size={36} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold leading-tight truncate">{p.name}</div>
                    <div className="text-[10px] text-[var(--color-ink-faint)] font-bold">@{p.handle}</div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <Chip tone="sun">{p.xpWeek.toLocaleString('pt-BR')} XP</Chip>
                    <DeltaIndicator delta={p.delta} />
                  </div>
                  {isYou && (
                    <div
                      className="absolute right-2 top-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase text-white"
                      style={{ background: 'var(--color-leaf-500)' }}
                    >
                      Você
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Banner inferior */}
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🔥</div>
            <div className="flex-1">
              <div className="font-extrabold text-sm">Faltam 2 dias pro ranking fechar</div>
              <div className="text-xs text-[var(--color-ink-faint)] font-semibold">Bora regar, {CURRENT_USER.name.split(' ')[0]}!</div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

function PodiumSlot({
  player,
  place,
  height,
  medalEmoji,
}: {
  player: Player
  place: 1 | 2 | 3
  height: number
  medalEmoji: string
}) {
  const tintColor = TINT_COLORS[player.brotinTint]
  const isFirst = place === 1
  const order = place === 2 ? 1 : place === 1 ? 2 : 3

  return (
    <div className="flex flex-col items-center" style={{ order }}>
      {/* Avatar */}
      <div
        className={`relative rounded-full p-1 ${isFirst ? 'scale-110' : ''}`}
        style={{ background: tintColor, border: '3px solid white', boxShadow: '0 4px 0 rgba(0,0,0,0.15)' }}
      >
        <div className="w-14 h-14 rounded-full overflow-hidden bg-white flex items-center justify-center">
          <Brotin size={56} mood={isFirst ? 'cheer' : 'happy'} />
        </div>
        {/* medalha */}
        <div className="absolute -top-2 -right-2 text-2xl">{medalEmoji}</div>
      </div>

      {/* Nome */}
      <div className="text-[11px] font-extrabold text-center mt-2 leading-tight max-w-[80px] truncate">
        {player.name}
      </div>

      {/* XP chip */}
      <Chip tone={isFirst ? 'sun' : 'neutral'} className="mt-1">
        {player.xpWeek.toLocaleString('pt-BR')}
      </Chip>

      {/* Coluna do pódio */}
      <div
        className="w-full mt-2 rounded-t-2xl flex items-center justify-center text-3xl font-extrabold text-white"
        style={{
          height,
          background: `linear-gradient(180deg, ${tintColor} 0%, color-mix(in oklab, ${tintColor}, black 20%) 100%)`,
          boxShadow: `0 4px 0 color-mix(in oklab, ${tintColor}, black 40%)`,
        }}
      >
        {place}
      </div>
    </div>
  )
}

function DeltaIndicator({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-[10px] font-bold text-gray-400">– 0</span>
  if (delta > 0) return <span className="text-[10px] font-extrabold text-green-600">▲ {delta}</span>
  return <span className="text-[10px] font-extrabold text-red-600">▼ {Math.abs(delta)}</span>
}
