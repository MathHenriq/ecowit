import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brotin } from '../components/Brotin'

/**
 * Central de notificações.
 */

interface Notif {
  id: string
  icon: string
  iconBg: string
  title: string
  body: string
  time: string
  unread: boolean
  cta?: { label: string; to: string }
  avatar?: string
}

const NOTIFS: Notif[] = [
  {
    id: 'n1',
    icon: '💧',
    iconBg: '#dbeafe',
    title: 'Hora de regar a Echeveria!',
    body: 'Faz 2 dias — sua streak tá em risco 🔥',
    time: 'agora',
    unread: true,
    cta: { label: 'Regar', to: '/streak/rega' },
  },
  {
    id: 'n2',
    icon: '🏆',
    iconBg: '#fef3c7',
    title: 'Conquista desbloqueada: Semana Cheia',
    body: 'Você regou todos os 7 dias!',
    time: '2h',
    unread: true,
  },
  {
    id: 'n3',
    icon: '🌱',
    iconBg: '#dcfce7',
    title: 'Maria descobriu uma nova espécie',
    body: 'Hortelã-pimenta — você tem essa também!',
    time: '5h',
    unread: true,
    avatar: '🌻',
  },
  {
    id: 'n4',
    icon: '👋',
    iconBg: '#e0e7ff',
    title: 'João começou a te seguir',
    body: 'Já tem 8 espécies no jardim dele',
    time: 'ontem',
    unread: false,
    avatar: '🌳',
    cta: { label: 'Seguir', to: '/perfil' },
  },
  {
    id: 'n5',
    icon: '✨',
    iconBg: '#fef3c7',
    title: 'Nova badge disponível!',
    body: 'Plante 5 espécies pra desbloquear "Coletor"',
    time: 'ontem',
    unread: false,
  },
  {
    id: 'n6',
    icon: '💧',
    iconBg: '#dbeafe',
    title: 'Próxima rega: Hortelã',
    body: 'Em 1 dia',
    time: '2d',
    unread: false,
  },
  {
    id: 'n7',
    icon: '🌿',
    iconBg: '#dcfce7',
    title: 'Sua planta cresceu de nível!',
    body: 'Echeveria → Nível 3',
    time: '3d',
    unread: false,
  },
]

type Tab = 'all' | 'unread' | 'achievements'

export function Notificacoes() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('all')
  const [items, setItems] = useState(NOTIFS)

  const unreadCount = items.filter((n) => n.unread).length
  const filtered = items.filter((n) => {
    if (tab === 'unread') return n.unread
    if (tab === 'achievements') return n.icon === '🏆' || n.icon === '✨' || n.icon === '🌿'
    return true
  })

  function markAllRead() {
    setItems(items.map((n) => ({ ...n, unread: false })))
  }

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
        <h1 className="text-xl font-bold">Notificações</h1>
        <button
          onClick={markAllRead}
          aria-label="Marcar todas como lidas"
          className="w-9 h-9 rounded-full bg-white border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] flex items-center justify-center text-sm"
        >
          ✓✓
        </button>
      </header>

      {/* Tabs */}
      <div className="px-4 mb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {(['all', 'unread', 'achievements'] as const).map((t) => {
          const active = tab === t
          const labels: Record<Tab, string> = {
            all: 'Todas',
            unread: `Não lidas${unreadCount ? ` (${unreadCount})` : ''}`,
            achievements: 'Conquistas',
          }
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap relative ${
                active
                  ? 'bg-[var(--color-leaf-500)] text-white'
                  : 'bg-white border-2 border-[var(--color-earth-200)] text-[var(--color-ink-soft)]'
              }`}
            >
              {labels[t]}
              {t === 'unread' && unreadCount > 0 && !active && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Brotin size={80} mood="sleep" className="opacity-60" />
            <p className="text-sm text-[var(--color-ink-faint)] mt-2">Tudo em dia! 😴</p>
          </div>
        )}

        {filtered.map((n) => (
          <article
            key={n.id}
            className="relative rounded-2xl p-3 flex gap-3"
            style={{
              background: n.unread ? '#e9f7ed' : 'white',
              border: n.unread
                ? '2px solid var(--color-leaf-300)'
                : '2px solid var(--color-earth-200)',
              boxShadow: '0 3px 0 var(--color-earth-300)',
            }}
          >
            {/* Dot de não-lido — dentro do ícone, canto superior direito */}
            {n.unread && (
              <div
                className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[var(--color-leaf-500)]"
                style={{ boxShadow: '0 0 0 2px white' }}
                aria-label="Não lida"
              />
            )}

            {/* Ícone */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ background: n.iconBg }}
            >
              {n.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="font-extrabold text-sm leading-tight">{n.title}</div>
                <div className="text-[10px] font-bold text-[var(--color-ink-faint)] shrink-0">{n.time}</div>
              </div>
              <div className="text-xs text-[var(--color-ink-soft)] font-semibold mt-0.5">{n.body}</div>

              {n.cta && (
                <button
                  onClick={() => navigate(n.cta!.to)}
                  className="mt-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase"
                  style={{
                    background: 'var(--color-leaf-500)',
                    color: 'white',
                    boxShadow: '0 2px 0 var(--color-leaf-700)',
                  }}
                >
                  {n.cta.label}
                </button>
              )}
            </div>

            {n.avatar && (
              <div className="text-2xl self-center">{n.avatar}</div>
            )}
          </article>
        ))}
      </div>
    </main>
  )
}
