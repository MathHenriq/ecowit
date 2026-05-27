import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brotin } from '../components/Brotin'
import { CURRENT_USER } from '../lib/user'

/**
 * Configurações — preferências do usuário, organizado em seções.
 */
export function Config() {
  const navigate = useNavigate()
  const [prefs, setPrefs] = useState(() => loadPrefs())

  function toggle(key: keyof Prefs) {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] }
      savePrefs(next)
      return next
    })
  }

  return (
    <main className="flex-1 flex flex-col min-h-0">
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-9 h-9 rounded-full bg-white border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] flex items-center justify-center"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">Configurações</h1>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-5">
        {/* Mini perfil */}
        <Link
          to="/perfil"
          className="flex items-center gap-3 rounded-2xl p-3 bg-white"
          style={{ border: '2px solid var(--color-earth-200)', boxShadow: '0 3px 0 var(--color-earth-300)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-leaf-500)' }}
          >
            <Brotin size={40} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm">{CURRENT_USER.name}</div>
            <div className="text-xs text-[var(--color-ink-faint)] font-bold">@{CURRENT_USER.handle}</div>
          </div>
          <div className="text-xl text-[var(--color-ink-faint)]">›</div>
        </Link>

        {/* CONTA */}
        <Section title="Conta">
          <Row icon="👤" label="Editar perfil" onClick={() => alert('Em construção')} />
          <Row icon="🔐" label="Segurança e senha" onClick={() => alert('Em construção')} />
          <Row icon="📧" label="Email" value="lucas@email.com" onClick={() => alert('Em construção')} />
          <Row icon="🌎" label="Idioma" value="Português 🇧🇷" onClick={() => alert('Em construção')} />
        </Section>

        {/* NOTIFICAÇÕES */}
        <Section title="Notificações">
          <Toggle icon="💧" label="Lembretes de rega"        value={prefs.notifRega} onChange={() => toggle('notifRega')} />
          <Toggle icon="🌱" label="Atividade dos amigos"      value={prefs.notifFriends} onChange={() => toggle('notifFriends')} />
          <Toggle icon="🏆" label="Conquistas e ranking"      value={prefs.notifAchievements} onChange={() => toggle('notifAchievements')} />
          <Toggle icon="📰" label="Resumo semanal"            value={prefs.notifWeekly} onChange={() => toggle('notifWeekly')} />
        </Section>

        {/* APARÊNCIA */}
        <Section title="Aparência">
          <Row icon="🎨" label="Tema" value="Claro" onClick={() => alert('Em construção')} />
          <Row icon="🔤" label="Tamanho da fonte" value="Médio" onClick={() => alert('Em construção')} />
        </Section>

        {/* PRIVACIDADE */}
        <Section title="Privacidade">
          <Toggle icon="👁️" label="Perfil público"               value={prefs.publicProfile} onChange={() => toggle('publicProfile')} />
          <Toggle icon="📍" label="Mostrar localização aproximada" value={prefs.showLocation} onChange={() => toggle('showLocation')} />
          <Row icon="🚫" label="Pessoas bloqueadas" value="0" onClick={() => alert('Em construção')} />
        </Section>

        {/* SOBRE */}
        <Section title="Sobre">
          <Row icon="ℹ️" label="Sobre o EcoWit" onClick={() => alert('EcoWit v0.1 — feito com 🌿')} />
          <Row icon="📜" label="Termos de uso" onClick={() => alert('Em construção')} />
          <Row icon="🔒" label="Política de privacidade" onClick={() => alert('Em construção')} />
          <Row icon="⭐" label="Avaliar o app" onClick={() => alert('Em construção')} />
          <Row icon="💌" label="Enviar feedback" onClick={() => alert('Em construção')} />
        </Section>

        {/* ZONA DE PERIGO */}
        <div
          className="rounded-2xl p-3 flex flex-col gap-2"
          style={{ border: '2px solid #fecaca', background: '#fef2f2' }}
        >
          <button
            onClick={() => {
              if (confirm('Sair da conta?')) {
                localStorage.removeItem('ecowit:onboardingDone')
                window.location.href = '/login'
              }
            }}
            className="flex items-center gap-3 py-2 text-sm font-extrabold text-[#b91c1c]"
          >
            <span className="text-xl">🚪</span> Sair
          </button>
          <button
            onClick={() => alert('Em construção')}
            className="flex items-center gap-3 py-2 text-sm font-extrabold text-[#7f1d1d]"
          >
            <span className="text-xl">⚠️</span> Excluir minha conta
          </button>
        </div>

        <p className="text-center text-[10px] text-[var(--color-ink-faint)] font-bold mt-2">
          EcoWit v0.1 · feito com 🌿
        </p>
      </div>
    </main>
  )
}

/* ─── Components ─── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-ink-faint)] mb-2 px-2">
        {title}
      </h2>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '2px solid var(--color-earth-200)', background: 'white' }}
      >
        {children}
      </div>
    </section>
  )
}

function Row({ icon, label, value, onClick }: { icon: string; label: string; value?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-earth-50)] border-b last:border-b-0 border-[var(--color-earth-200)]"
    >
      <span className="text-xl">{icon}</span>
      <span className="flex-1 text-sm font-bold">{label}</span>
      {value && <span className="text-xs text-[var(--color-ink-faint)] font-semibold">{value}</span>}
      <span className="text-[var(--color-ink-faint)]">›</span>
    </button>
  )
}

function Toggle({ icon, label, value, onChange }: { icon: string; label: string; value: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 border-[var(--color-earth-200)]">
      <span className="text-xl">{icon}</span>
      <span className="flex-1 text-sm font-bold">{label}</span>
      <button
        role="switch"
        aria-checked={value}
        onClick={onChange}
        className="relative w-11 h-6 rounded-full transition-colors"
        style={{ background: value ? 'var(--color-leaf-500)' : '#d1d5db' }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
          style={{ transform: value ? 'translateX(22px)' : 'translateX(2px)', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        />
      </button>
    </div>
  )
}

/* ─── Prefs persistência ─── */
interface Prefs {
  notifRega: boolean
  notifFriends: boolean
  notifAchievements: boolean
  notifWeekly: boolean
  publicProfile: boolean
  showLocation: boolean
}

const DEFAULTS: Prefs = {
  notifRega: true,
  notifFriends: true,
  notifAchievements: true,
  notifWeekly: false,
  publicProfile: true,
  showLocation: false,
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem('ecowit:prefs')
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function savePrefs(p: Prefs) {
  localStorage.setItem('ecowit:prefs', JSON.stringify(p))
}
