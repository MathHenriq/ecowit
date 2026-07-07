import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PlantSprite } from '../components/PlantSprite'
import { Chip } from '../components/ui'
import { SPECIES_CATALOG } from '../lib/species'

/**
 * Detalhe expandido de um post do feed — com comentários.
 * Mock: reusa os mesmos 3 posts do feed.
 */

interface Comment {
  id: string
  author: string
  avatar: string
  body: string
  time: string
  likes: number
  liked: boolean
}

interface Post {
  id: string
  author: { name: string; handle: string; avatar: string; streak: number }
  plant: { name: string; level: number }
  imageEmoji: string
  imageBg: string
  caption: string
  likes: number
  comments: Comment[]
  liked: boolean
  timeAgo: string
}

const POSTS: Record<string, Post> = {
  p1: {
    id: 'p1',
    author: { name: 'Maria Verde', handle: 'mariav', avatar: '🌻', streak: 87 },
    plant: { name: 'Echeveria elegans', level: 5 },
    imageEmoji: '🪴',
    imageBg: 'linear-gradient(135deg, #c4ebd1 0%, #fff0ee 100%)',
    caption: 'Olhem como essa belezinha cresceu em 3 meses! 🥹 Quem mais tem suculentas aí? #regaeco #plantinhasdolar',
    likes: 127,
    liked: true,
    timeAgo: '2h',
    comments: [
      { id: 'c1', author: 'Lucas V.',   avatar: '🌳', body: 'Linda! Que sol bate aí?',        time: '12min', likes: 12, liked: false },
      { id: 'c2', author: 'João Folha', avatar: '🌿', body: 'Tem da espécie "paulistana" também?', time: '1h',    likes: 5,  liked: false },
      { id: 'c3', author: 'Carla 🌻',   avatar: '🌼', body: 'Brotin tá orgulhoso 🥹',         time: '2h',    likes: 24, liked: true  },
      { id: 'c4', author: 'Bia',        avatar: '🌸', body: 'Salvando pra tentar replicar!',  time: '2h',    likes: 8,  liked: false },
    ],
  },
}

export function PostDetalhe() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()

  const post = postId ? POSTS[postId] : null

  const [liked, setLiked] = useState(post?.liked ?? false)
  const [likeCount, setLikeCount] = useState(post?.likes ?? 0)
  const [commentInput, setCommentInput] = useState('')
  const [comments, setComments] = useState(post?.comments ?? [])

  const postSpecies = SPECIES_CATALOG.find(
    (s) => post && s.scientificName.toLowerCase().startsWith(post.plant.name.split(' ')[0].toLowerCase()),
  ) ?? SPECIES_CATALOG[0]

  if (!post) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-2">🌱</div>
        <p className="text-sm font-bold">Post não encontrado.</p>
        <button onClick={() => navigate('/home')} className="mt-4 underline text-sm">← Voltar ao feed</button>
      </main>
    )
  }

  function toggleLike() {
    setLiked((v) => {
      setLikeCount((c) => c + (v ? -1 : 1))
      return !v
    })
  }

  function sendComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentInput.trim()) return
    setComments([
      {
        id: `c${Date.now()}`,
        author: 'Você',
        avatar: '🌳',
        body: commentInput.trim(),
        time: 'agora',
        likes: 0,
        liked: false,
      },
      ...comments,
    ])
    setCommentInput('')
  }

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-[var(--color-cream)]">
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-9 h-9 rounded-full bg-white border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] flex items-center justify-center"
        >
          ←
        </button>
        <h1 className="font-bold">Post</h1>
        <button
          aria-label="Mais opções"
          className="w-9 h-9 rounded-full bg-white border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] flex items-center justify-center"
        >
          ⋯
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-4">
        {/* Post card */}
        <article className="bg-white rounded-2xl overflow-hidden border-2 border-[var(--color-earth-200)] shadow-[0_4px_0_var(--color-earth-300)]">
          {/* Autor */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'var(--color-leaf-50)' }}>
              {post.author.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm leading-tight">{post.author.name}</div>
              <div className="text-xs text-[var(--color-ink-faint)]">@{post.author.handle} · {post.timeAgo}</div>
            </div>
            <Chip tone="leaf" icon={<span>🔥</span>}>{post.author.streak}d</Chip>
          </div>

          {/* Imagem — cena ilustrada com a planta do post */}
          <div
            className="relative mx-3 mb-3 rounded-2xl overflow-hidden"
            style={{ aspectRatio: '4 / 3', border: '2px solid var(--color-leaf-200)' }}
          >
            <svg viewBox="0 0 200 150" className="w-full h-full block" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="post-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dff3ff" />
                  <stop offset="100%" stopColor="white" />
                </linearGradient>
              </defs>
              <rect width="200" height="150" fill="url(#post-sky)" />
              <ellipse cx="30" cy="150" rx="90" ry="34" fill="#cdeeda" opacity="0.55" />
              <ellipse cx="185" cy="152" rx="100" ry="40" fill="#cdeeda" opacity="0.8" />
              <circle cx="168" cy="26" r="14" fill="#ffdf80" opacity="0.9" />
              <g fill="white" opacity="0.85">
                <ellipse cx="46" cy="28" rx="18" ry="7" />
                <ellipse cx="60" cy="24" rx="12" ry="6" />
              </g>
              {postSpecies && (
                <g transform="translate(100 118) scale(2.2)">
                  <PlantSprite species={postSpecies} scale={1} />
                </g>
              )}
            </svg>
            <div className="absolute bottom-3 left-3">
              <Chip tone="leaf" icon={<span>🌱</span>}>
                {post.plant.name} (Nv. {post.plant.level})
              </Chip>
            </div>
          </div>

          {/* Caption */}
          <p className="px-4 text-sm leading-relaxed">{post.caption}</p>

          {/* Actions */}
          <div className="px-4 py-3 mt-2 flex items-center gap-4 text-sm">
            <button onClick={toggleLike} className="flex items-center gap-1.5 active:scale-95 transition-transform">
              <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
              <span className="font-bold">{likeCount}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-xl">💬</span>
              <span className="font-bold">{comments.length}</span>
            </div>
            <button className="ml-auto active:scale-95 transition-transform" aria-label="Compartilhar">
              <span className="text-xl">↗️</span>
            </button>
            <button className="active:scale-95 transition-transform" aria-label="Salvar">
              <span className="text-xl">🔖</span>
            </button>
          </div>
        </article>

        {/* Comentários */}
        <section>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2 px-1">
            Comentários ({comments.length})
          </h2>
          <div className="flex flex-col gap-2">
            {comments.map((c) => (
              <CommentItem key={c.id} comment={c} />
            ))}
            {comments.length === 0 && (
              <p className="text-center text-xs text-[var(--color-ink-faint)] py-6">
                Nenhum comentário ainda. Seja o primeiro 🌱
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Input bar fixo */}
      <form
        onSubmit={sendComment}
        className="border-t-2 border-[var(--color-earth-200)] bg-white px-3 py-2 flex items-center gap-2"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: 'var(--color-leaf-50)' }}>
          🌳
        </div>
        <input
          type="text"
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          placeholder="Adicione um comentário…"
          className="flex-1 px-3 py-2 rounded-full text-sm border-2 border-[var(--color-earth-200)] focus:border-[var(--color-leaf-500)] focus:outline-none bg-[var(--color-earth-50)]"
        />
        <button
          type="submit"
          disabled={!commentInput.trim()}
          className="px-3 py-2 rounded-full text-xs font-extrabold uppercase text-white disabled:opacity-40"
          style={{ background: 'var(--color-leaf-500)' }}
        >
          Enviar
        </button>
      </form>
    </main>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  const [liked, setLiked] = useState(comment.liked)
  const [likes, setLikes] = useState(comment.likes)
  return (
    <div className="flex gap-2.5 px-1 py-2">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: 'var(--color-leaf-50)' }}>
        {comment.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-xs">{comment.author}</span>
          <span className="text-[10px] text-[var(--color-ink-faint)]">{comment.time}</span>
        </div>
        <p className="text-sm leading-snug mt-0.5">{comment.body}</p>
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() => {
              setLiked((v) => {
                setLikes((c) => c + (v ? -1 : 1))
                return !v
              })
            }}
            className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-ink-faint)]"
          >
            <span>{liked ? '❤️' : '🤍'}</span>
            <span>{likes}</span>
          </button>
          <button className="text-[10px] font-bold text-[var(--color-ink-faint)]">Responder</button>
        </div>
      </div>
    </div>
  )
}
