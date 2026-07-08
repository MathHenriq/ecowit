import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brotin } from '../components/Brotin'
import { PlantSprite } from '../components/PlantSprite'
import { Chip } from '../components/ui'
import { computePlantStatus, loadGarden } from '../lib/garden'
import { SPECIES_CATALOG, type Species } from '../lib/species'
import { getStreakDays, getWaterings, todayISO } from '../lib/streak'

/**
 * Feed — home do app. Três camadas, da mais útil pra mais social:
 *  1. "Hoje" — missões reais do dia (rega pendente, escanear, medir luz)
 *  2. "Suas plantas" — trilho horizontal com o status vivo de cada planta
 *  3. Comunidade — timeline social (mock por enquanto, vai pro Supabase)
 */

/* ─── Dados vivos do jardim ─────────────────────────────────── */

interface FeedPlant {
  species: Species
  status: 'healthy' | 'thirsty'
}

function useGarden(): FeedPlant[] {
  return useMemo(() => {
    const seen = new Set<string>()
    const out: FeedPlant[] = []
    for (const p of loadGarden()) {
      if (seen.has(p.speciesId)) continue
      seen.add(p.speciesId)
      const species = SPECIES_CATALOG.find((s) => s.id === p.speciesId)
      if (species) out.push({ species, status: computePlantStatus(p.speciesId) })
    }
    // sedentas primeiro
    return out.sort((a, b) => (a.status === b.status ? 0 : a.status === 'thirsty' ? -1 : 1))
  }, [])
}

/* ─── Tela ──────────────────────────────────────────────────── */

export function Feed() {
  const streak = getStreakDays()
  const todayDone = getWaterings().some((w) => w.date === todayISO() && w.photo)
  const garden = useGarden()
  const thirsty = garden.filter((g) => g.status === 'thirsty')

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Boa madrugada' : hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const brotinMood = thirsty.length > 0 ? 'worried' : todayDone ? 'cheer' : 'happy'

  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-4 py-2.5 flex items-center justify-between"
        style={{
          background: 'rgba(255,248,246,0.85)',
          backdropFilter: 'blur(16px) saturate(160%)',
          borderBottom: '0.5px solid var(--color-earth-200)',
        }}
      >
        <div className="flex items-center gap-2">
          <Brotin size={34} mood={brotinMood} />
          <h1 className="text-xl font-extrabold text-[var(--color-leaf-700)] tracking-tight">
            Eco<span className="text-[var(--color-leaf-500)]">Wit</span>
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/ranking" aria-label="Ranking" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white">
            🏆
          </Link>
          <Link to="/notificacoes" aria-label="Notificações" className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-white">
            🔔
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-leaf-500)]" />
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Saudação + streak */}
        <section className="px-4 pt-4 pb-1">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold leading-tight">{greeting}! 🌱</h2>
              <p className="text-sm text-[var(--color-ink-faint)] font-semibold capitalize">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <Link
              to="/streak"
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl"
              style={{
                background: streak > 0
                  ? 'linear-gradient(135deg, #ffe084, #ffb45e)'
                  : 'var(--color-earth-100)',
                border: '2px solid var(--color-earth-300)',
                boxShadow: '0 3px 0 var(--color-earth-300)',
              }}
            >
              <span className="text-xl">🔥</span>
              <div className="leading-none">
                <div className="text-base font-extrabold">{streak}</div>
                <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">dias</div>
              </div>
            </Link>
          </div>
        </section>

        {/* Missões de hoje */}
        <section className="px-4 pt-3">
          <SectionTitle emoji="🎯">Hoje no seu jardim</SectionTitle>
          <div
            className="rounded-3xl p-1.5 flex flex-col gap-1.5"
            style={{
              background: 'linear-gradient(160deg, var(--color-leaf-50), #f0fbf1)',
              border: '2px solid var(--color-leaf-100)',
            }}
          >
            <Mission
              to="/streak/rega"
              emoji="💧"
              done={thirsty.length === 0}
              xp={20}
              title={
                thirsty.length > 0
                  ? `Regar ${thirsty.length} ${thirsty.length === 1 ? 'planta sedenta' : 'plantas sedentas'}`
                  : 'Todas as plantas regadas'
              }
              subtitle={
                thirsty.length > 0
                  ? thirsty.map((t) => t.species.popularName).slice(0, 3).join(', ')
                  : 'Seu jardim agradece 💚'
              }
            />
            <Mission
              to="/scan"
              emoji="📷"
              done={false}
              xp={50}
              title="Escanear uma planta nova"
              subtitle="Aponte a câmera e desbloqueie espécies"
            />
            <Mission
              to={garden[0] ? `/jardim/${garden[0].species.id}` : '/jardim'}
              emoji="💡"
              done={false}
              xp={15}
              title="Medir a luz de um cantinho"
              subtitle="Use o AR pra saber se a luz está boa"
            />
          </div>
        </section>

        {/* Suas plantas (trilho horizontal) */}
        {garden.length > 0 && (
          <section className="pt-4">
            <div className="px-4">
              <SectionTitle emoji="🪴" action={<Link to="/jardim" className="text-[11px] font-extrabold text-[var(--color-leaf-600)]">ver jardim 3D →</Link>}>
                Suas plantas
              </SectionTitle>
            </div>
            <div className="flex gap-2.5 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
              {garden.map(({ species, status }) => (
                <Link
                  key={species.id}
                  to={`/jardim/${species.id}`}
                  className="shrink-0 w-[104px] rounded-2xl bg-white overflow-hidden"
                  style={{
                    border: `2px solid ${status === 'thirsty' ? '#fcd34d' : 'var(--color-earth-200)'}`,
                    boxShadow: `0 3px 0 ${status === 'thirsty' ? '#f59e0b' : 'var(--color-earth-300)'}`,
                  }}
                >
                  <div
                    className="h-[84px] flex items-end justify-center"
                    style={{
                      background: status === 'thirsty'
                        ? 'linear-gradient(180deg, #fff7e0, #ffedc4)'
                        : 'linear-gradient(180deg, #eafbee, #d3f2dc)',
                    }}
                  >
                    <svg viewBox="-24 -46 48 52" className="w-full h-full p-1">
                      <PlantSprite species={species} scale={1.05} thirsty={status === 'thirsty'} />
                    </svg>
                  </div>
                  <div className="px-2 py-1.5">
                    <div className="text-[11px] font-extrabold leading-tight truncate">{species.popularName}</div>
                    <div className={`text-[9px] font-bold ${status === 'thirsty' ? 'text-amber-600' : 'text-[var(--color-leaf-600)]'}`}>
                      {status === 'thirsty' ? '💧 quer água' : '💚 saudável'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Comunidade */}
        <section className="px-4 pt-4">
          <SectionTitle emoji="🌍">Comunidade</SectionTitle>
          <div className="flex flex-col gap-4">
            {MOCK_POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Fim do feed */}
          <div className="flex flex-col items-center gap-1 py-6">
            <Brotin size={64} mood="sleep" />
            <p className="text-xs font-bold text-[var(--color-ink-faint)]">
              Você está em dia por aqui
            </p>
            <p className="text-[10px] text-[var(--color-ink-faint)]">siga mais gente pra encher o feed 🌿</p>
          </div>
        </section>
      </div>
    </main>
  )
}

/* ─── Peças ─────────────────────────────────────────────────── */

function SectionTitle({ emoji, action, children }: { emoji: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-[13px] font-extrabold uppercase tracking-wider text-[var(--color-ink-soft)] flex items-center gap-1.5">
        <span>{emoji}</span> {children}
      </h3>
      {action}
    </div>
  )
}

function Mission({
  to, emoji, title, subtitle, xp, done,
}: {
  to: string; emoji: string; title: string; subtitle: string; xp: number; done: boolean
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 active:scale-[0.99] transition-transform"
      style={{ border: '1.5px solid var(--color-leaf-100)', opacity: done ? 0.78 : 1 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: done ? 'var(--color-leaf-100)' : 'var(--color-leaf-50)' }}
      >
        {done ? '✅' : emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] font-extrabold leading-tight ${done ? 'line-through decoration-2 decoration-[var(--color-leaf-400)]' : ''}`}>
          {title}
        </div>
        <div className="text-[11px] text-[var(--color-ink-faint)] font-semibold truncate">{subtitle}</div>
      </div>
      <div
        className="shrink-0 text-[10px] font-extrabold px-2 py-1 rounded-full"
        style={{
          background: done ? 'var(--color-leaf-100)' : '#fff3cd',
          color: done ? 'var(--color-leaf-700)' : '#92600a',
          border: `1.5px solid ${done ? 'var(--color-leaf-300)' : '#fcd34d'}`,
        }}
      >
        +{xp} XP
      </div>
    </Link>
  )
}

/* ─── Posts (mock — vai pro Supabase) ───────────────────────── */

interface Post {
  id: string
  author: { name: string; handle: string; avatar: string; streak: number }
  speciesId: string
  scene: { sky: string; ground: string }
  badge?: string
  caption: string
  likes: number
  comments: number
  liked: boolean
  timeAgo: string
}

const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    author: { name: 'Maria Verde', handle: 'mariav', avatar: '🌻', streak: 87 },
    speciesId: 'echeveria-elegans',
    scene: { sky: '#dff3ff', ground: '#cdeeda' },
    badge: 'Nv. 5',
    caption: 'Olhem como essa belezinha cresceu em 3 meses! 🥹 Quem mais tem suculentas aí?',
    likes: 127,
    comments: 18,
    liked: true,
    timeAgo: '2h',
  },
  {
    id: 'p2',
    author: { name: 'João Folha', handle: 'jfolha', avatar: '🌳', streak: 42 },
    speciesId: 'hortela',
    scene: { sky: '#e8ffe4', ground: '#bdebc9' },
    badge: 'Nv. 3',
    caption: 'Colhi as primeiras folhinhas hoje, vai virar chá pra noite 🍵',
    likes: 64,
    comments: 9,
    liked: false,
    timeAgo: '5h',
  },
  {
    id: 'p3',
    author: { name: 'Carla 🌻', handle: 'carlasol', avatar: '🌼', streak: 145 },
    speciesId: 'mandacaru',
    scene: { sky: '#ffedd0', ground: '#f2d6a8' },
    badge: '🌟 floração rara',
    caption: 'Florescimento raro depois de 2 anos esperando 🌟 Vale toda a paciência.',
    likes: 312,
    comments: 47,
    liked: false,
    timeAgo: '1d',
  },
]

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState(post.likes)
  const species = SPECIES_CATALOG.find((s) => s.id === post.speciesId)

  function toggleLike() {
    setLiked((v) => {
      const next = !v
      setLikeCount((c) => c + (next ? 1 : -1))
      return next
    })
  }

  return (
    <article className="bg-white rounded-3xl overflow-hidden border-2 border-[var(--color-earth-200)] shadow-[0_4px_0_var(--color-earth-300)]">
      {/* Autor */}
      <header className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ background: 'var(--color-leaf-50)', border: '2px solid var(--color-leaf-100)' }}
        >
          {post.author.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-sm leading-tight">{post.author.name}</div>
          <div className="text-xs text-[var(--color-ink-faint)] font-semibold">@{post.author.handle} · {post.timeAgo}</div>
        </div>
        <Chip tone="sun" icon={<span>🔥</span>}>
          {post.author.streak}d
        </Chip>
      </header>

      {/* Cena ilustrada (clica pra abrir detalhe) */}
      {species && (
        <Link
          to={`/post/${post.id}`}
          className="block relative mx-3 mb-3 rounded-2xl overflow-hidden"
          style={{ aspectRatio: '4 / 3', border: '2px solid var(--color-leaf-100)' }}
        >
          <svg viewBox="0 0 200 150" className="w-full h-full block" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id={`sky-${post.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={post.scene.sky} />
                <stop offset="100%" stopColor="white" />
              </linearGradient>
            </defs>
            <rect width="200" height="150" fill={`url(#sky-${post.id})`} />
            {/* colinas de fundo */}
            <ellipse cx="30" cy="150" rx="90" ry="34" fill={post.scene.ground} opacity="0.55" />
            <ellipse cx="185" cy="152" rx="100" ry="40" fill={post.scene.ground} opacity="0.8" />
            {/* sol */}
            <circle cx="168" cy="26" r="14" fill="#ffdf80" opacity="0.9" />
            <circle cx="168" cy="26" r="20" fill="#ffdf80" opacity="0.25" />
            {/* nuvens */}
            <g fill="white" opacity="0.85">
              <ellipse cx="46" cy="28" rx="18" ry="7" />
              <ellipse cx="60" cy="24" rx="12" ry="6" />
              <ellipse cx="120" cy="44" rx="14" ry="5" opacity="0.6" />
            </g>
            {/* planta protagonista */}
            <g transform="translate(100 118) scale(2.2)">
              <PlantSprite species={species} scale={1} />
            </g>
          </svg>
          <div className="absolute bottom-2.5 left-2.5 flex gap-1.5">
            <Chip tone="leaf" icon={<span>🌱</span>}>
              {species.popularName}{post.badge ? ` · ${post.badge}` : ''}
            </Chip>
          </div>
        </Link>
      )}

      {/* Caption */}
      <Link to={`/post/${post.id}`} className="block px-4 text-sm leading-relaxed hover:opacity-90">
        {post.caption}
      </Link>

      {/* Ações */}
      <div className="px-4 py-3 mt-1 flex items-center gap-4 text-sm">
        <button onClick={toggleLike} className="flex items-center gap-1.5 active:scale-90 transition-transform">
          <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
          <span className="font-bold">{likeCount}</span>
        </button>
        <Link to={`/post/${post.id}`} className="flex items-center gap-1.5 hover:opacity-70">
          <span className="text-xl">💬</span>
          <span className="font-bold">{post.comments}</span>
        </Link>
        <button className="ml-auto hover:opacity-70" aria-label="Salvar">
          <span className="text-xl">🔖</span>
        </button>
      </div>
    </article>
  )
}
