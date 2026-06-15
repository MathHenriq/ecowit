import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brotin } from '../components/Brotin'
import { Button, Card, Chip } from '../components/ui'
import { SPECIES_CATALOG, UNLOCKED_SPECIES_IDS, type Species } from '../lib/species'
import { identify, type IdentifyResult } from '../lib/identify'

/**
 * Resultado do scan.
 * Mostra a hipótese principal do PlantNet + alternativas.
 * Botão "Usar IA pra confirmar" chama Gemini Vision como segunda opinião.
 */
export function ScanResult() {
  const navigate = useNavigate()
  const [photo, setPhoto] = useState<string | null>(null)
  const [primary, setPrimary] = useState<IdentifyResult | null>(null)
  const [aiResult, setAiResult] = useState<IdentifyResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [arMode, setArMode] = useState(false)

  useEffect(() => {
    const p = sessionStorage.getItem('ecowit:lastScan')
    const r = sessionStorage.getItem('ecowit:lastScanResult')
    if (!p || !r) {
      navigate('/scan', { replace: true })
      return
    }
    setPhoto(p)
    const parsed = JSON.parse(r) as IdentifyResult
    setPrimary(parsed)
    setSelectedSpeciesId(parsed.matchedSpecies?.id ?? null)
  }, [navigate])

  async function consultAI() {
    if (!photo) return
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await identify(photo, 'gemini')
      setAiResult(res)
    } catch (err) {
      console.error('gemini error', err)
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setAiError(msg)
    } finally {
      setAiLoading(false)
    }
  }

  function addToGarden() {
    const sp = SPECIES_CATALOG.find((s) => s.id === selectedSpeciesId)
    if (!sp) return
    UNLOCKED_SPECIES_IDS.add(sp.id)
    setShowCelebration(true)
  }

  function dismissCelebration() {
    setShowCelebration(false)
    navigate('/jardim', { replace: true })
  }

  if (!primary || !photo) return null

  const primarySpecies = primary.matchedSpecies
  const aiSpecies = aiResult?.matchedSpecies ?? null
  const selectedSpecies = SPECIES_CATALOG.find((s) => s.id === selectedSpeciesId) ?? null

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-[var(--color-cream)]">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => navigate('/scan', { replace: true })}
          aria-label="Fechar"
          className="w-10 h-10 rounded-full bg-white border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] flex items-center justify-center"
        >
          ✕
        </button>
        <div className="font-bold">Identificada!</div>
        <button
          aria-label="Compartilhar"
          className="w-10 h-10 rounded-full bg-white border-2 border-[var(--color-earth-200)] shadow-[0_3px_0_var(--color-earth-300)] flex items-center justify-center"
        >
          📤
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        {/* Foto */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-[var(--color-leaf-300)] shadow-[0_4px_0_var(--color-leaf-500)]">
          <img src={photo} alt="Foto da planta escaneada" className="w-full aspect-square object-cover" />
          <div className="absolute top-3 right-3">
            <Chip tone="leaf" icon={<span>✓</span>}>
              {Math.round(primary.topMatch.confidence * 100)}% certeza
            </Chip>
          </div>
          <div className="absolute top-3 left-3">
            <Chip tone="sky" icon={<span>🔬</span>}>PlantNet</Chip>
          </div>
        </div>

        {/* Botão AR */}
        {primarySpecies && (
          <button
            onClick={() => setArMode(true)}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white"
            style={{
              background: 'linear-gradient(135deg, #0a1628 0%, #0d2a1e 100%)',
              border: '1.5px solid rgba(0,255,210,0.5)',
              boxShadow: '0 0 18px rgba(0,255,210,0.2)',
            }}
          >
            <span style={{ fontSize: 16 }}>✦</span>
            Ver em AR — Tag Holográfica
          </button>
        )}

        {/* Card PRIMÁRIO (PlantNet) */}
        <ResultCard
          provider="plantnet"
          name={primary.topMatch.popularName}
          scientific={primary.topMatch.scientificName}
          matchedSpecies={primarySpecies}
          isNew={primarySpecies ? !UNLOCKED_SPECIES_IDS.has(primarySpecies.id) : false}
          selected={selectedSpeciesId === primarySpecies?.id}
          onSelect={() => primarySpecies && setSelectedSpeciesId(primarySpecies.id)}
        />

        {/* Alternativas do PlantNet */}
        {primary.alternatives.length > 0 && !aiResult && (
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-faint)] mb-2">
              OUTRAS POSSIBILIDADES PLANTNET
            </p>
            <div className="grid grid-cols-2 gap-2">
              {primary.alternatives.slice(0, 2).map((alt, i) => (
                <button
                  key={i}
                  onClick={() => alt.speciesId && setSelectedSpeciesId(alt.speciesId)}
                  className={`bg-white border-2 rounded-2xl p-3 text-left transition-colors ${
                    selectedSpeciesId === alt.speciesId
                      ? 'border-[var(--color-leaf-500)] bg-[var(--color-leaf-50)]'
                      : 'border-[var(--color-earth-200)] hover:border-[var(--color-leaf-300)]'
                  }`}
                >
                  <div className="font-bold text-sm leading-tight">{alt.popularName}</div>
                  <div className="text-xs italic text-[var(--color-ink-faint)] truncate">{alt.scientificName}</div>
                  <div className="text-xs font-semibold text-[var(--color-ink-soft)] mt-1">{Math.round(alt.confidence * 100)}%</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Botão "Usar IA" — segunda opinião do Gemini */}
        {!aiResult && (
          <div className="flex flex-col gap-2">
            <button
              onClick={consultAI}
              disabled={aiLoading}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[var(--color-sky-500)] text-[var(--color-sky-700)] font-bold text-sm disabled:opacity-60"
            >
              {aiLoading ? (
                <>
                  <span className="anim-pulse-soft">✨</span>
                  Consultando IA...
                </>
              ) : (
                <>
                  <span>✨</span>
                  {aiError ? 'Tentar IA de novo' : 'Não é essa? Usar IA pra confirmar'}
                </>
              )}
            </button>
            {aiError && (
              <div className="rounded-xl bg-red-50 border-2 border-red-200 p-3 text-xs text-red-700">
                <div className="font-bold mb-1">Erro na IA:</div>
                <div className="break-words font-mono text-[11px]">{aiError}</div>
              </div>
            )}
          </div>
        )}

        {/* Card SECUNDÁRIO (Gemini) — só aparece após clicar */}
        {aiResult && (
          <>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-px bg-[var(--color-earth-200)]" />
              <span className="text-xs font-bold text-[var(--color-sky-700)] uppercase tracking-wider">
                ✨ Segunda opinião (IA)
              </span>
              <div className="flex-1 h-px bg-[var(--color-earth-200)]" />
            </div>

            <ResultCard
              provider="gemini"
              name={aiResult.topMatch.popularName}
              scientific={aiResult.topMatch.scientificName}
              matchedSpecies={aiSpecies}
              isNew={aiSpecies ? !UNLOCKED_SPECIES_IDS.has(aiSpecies.id) : false}
              selected={selectedSpeciesId === aiSpecies?.id}
              onSelect={() => aiSpecies && setSelectedSpeciesId(aiSpecies.id)}
            />

            {/* Comparativo curto */}
            <div className="text-xs text-center text-[var(--color-ink-faint)] italic">
              {primary.topMatch.scientificName === aiResult.topMatch.scientificName
                ? '✓ PlantNet e IA concordam!'
                : '⚠️ As duas discordam — você decide qual adicionar abaixo.'}
            </div>
          </>
        )}

        {/* Brotin com plaquinha */}
        <div className="flex items-center gap-2 mt-2">
          <Brotin size={56} mood="happy" />
          <Card padding="sm" className="flex-1">
            <p className="text-xs font-semibold">
              {selectedSpecies
                ? `Vai adicionar "${selectedSpecies.popularName}" no seu jardim?`
                : 'Selecione qual espécie é essa pra continuar.'}
            </p>
          </Card>
        </div>
      </div>

      {/* Botões inferiores */}
      <div className="px-4 pb-4 flex flex-col gap-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <Button full icon={<span>🪴</span>} onClick={addToGarden} disabled={!selectedSpecies}>
          Adicionar ao Jardim
        </Button>
        <button
          onClick={() => navigate('/scan', { replace: true })}
          className="text-sm font-semibold text-[var(--color-ink-faint)] py-2"
        >
          Não é nenhuma dessas, tentar de novo
        </button>
      </div>

      {showCelebration && selectedSpecies && (
        <UnlockCelebration species={selectedSpecies} onClose={dismissCelebration} />
      )}

      {arMode && photo && primarySpecies && (
        <ARScanOverlay
          photo={photo}
          species={primarySpecies}
          confidence={primary!.topMatch.confidence}
          onClose={() => setArMode(false)}
        />
      )}
    </main>
  )
}

/* ─── AR Scan Overlay ───────────────────────────────────────── */
function ARScanOverlay({
  photo,
  species,
  confidence,
  onClose,
}: {
  photo: string
  species: import('../lib/species').Species
  confidence: number
  onClose: () => void
}) {
  const scanRef = useRef<HTMLDivElement>(null)

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Foto como "câmera" de fundo */}
      <div ref={scanRef} className="relative flex-1 overflow-hidden">
        <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />

        {/* Escurecimento nas bordas */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6) 100%)' }}
        />

        {/* Scanlines sobre a foto */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,200,0.04) 3px, rgba(0,255,200,0.04) 4px)',
          }}
        />

        {/* Canto-brackets AR (como mira do scan) */}
        {[
          { top: '15%', left: '8%', borders: 'border-t-2 border-l-2' },
          { top: '15%', right: '8%', borders: 'border-t-2 border-r-2' },
          { bottom: '15%', left: '8%', borders: 'border-b-2 border-l-2' },
          { bottom: '15%', right: '8%', borders: 'border-b-2 border-r-2' },
        ].map((b, i) => (
          <div
            key={i}
            className={`absolute w-8 h-8 ${b.borders} rounded-sm anim-pulse-soft`}
            style={{
              top: b.top, left: b.left, right: b.right, bottom: b.bottom,
              borderColor: 'rgba(0,255,200,0.8)',
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}

        {/* Badge flutuante — nome da planta */}
        <div
          className="absolute anim-float"
          style={{ top: '12%', left: '50%', transform: 'translateX(-50%)', animationDuration: '2.5s' }}
        >
          <div
            style={{
              background: 'rgba(0,10,20,0.82)',
              border: '1.5px solid rgba(0,255,200,0.6)',
              borderRadius: 12,
              padding: '8px 16px',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 0 20px rgba(0,255,200,0.25)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ fontSize: 8, fontWeight: 800, color: 'rgba(0,255,200,0.7)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              ✦ ECOWIT AR · IDENTIFICADA
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#e0fff8', lineHeight: 1.1 }}>
              {species.emoji} {species.popularName}
            </div>
            <div style={{ fontSize: 10, fontStyle: 'italic', color: 'rgba(0,255,200,0.5)' }}>
              {species.scientificName}
            </div>
          </div>
        </div>

        {/* Badge confiança — canto inferior esquerdo */}
        <div
          className="absolute anim-float"
          style={{ bottom: '18%', left: '6%', animationDuration: '3s', animationDelay: '0.4s' }}
        >
          <div
            style={{
              background: 'rgba(0,10,20,0.82)',
              border: '1.5px solid rgba(0,255,200,0.45)',
              borderRadius: 10,
              padding: '6px 12px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ fontSize: 8, color: 'rgba(0,255,200,0.6)', fontWeight: 700, letterSpacing: '0.1em' }}>CERTEZA</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0fffe0' }}>{Math.round(confidence * 100)}%</div>
          </div>
        </div>

        {/* Badge XP — canto inferior direito */}
        <div
          className="absolute anim-float"
          style={{ bottom: '18%', right: '6%', animationDuration: '2.8s', animationDelay: '0.8s' }}
        >
          <div
            style={{
              background: 'rgba(0,10,20,0.82)',
              border: '1.5px solid rgba(0,255,200,0.45)',
              borderRadius: 10,
              padding: '6px 12px',
              backdropFilter: 'blur(4px)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 8, color: 'rgba(0,255,200,0.6)', fontWeight: 700, letterSpacing: '0.1em' }}>XP</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0fffe0' }}>+50</div>
          </div>
        </div>

        {/* Badge cuidado — meio-direita */}
        <div
          className="absolute anim-float"
          style={{ top: '42%', right: '5%', animationDuration: '3.2s', animationDelay: '0.2s' }}
        >
          <div
            style={{
              background: 'rgba(0,10,20,0.82)',
              border: '1.5px solid rgba(0,255,200,0.45)',
              borderRadius: 10,
              padding: '6px 12px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ fontSize: 8, color: 'rgba(0,255,200,0.6)', fontWeight: 700, letterSpacing: '0.1em' }}>REGA</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#b0ffe8' }}>💧 {species.waterDays}d</div>
            <div style={{ fontSize: 8, color: 'rgba(0,255,200,0.6)', fontWeight: 700, letterSpacing: '0.1em', marginTop: 4 }}>LUZ</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#b0ffe8' }}>☀️ {species.sunNeeds}</div>
          </div>
        </div>

        {/* Linha de scan animada */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(0,255,200,0.8), transparent)',
            animation: 'scanLine 3s linear infinite',
            top: 0,
          }}
        />

        <style>{`
          @keyframes scanLine {
            0% { top: 10%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 90%; opacity: 0; }
          }
        `}</style>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-4 flex items-center justify-between"
        style={{ background: 'rgba(0,5,15,0.95)', borderTop: '1px solid rgba(0,255,200,0.2)' }}
      >
        <div style={{ color: 'rgba(0,255,200,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
          ✦ MODO AR · ECOWIT
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(0,255,200,0.1)',
            border: '1.5px solid rgba(0,255,200,0.5)',
            borderRadius: 20,
            padding: '6px 18px',
            color: '#0fffe0',
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

/* ─── Card de resultado (PlantNet OU Gemini) ────────────────── */
function ResultCard({
  name,
  scientific,
  matchedSpecies,
  isNew,
  selected,
  onSelect,
}: {
  provider: 'plantnet' | 'gemini'
  name: string
  scientific: string
  matchedSpecies: Species | null
  isNew: boolean
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`text-left w-full rounded-3xl p-4 transition-all ${
        selected
          ? 'bg-[var(--color-leaf-50)] border-2 border-[var(--color-leaf-500)]'
          : 'bg-white border-2 border-[var(--color-earth-200)]'
      }`}
      style={selected ? { boxShadow: '0 4px 0 var(--color-leaf-700)' } : { boxShadow: '0 4px 0 var(--color-earth-300)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-[var(--color-ink-faint)]">Esta planta é…</p>
        {selected && <span className="text-[var(--color-leaf-700)] font-bold text-xs">✓ ESCOLHIDA</span>}
      </div>
      <h2 className="text-2xl font-bold leading-tight" style={{ letterSpacing: '-0.02em' }}>{name}</h2>
      <p className="text-sm italic text-[var(--color-ink-faint)] mb-3">{scientific}</p>

      <div className="mb-3">
        {matchedSpecies ? (
          isNew ? (
            <Chip tone="sun" icon={<span>🌟</span>}>NOVA NO SEU JARDIM!</Chip>
          ) : (
            <Chip tone="neutral" icon={<span>✓</span>}>Você já tem essa</Chip>
          )
        ) : (
          <Chip tone="earth" icon={<span>📚</span>}>Fora do nosso catálogo</Chip>
        )}
      </div>

      {matchedSpecies && (
        <>
          <div className="flex flex-wrap gap-2 mb-2">
            <Chip tone="earth">🌳 {matchedSpecies.category}</Chip>
            <Chip tone="sky">💧 {matchedSpecies.waterDays}d</Chip>
            <Chip tone="sun">☀️ {matchedSpecies.sunNeeds}</Chip>
          </div>
          {matchedSpecies.description && (
            <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
              {matchedSpecies.description}
            </p>
          )}
        </>
      )}
    </button>
  )
}

/* ─── Modal Pokédex celebração ──────────────────────────────── */
function UnlockCelebration({ species, onClose }: { species: Species; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(26,26,46,0.7) 0%, rgba(26,26,46,0.92) 100%)',
        }}
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-[600px] opacity-30"
            style={{
              background: 'linear-gradient(to bottom, transparent, var(--color-sun-300), transparent)',
              transform: `rotate(${i * 45}deg)`,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute text-xl anim-float"
            style={{
              left: `${(i * 41) % 90 + 5}%`,
              top: `${(i * 53) % 80 + 5}%`,
              animationDelay: `${i * 0.15}s`,
              transform: `rotate(${i * 30}deg)`,
            }}
          >
            🌿
          </div>
        ))}
      </div>

      <div
        className="relative z-10 bg-[var(--color-cream)] rounded-3xl p-6 max-w-sm w-full"
        style={{ border: '2px solid var(--color-earth-300)', boxShadow: '0 6px 0 var(--color-earth-500)' }}
      >
        <div className="flex justify-center mb-3">
          <Chip tone="sun" icon={<span>✨</span>}>NOVA ESPÉCIE</Chip>
        </div>
        <div className="flex justify-center mb-4">
          <div
            className="relative w-32 h-32 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, var(--color-leaf-100) 0%, var(--color-leaf-50) 100%)',
              border: '4px solid var(--color-leaf-500)',
            }}
          >
            <div className="text-6xl">{species.emoji}</div>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-4 bg-[var(--color-sun-500)]"
                style={{
                  transform: `rotate(${i * 45}deg) translateY(-72px)`,
                  transformOrigin: 'center 64px',
                }}
              />
            ))}
          </div>
        </div>
        <p className="text-center text-xs italic text-[var(--color-ink-faint)]">{species.scientificName}</p>
        <h2 className="text-center text-3xl font-bold leading-tight" style={{ letterSpacing: '-0.02em' }}>
          {species.popularName}
        </h2>
        <div className="my-3 mx-auto w-12 h-0.5 bg-[var(--color-leaf-500)] rounded-full" />
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          <Chip tone="earth">🌳 {species.category}</Chip>
          <Chip tone="sky">💧 {species.waterDays}d</Chip>
          <Chip tone="sun">☀️ {species.sunNeeds}</Chip>
        </div>
        <p className="text-center text-sm text-[var(--color-ink-soft)] mb-3">
          Brotin está orgulhoso! Você descobriu sua {UNLOCKED_SPECIES_IDS.size}ª espécie. 🌱
        </p>
        <div className="flex justify-center gap-2 mb-4">
          <Chip tone="leaf">+50 XP</Chip>
          <Chip tone="sun">+1 nova</Chip>
          <Chip tone="earth">Coleção: {UNLOCKED_SPECIES_IDS.size}/{SPECIES_CATALOG.length}</Chip>
        </div>
        <Button full icon={<span>🪴</span>} onClick={onClose}>Adicionar ao Jardim</Button>
        <Link
          to={`/jardim/${species.id}`}
          className="block text-center text-sm font-semibold text-[var(--color-ink-faint)] mt-3"
        >
          Ver detalhes da espécie
        </Link>
      </div>
    </div>
  )
}
