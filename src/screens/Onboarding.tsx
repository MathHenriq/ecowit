import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brotin } from '../components/Brotin'
import { Button, Card } from '../components/ui'

type StarterPlant = 'suculenta' | 'hortela' | 'manjericao'

const STARTERS: { id: StarterPlant; name: string; emoji: string; tag: string; tagColor: string }[] = [
  { id: 'suculenta',   name: 'Suculenta',   emoji: '🌵', tag: 'fácil',    tagColor: 'leaf' },
  { id: 'hortela',     name: 'Hortelã',     emoji: '🌿', tag: 'cheirosa', tagColor: 'sky' },
  { id: 'manjericao',  name: 'Manjericão',  emoji: '🌱', tag: 'útil',     tagColor: 'leaf' },
]

/**
 * Onboarding — 3 cards numa única tela scrollável:
 *  1. Apresentação do Brotin
 *  2. Escolher primeira planta
 *  3. Pedir permissão de câmera
 * Botão fixo no rodapé: "VAMOS COMEÇAR".
 */
export function Onboarding() {
  const navigate = useNavigate()
  const [picked, setPicked] = useState<StarterPlant>('suculenta')
  const [cameraOk, setCameraOk] = useState(false)

  async function requestCamera() {
    try {
      // Apenas pede permissão; não usamos o stream aqui.
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      stream.getTracks().forEach((t) => t.stop())
      setCameraOk(true)
    } catch {
      // Mesmo se negar, deixa seguir — vai pedir de novo na tela de scan
      setCameraOk(false)
      alert('Sem problemas! Você pode permitir depois na hora de escanear sua primeira planta.')
    }
  }

  function start() {
    // TODO: salvar starter pick + estado de onboarding no Supabase / localStorage
    localStorage.setItem('ecowit:starter', picked)
    localStorage.setItem('ecowit:onboardingDone', '1')
    navigate('/home', { replace: true })
  }

  return (
    <main className="flex-1 flex flex-col">
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 flex flex-col gap-5">

        {/* PASSO 1 — Apresentação */}
        <section
          className="relative rounded-3xl px-6 pt-8 pb-6 text-center overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, var(--color-leaf-100) 0%, var(--color-cream) 70%)',
          }}
        >
          <div className="absolute inset-0 flex items-start justify-center pointer-events-none" aria-hidden>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute top-16 w-1 h-20 opacity-25"
                style={{
                  background: 'linear-gradient(to bottom, var(--color-leaf-300), transparent)',
                  transform: `rotate(${i * 45}deg) translateY(-40px)`,
                  transformOrigin: 'center 90px',
                }}
              />
            ))}
          </div>

          <div className="relative inline-block anim-float">
            <Brotin size={130} mood="happy" />
          </div>

          <h1 className="text-3xl font-bold mt-2 text-[var(--color-ink)]">
            Oi! Eu sou o Brotin 🌱
          </h1>
          <p className="text-sm font-medium text-[var(--color-ink-faint)] mt-2 max-w-xs mx-auto">
            Vou te ajudar a plantar, regar e colecionar plantas — um dia de cada vez.
          </p>
        </section>

        {/* PASSO 2 — Escolher starter */}
        <Card padding="md">
          <h2 className="text-lg font-bold mb-1">Escolha seu primeiro broto 🪴</h2>
          <p className="text-xs text-[var(--color-ink-faint)] mb-3">
            Você vai cuidar dele e ganhar XP regando.
          </p>

          <div className="flex flex-col gap-2">
            {STARTERS.map((s) => {
              const active = picked === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setPicked(s.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                    active
                      ? 'border-2 border-[var(--color-leaf-500)] bg-[var(--color-leaf-50)]'
                      : 'border-2 border-[var(--color-earth-200)] bg-white hover:border-[var(--color-earth-300)]'
                  }`}
                >
                  <div className="text-3xl">{s.emoji}</div>
                  <div className="flex-1">
                    <div className="font-bold text-base">{s.name}</div>
                    <div className="text-xs text-[var(--color-ink-faint)]">{s.tag}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 ${
                      active ? 'border-[var(--color-leaf-500)] bg-[var(--color-leaf-500)]' : 'border-[var(--color-earth-300)]'
                    } flex items-center justify-center`}
                  >
                    {active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* PASSO 3 — Permissão da câmera */}
        <Card padding="md">
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{
                background: 'var(--color-leaf-50)',
                border: '2px solid var(--color-leaf-100)',
              }}
            >
              📸
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">Permitir acesso à câmera</h2>
              <p className="text-xs text-[var(--color-ink-faint)] mt-1">
                Vamos identificar plantas que você encontrar pelo mundo e registrar suas regas diárias.
              </p>
            </div>
          </div>
          <button
            onClick={requestCamera}
            className={`mt-4 w-full py-2 rounded-full font-bold text-sm transition-colors ${
              cameraOk
                ? 'bg-[var(--color-leaf-500)] text-white'
                : 'border-2 border-[var(--color-leaf-500)] text-[var(--color-leaf-700)]'
            }`}
          >
            {cameraOk ? '✓ Permitido' : 'Permitir agora'}
          </button>
        </Card>
      </div>

      {/* Botão fixo no rodapé */}
      <div
        className="sticky bottom-0 px-5 py-4"
        style={{
          background: 'linear-gradient(to top, var(--color-cream) 60%, transparent)',
        }}
      >
        <Button full onClick={start}>
          Vamos começar 🚀
        </Button>
      </div>
    </main>
  )
}
