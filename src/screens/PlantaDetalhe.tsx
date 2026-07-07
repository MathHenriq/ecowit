import '@google/model-viewer'
import { lazy, Suspense, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ARLoading } from '../components/ARLoading'
import { Brotin } from '../components/Brotin'
import { Button, Card, Chip } from '../components/ui'
import { SPECIES_CATALOG, UNLOCKED_SPECIES_IDS, modelPathsFor } from '../lib/species'
import { getWaterings, getStreakDays } from '../lib/streak'

const ARView = lazy(() => import('../components/ARView').then((m) => ({ default: m.ARView })))

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
  const [holoVisible, setHoloVisible] = useState(false)
  const [arOpen, setArOpen] = useState(false)

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
        {/* HERO — modelo 3D interativo (o mesmo do AR, sem precisar de câmera) */}
        <div
          className="relative rounded-3xl overflow-hidden select-none w-full shrink-0"
          style={{
            aspectRatio: '5 / 4',
            background:
              'radial-gradient(circle at 50% 65%, var(--color-leaf-100) 0%, var(--color-cream) 75%)',
            border: '2px solid var(--color-earth-200)',
            boxShadow: '0 4px 0 var(--color-earth-300)',
          }}
        >
          <model-viewer
            key={species.id}
            src={modelPathsFor(species).glb}
            alt={`Modelo 3D de ${species.popularName}`}
            camera-controls
            auto-rotate
            auto-rotate-delay="1500"
            disable-tap
            shadow-intensity="0.9"
            exposure="1.05"
            environment-image="neutral"
            interaction-prompt="none"
            camera-orbit="25deg 72deg auto"
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              '--poster-color': 'transparent',
              filter: unlocked ? undefined : 'brightness(0.05)',
            } as React.CSSProperties}
          />

          {/* Badge de nível */}
          <div className="absolute top-3 right-3 pointer-events-none">
            <Chip tone="sun" icon={<span>⭐</span>}>
              Nv. {plantLevel}
            </Chip>
          </div>

          {/* Badge de raridade */}
          {species.rarity && species.rarity !== 'common' && (
            <div className="absolute top-3 left-3 pointer-events-none">
              <Chip tone={species.rarity === 'epic' ? 'sun' : 'sky'}>
                {species.rarity === 'epic' ? '🌟 ÉPICA' : '✨ RARA'}
              </Chip>
            </div>
          )}

          {/* Ações sobre o 3D */}
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-2">
            <div className="px-2 py-1 rounded-full text-[10px] font-bold text-[var(--color-leaf-700)] bg-white/75 backdrop-blur-sm border border-[var(--color-leaf-300)] pointer-events-none">
              👆 arraste pra girar em 3D
            </div>
            {unlocked && (
              <>
                <button
                  onClick={() => setHoloVisible(true)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white/75 backdrop-blur-sm"
                  style={{ border: '1px solid rgba(0,180,150,0.5)', color: '#00695c' }}
                >
                  ✦ tag
                </button>
                <button
                  onClick={() => setArOpen(true)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white"
                  style={{ background: 'linear-gradient(135deg, #0a1628, #0d2a1e)', border: '1px solid rgba(0,255,210,0.5)' }}
                >
                  ✦ ver em AR
                </button>
              </>
            )}
          </div>

          {/* silhueta misteriosa pra bloqueadas */}
          {!unlocked && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
              <Chip tone="earth">🔒 ???</Chip>
            </div>
          )}

          {/* Hologram Tag — aparece ao tocar no botão */}
          {holoVisible && (
            <HologramTag species={species} level={plantLevel} onClose={() => setHoloVisible(false)} />
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

      {arOpen && (
        <Suspense fallback={<ARLoading />}>
          <ARView
            title={species.popularName}
            species={[species]}
            layout="front"
            onClose={() => setArOpen(false)}
          />
        </Suspense>
      )}
    </main>
  )
}

/* ─── Hologram Tag ──────────────────────────────────────────── */
function HologramTag({
  species,
  level,
  onClose,
}: {
  species: import('../lib/species').Species
  level: number
  onClose: (e: React.MouseEvent) => void
}) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center"
      style={{ perspective: '600px' }}
      onClick={(e) => { e.stopPropagation(); onClose(e) }}
    >
      {/* Fundo escurecido com blur */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,10,20,0.65)', backdropFilter: 'blur(2px)' }}
      />

      {/* Plaquinha 3D */}
      <div
        style={{
          position: 'relative',
          transform: 'rotateX(8deg) rotateY(-4deg)',
          transformStyle: 'preserve-3d',
          animation: 'holoFloat 3s ease-in-out infinite',
          border: '1.5px solid rgba(0,255,210,0.6)',
          borderRadius: 16,
          padding: '14px 18px',
          background: 'linear-gradient(160deg, rgba(0,20,40,0.92) 0%, rgba(0,10,30,0.96) 100%)',
          boxShadow: '0 0 24px rgba(0,255,210,0.35), 0 0 60px rgba(0,255,210,0.12), inset 0 0 20px rgba(0,255,210,0.06)',
          minWidth: 200,
          maxWidth: 240,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scanlines */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,210,0.04) 3px, rgba(0,255,210,0.04) 4px)',
            pointerEvents: 'none',
            borderRadius: 16,
          }}
        />

        {/* Linha superior decorativa */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,255,210,0.8), transparent)', marginBottom: 10 }} />

        {/* Cabeçalho: ESPÉCIE + emoji */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 28 }}>{species.emoji}</div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(0,255,210,0.7)', textTransform: 'uppercase' }}>
              ✦ ECOWIT AR TAG
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#e0fff8', lineHeight: 1.1 }}>
              {species.popularName}
            </div>
          </div>
        </div>

        {/* Nome científico */}
        <div style={{ fontSize: 10, fontStyle: 'italic', color: 'rgba(0,255,210,0.55)', marginBottom: 10 }}>
          {species.scientificName}
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 10 }}>
          {[
            { label: 'NÍVEL', value: `${level}` },
            { label: 'RARIDADE', value: species.rarity ? species.rarity.toUpperCase() : 'COMUM' },
            { label: 'REGA', value: `${species.waterDays}d` },
            { label: 'LUZ', value: species.sunNeeds },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(0,255,210,0.5)', letterSpacing: '0.1em' }}>{s.label}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#b0ffe8' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Linha inferior */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,255,210,0.8), transparent)', marginBottom: 8 }} />

        {/* Cuidado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: 'rgba(0,255,210,0.5)', fontWeight: 700 }}>DIFICULDADE: {species.careLevel.toUpperCase()}</div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: '#0fffe0',
              border: '1px solid rgba(0,255,210,0.4)',
              borderRadius: 20,
              padding: '2px 8px',
              letterSpacing: '0.08em',
            }}
          >
            META
          </div>
        </div>
      </div>

      <style>{`
        @keyframes holoFloat {
          0%, 100% { transform: rotateX(8deg) rotateY(-4deg) translateY(0px); }
          50% { transform: rotateX(4deg) rotateY(4deg) translateY(-6px); }
        }
      `}</style>
    </div>
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
