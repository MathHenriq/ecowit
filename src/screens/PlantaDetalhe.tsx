import { useNavigate, useParams } from 'react-router-dom'
import { Brotin } from '../components/Brotin'
import { PlantSprite } from '../components/PlantSprite'
import { Button, Card, Chip } from '../components/ui'
import { SPECIES_CATALOG, UNLOCKED_SPECIES_IDS } from '../lib/species'
import { getWaterings, getStreakDays } from '../lib/streak'

/**
 * Detalhe individual de uma espécie do jardim.
 * Mostra ilustração grande, stats, próxima rega, histórico, descrição.
 */
export function PlantaDetalhe() {
  const { speciesId } = useParams<{ speciesId: string }>()
  const navigate = useNavigate()

  const species = SPECIES_CATALOG.find((s) => s.id === speciesId)
  if (!species) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <Brotin size={80} mood="worried" className="mb-3" />
        <p className="text-sm font-bold">Essa planta não existe no nosso catálogo.</p>
        <button onClick={() => navigate('/jardim')} className="mt-4 underline text-sm">← Voltar ao jardim</button>
      </main>
    )
  }

  const unlocked = UNLOCKED_SPECIES_IDS.has(species.id)

  // Mock: nível da planta baseado em quantas regas tem
  const allWaterings = getWaterings()
  const plantLevel = Math.min(7, Math.floor(allWaterings.length / 3) + 1)
  const careHistory = allWaterings.slice(-8)

  // Próxima rega: hoje + waterDays
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + Math.max(1, species.waterDays - 2))

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-[var(--color-cream)]">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-9 h-9 rounded-full bg-white border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] flex items-center justify-center"
        >
          ←
        </button>
        <div className="flex flex-col items-center min-w-0 px-2">
          <div className="font-extrabold text-sm leading-tight">{species.popularName}</div>
          <div className="text-[10px] italic text-[var(--color-ink-faint)] font-bold truncate">{species.scientificName}</div>
        </div>
        <button
          aria-label="Compartilhar"
          className="w-9 h-9 rounded-full bg-white border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] flex items-center justify-center"
        >
          📤
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-4">
        {/* HERO — ilustração SVG da planta sobre disco com raios */}
        <div
          className="relative rounded-3xl overflow-hidden p-6 flex items-center justify-center"
          style={{
            aspectRatio: '5 / 4',
            background:
              'radial-gradient(circle at 50% 60%, var(--color-leaf-100) 0%, var(--color-cream) 70%)',
            border: '2px solid var(--color-earth-200)',
            boxShadow: '0 4px 0 var(--color-earth-300)',
          }}
        >
          {/* 8 raios em estrela */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-32 opacity-25"
                style={{
                  background: 'linear-gradient(to bottom, var(--color-leaf-400), transparent)',
                  transform: `rotate(${i * 45}deg) translateY(-80px)`,
                }}
              />
            ))}
          </div>

          {/* Sprite SVG centralizado */}
          <svg viewBox="-40 -50 80 80" className="w-48 h-48 relative z-10 anim-float">
            <PlantSprite species={species} scale={2.2} />
          </svg>

          {/* Badge de nível */}
          <div className="absolute top-3 right-3">
            <Chip tone="sun" icon={<span>⭐</span>}>
              Nv. {plantLevel}
            </Chip>
          </div>

          {/* Badge de raridade */}
          {species.rarity && species.rarity !== 'common' && (
            <div className="absolute top-3 left-3">
              <Chip tone={species.rarity === 'epic' ? 'sun' : 'sky'}>
                {species.rarity === 'epic' ? '🌟 ÉPICA' : '✨ RARA'}
              </Chip>
            </div>
          )}
        </div>

        {!unlocked && (
          <Card padding="md" className="text-center">
            <div className="text-3xl mb-1">🔒</div>
            <h2 className="font-extrabold text-base">Espécie bloqueada</h2>
            <p className="text-xs text-[var(--color-ink-faint)] mt-1">
              Encontre essa planta no mundo real e escaneie pra desbloquear!
            </p>
            <button
              onClick={() => navigate('/scan')}
              className="mt-3 px-4 py-2 rounded-full bg-[var(--color-leaf-500)] text-white text-xs font-extrabold uppercase"
            >
              Escanear
            </button>
          </Card>
        )}

        {unlocked && (
          <>
            {/* Stats grid 2x2 */}
            <div className="grid grid-cols-2 gap-2">
              <StatBox emoji="💧" big={`${allWaterings.filter((w) => w.photo).length}`} label="regas totais" />
              <StatBox emoji="🌡️" big="Saudável" label="estado atual" tone="green" />
              <StatBox emoji="☀️" big={species.sunNeeds} label="luz ideal" />
              <StatBox emoji="📅" big={`${Math.floor(allWaterings.length * 3)}d`} label="no jardim" />
            </div>

            {/* Próxima rega */}
            <Card
              padding="md"
              style={{
                background: 'linear-gradient(180deg, #fff8e6 0%, #fde68a 100%)',
                border: '2px solid #fbbf24',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">💧</div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-[var(--color-ink-soft)] uppercase tracking-wider">Próxima rega</div>
                  <div className="text-xl font-extrabold">
                    em {Math.max(1, species.waterDays - 2)} {species.waterDays - 2 === 1 ? 'dia' : 'dias'}
                  </div>
                  <div className="text-[10px] text-[var(--color-ink-soft)] font-semibold">
                    {nextDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <Button onClick={() => navigate('/streak/rega')}>Regar</Button>
              </div>
            </Card>

            {/* Histórico */}
            <section>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">
                Histórico recente
              </h2>
              <Card padding="md">
                <div className="flex justify-between items-center gap-2">
                  {careHistory.length > 0 ? (
                    careHistory.map((entry, i) => {
                      const watered = !!entry.photo
                      const d = new Date(entry.date)
                      return (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                            style={{
                              background: watered ? 'var(--color-leaf-500)' : '#fecaca',
                              color: 'white',
                              boxShadow: watered ? '0 2px 0 var(--color-leaf-700)' : '0 2px 0 #fca5a5',
                            }}
                          >
                            {watered ? '💧' : '✕'}
                          </div>
                          <div className="text-[9px] font-bold text-[var(--color-ink-faint)]">
                            {d.getDate()}/{d.getMonth() + 1}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-xs text-[var(--color-ink-faint)] py-2">Nenhuma rega registrada ainda.</p>
                  )}
                </div>
              </Card>
            </section>

            {/* Sobre */}
            {species.description && (
              <section>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">
                  Sobre a {species.popularName}
                </h2>
                <Card padding="md">
                  <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{species.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Chip tone="earth">🌳 {species.category}</Chip>
                    <Chip tone="sky">💧 a cada {species.waterDays}d</Chip>
                    <Chip tone="sun">☀️ {species.sunNeeds}</Chip>
                    <Chip tone="leaf">💪 {species.careLevel}</Chip>
                  </div>
                </Card>
              </section>
            )}

            {/* Dica do Brotin */}
            <div className="flex items-start gap-2 mt-1">
              <Brotin size={48} mood="happy" />
              <Card padding="sm" className="flex-1">
                <p className="text-xs font-bold">
                  <span className="text-[var(--color-leaf-700)]">Brotin diz:</span> Streak atual: {getStreakDays()} dias 🔥
                  {' '}— mantém firme!
                </p>
              </Card>
            </div>

            {/* Botão compartilhar */}
            <button
              onClick={() => alert('Em construção')}
              className="w-full py-3 rounded-2xl border-2 border-[var(--color-leaf-500)] text-[var(--color-leaf-700)] font-extrabold text-sm flex items-center justify-center gap-2"
            >
              📤 Compartilhar minha {species.popularName}
            </button>
          </>
        )}
      </div>
    </main>
  )
}

function StatBox({ emoji, big, label, tone }: { emoji: string; big: string; label: string; tone?: 'green' }) {
  return (
    <div
      className="bg-white rounded-2xl p-3"
      style={{ border: '2px solid var(--color-earth-200)', boxShadow: '0 3px 0 var(--color-earth-300)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div
            className="text-base font-extrabold truncate"
            style={{ color: tone === 'green' ? 'var(--color-leaf-700)' : 'var(--color-ink)' }}
          >
            {big}
          </div>
          <div className="text-[10px] font-bold text-[var(--color-ink-faint)]">{label}</div>
        </div>
      </div>
    </div>
  )
}
