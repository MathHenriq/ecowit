import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Brotin } from '../components/Brotin'
import { Chip } from '../components/ui'

/**
 * Feed — tela inicial pós-login. Timeline social estilo Instagram com vibe eco.
 * Posts mockados por enquanto, vai puxar do Supabase depois.
 */

interface Post {
  id: string
  author: { name: string; handle: string; avatar: string; streak: number }
  plant: { name: string; level: number }
  imageEmoji: string  // placeholder até subir fotos reais
  imageBg: string
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
    plant: { name: 'Echeveria elegans', level: 5 },
    imageEmoji: '🪴',
    imageBg: 'linear-gradient(135deg, #c4ebd1 0%, #fff0ee 100%)',
    caption: 'Olhem como essa belezinha cresceu em 3 meses! 🥹 Quem mais tem suculentas aí?',
    likes: 127,
    comments: 18,
    liked: true,
    timeAgo: '2h',
  },
  {
    id: 'p2',
    author: { name: 'João Folha', handle: 'jfolha', avatar: '🌳', streak: 42 },
    plant: { name: 'Hortelã-pimenta', level: 3 },
    imageEmoji: '🌿',
    imageBg: 'linear-gradient(135deg, #c4ebd1 0%, #6bfe9c 100%)',
    caption: 'Colhi as primeiras folhinhas hoje, vai virar chá pra noite 🍵',
    likes: 64,
    comments: 9,
    liked: false,
    timeAgo: '5h',
  },
  {
    id: 'p3',
    author: { name: 'Carla 🌻', handle: 'carlasol', avatar: '🌼', streak: 145 },
    plant: { name: 'Cacto Mandacaru', level: 7 },
    imageEmoji: '🌵',
    imageBg: 'linear-gradient(135deg, #ffe084 0%, #f8d1cb 100%)',
    caption: 'Florescimento raro depois de 2 anos esperando 🌟 Vale toda a paciência.',
    likes: 312,
    comments: 47,
    liked: false,
    timeAgo: '1d',
  },
]

export function Feed() {
  return (
    <main className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(255,248,246,0.85)',
          backdropFilter: 'blur(16px) saturate(160%)',
          borderBottom: '0.5px solid var(--color-earth-200)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-leaf-500)' }}
          >
            <Brotin size={28} />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-leaf-700)]">EcoWit</h1>
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

      {/* Banner de streak */}
      <Link
        to="/streak"
        className="mx-4 mt-3 rounded-2xl p-3 flex items-center gap-3"
        style={{
          background: 'linear-gradient(135deg, #f8d1cb 0%, #ffe084 100%)',
          border: '2px solid var(--color-earth-300)',
          boxShadow: '0 4px 0 var(--color-earth-500)',
        }}
      >
        <div className="text-2xl anim-pulse-soft">🔥</div>
        <div className="flex-1">
          <div className="text-sm font-bold">Você está no dia 0 da sequência</div>
          <div className="text-xs text-[var(--color-ink-faint)]">Registre a primeira rega pra começar →</div>
        </div>
      </Link>

      {/* Lista de posts */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
        {MOCK_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* Fim do feed */}
        <div className="text-center py-6 text-xs text-[var(--color-ink-faint)]">
          🌿 Você está em dia · siga mais gente pra ver mais
        </div>
      </div>
    </main>
  )
}

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState(post.likes)

  function toggleLike() {
    setLiked((v) => {
      const next = !v
      setLikeCount((c) => c + (next ? 1 : -1))
      return next
    })
  }

  return (
    <article className="bg-white rounded-2xl overflow-hidden border-2 border-[var(--color-earth-200)] shadow-[0_4px_0_var(--color-earth-300)]">
      {/* Autor */}
      <header className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ background: 'var(--color-leaf-50)' }}
        >
          {post.author.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm leading-tight">{post.author.name}</div>
          <div className="text-xs text-[var(--color-ink-faint)]">@{post.author.handle} · {post.timeAgo}</div>
        </div>
        <Chip tone="leaf" icon={<span>🔥</span>}>
          {post.author.streak}d
        </Chip>
      </header>

      {/* Imagem (placeholder colorido com emoji) */}
      <div
        className="relative aspect-square mx-3 mb-3 rounded-2xl overflow-hidden flex items-center justify-center"
        style={{ background: post.imageBg, border: '2px solid var(--color-leaf-200)' }}
      >
        <div className="text-[140px] leading-none drop-shadow-sm">{post.imageEmoji}</div>
        <div className="absolute bottom-3 left-3">
          <Chip tone="leaf" icon={<span>🌱</span>}>
            {post.plant.name} (Nv. {post.plant.level})
          </Chip>
        </div>
      </div>

      {/* Caption */}
      <p className="px-4 text-sm leading-relaxed">{post.caption}</p>

      {/* Ações */}
      <div className="px-4 py-3 mt-2 flex items-center gap-4 text-sm">
        <button onClick={toggleLike} className="flex items-center gap-1.5 hover:opacity-70">
          <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
          <span className="font-bold">{likeCount}</span>
        </button>
        <button className="flex items-center gap-1.5 hover:opacity-70">
          <span className="text-xl">💬</span>
          <span className="font-bold">{post.comments}</span>
        </button>
        <button className="ml-auto hover:opacity-70" aria-label="Salvar">
          <span className="text-xl">🔖</span>
        </button>
      </div>
    </article>
  )
}
