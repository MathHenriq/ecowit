import { Link } from 'react-router-dom'
import { Brotin } from '../components/Brotin'

/**
 * Tela placeholder genérica para rotas ainda não construídas.
 * Usada enquanto convertemos as telas do Stitch uma por uma.
 */
export function Placeholder({ title, next }: { title: string; next?: { label: string; to: string } }) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
      <Brotin size={100} mood="sleep" className="mb-4 opacity-70" />
      <h1 className="text-2xl font-bold text-[var(--color-leaf-700)] mb-2">{title}</h1>
      <p className="text-sm text-[var(--color-ink-faint)] mb-6">
        Em construção 🌱 (próxima na fila do ciclo tela-por-tela)
      </p>
      {next && (
        <Link
          to={next.to}
          className="btn-squish btn-primary"
        >
          {next.label} →
        </Link>
      )}
      <Link to="/" className="mt-4 text-xs text-[var(--color-ink-faint)] underline">
        ← voltar ao início
      </Link>
    </main>
  )
}
