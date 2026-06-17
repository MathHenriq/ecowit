import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brotin } from '../components/Brotin'
import { Button } from '../components/ui'

/**
 * Tela de Login/Cadastro — placeholder MVP.
 * Será expandida com Supabase Auth (email/senha, Google, Apple) na próxima iteração.
 */
export function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar')

  function handleSubmit() {
    // TODO: integrar supabase.auth.signInWithPassword / signUp
    const onboardingDone = localStorage.getItem('ecowit:onboardingDone') === '1'
    if (mode === 'entrar' && onboardingDone) {
      navigate('/home', { replace: true })
    } else {
      navigate('/onboarding')
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-8">
      <div className="mb-6 anim-float">
        <Brotin size={120} mood="wave" />
      </div>

      <h1 className="text-3xl font-bold mb-1 text-[var(--color-leaf-700)]">EcoWit</h1>
      <p className="text-sm text-[var(--color-ink-faint)] mb-8 text-center">
        Cuide de plantas. Salve o planeta. Divirta-se.
      </p>

      <div className="w-full max-w-sm card-squish flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('entrar')}
            className={`flex-1 px-4 py-2 rounded-full font-bold text-sm transition-colors ${
              mode === 'entrar' ? 'bg-[var(--color-leaf-500)] text-white' : 'text-[var(--color-ink-faint)]'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode('criar')}
            className={`flex-1 px-4 py-2 rounded-full font-bold text-sm transition-colors ${
              mode === 'criar' ? 'bg-[var(--color-leaf-500)] text-white' : 'text-[var(--color-ink-faint)]'
            }`}
          >
            Criar conta
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-[var(--color-ink-faint)]">Email</span>
          <input
            type="email"
            placeholder="voce@email.com"
            className="px-4 py-3 rounded-full border-2 border-[var(--color-earth-300)] text-base focus:border-[var(--color-leaf-500)] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-[var(--color-ink-faint)]">Senha</span>
          <input
            type="password"
            placeholder="••••••••"
            className="px-4 py-3 rounded-full border-2 border-[var(--color-earth-300)] text-base focus:border-[var(--color-leaf-500)] focus:outline-none"
          />
        </label>

        <Button full onClick={handleSubmit}>
          {mode === 'entrar' ? 'Entrar' : 'Criar conta'}
        </Button>

        {mode === 'entrar' && (
          <p className="text-center text-xs text-[var(--color-ink-faint)]">
            Novo por aqui?{' '}
            <button onClick={() => setMode('criar')} className="font-bold text-[var(--color-leaf-700)]">
              Criar conta grátis
            </button>
          </p>
        )}
      </div>
    </main>
  )
}
