import '@google/model-viewer'
import { useRef, useState } from 'react'
import type { Species } from '../lib/species'

/**
 * ARView — AR real via <model-viewer> (Google).
 *
 * Diferente da versão anterior (giroscópio + sprite 2D "colado" na tela, que
 * só girava e não tinha noção do mundo real), aqui a AR é delegada pro
 * visualizador nativo do aparelho:
 *  - Android (Chrome): WebXR / Scene Viewer — rastreamento real de superfície,
 *    a planta fica ancorada no chão da sua casa, oclusão e escala reais.
 *  - iOS: ainda não temos um arquivo USDZ (formato exigido pelo AR Quick Look
 *    da Apple), então cai num visualizador 3D interativo de altíssima
 *    qualidade (gira/zoom com o dedo) em vez da AR "no chão" — já é
 *    infinitamente melhor que girar a tela sem sentido, mas a AR plena no
 *    iOS é um próximo passo (gerar .usdz por espécie).
 *
 * MVP: usamos um modelo .glb genérico de "vaso + planta" (placeholder),
 * já que ainda não temos modelagem 3D por espécie real.
 */

const PLACEHOLDER_MODEL = '/models/plant-placeholder.glb'

interface ARViewProps {
  title: string
  species: Species[]
  /** 'ring' = várias espécies pra escolher (jardim). 'front' = uma só (scan). */
  layout?: 'ring' | 'front'
  onClose: () => void
}

export function ARView({ title, species, layout = 'ring', onClose }: ARViewProps) {
  const list = species.slice(0, 12)
  const [activeIdx, setActiveIdx] = useState(0)
  const viewerRef = useRef<HTMLElement & { activateAR?: () => Promise<void> }>(null)

  const active = list[activeIdx]

  async function handleActivateAR() {
    await viewerRef.current?.activateAR?.()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* HUD topo */}
      <header
        className="relative z-20 flex items-center justify-between px-4 py-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
      >
        <button
          onClick={onClose}
          aria-label="Fechar AR"
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl"
          style={{ background: 'rgba(0,10,20,0.7)', border: '1.5px solid rgba(0,255,200,0.4)' }}
        >
          ✕
        </button>
        <div
          style={{
            background: 'rgba(0,10,20,0.78)',
            border: '1.5px solid rgba(0,255,200,0.4)',
            borderRadius: 20,
            padding: '4px 14px',
            color: '#0fffe0',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
          }}
        >
          ✦ AR · {title}
        </div>
        <div className="w-10" />
      </header>

      {/* Visualizador 3D / AR */}
      <div className="relative flex-1 min-h-0">
        {active ? (
          <model-viewer
            ref={viewerRef as never}
            key={active.id}
            src={PLACEHOLDER_MODEL}
            alt={`Modelo 3D de ${active.popularName}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-placement="floor"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            exposure="1.05"
            environment-image="neutral"
            interaction-prompt="none"
            style={{ width: '100%', height: '100%', background: 'transparent', '--poster-color': 'transparent' } as React.CSSProperties}
          >
            <button
              slot="ar-button"
              onClick={handleActivateAR}
              className="absolute left-1/2 bottom-24 -translate-x-1/2 px-7 py-3 rounded-full font-extrabold text-sm"
              style={{
                background: 'linear-gradient(135deg, #00d6b0, #00fff0)',
                color: '#012',
                boxShadow: '0 0 24px rgba(0,255,200,0.4)',
              }}
            >
              ✦ Ver no meu espaço (AR)
            </button>
          </model-viewer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <div>
              <div className="text-3xl mb-2">🌱</div>
              <p className="text-sm text-white/80">Nenhuma planta pra mostrar em AR ainda.</p>
            </div>
          </div>
        )}

        {/* Nome da espécie atual */}
        {active && (
          <div
            className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap"
            style={{
              background: 'rgba(0,12,22,0.78)',
              border: '1px solid rgba(0,255,200,0.5)',
              borderRadius: 10,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 800,
              color: '#bafff0',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 0 12px rgba(0,255,200,0.25)',
            }}
          >
            {active.emoji} {active.popularName}
          </div>
        )}

        {/* Dica inferior */}
        <div className="absolute left-0 right-0 bottom-6 px-6 text-center pointer-events-none">
          <div
            className="inline-block"
            style={{
              background: 'rgba(0,10,20,0.7)',
              border: '1px solid rgba(0,255,200,0.3)',
              borderRadius: 20,
              padding: '8px 16px',
              color: 'rgba(186,255,240,0.9)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            👆 Arraste pra girar · toque em "Ver no meu espaço" pra AR real no Android
          </div>
        </div>
      </div>

      {/* Seletor de espécies (só faz sentido com várias) */}
      {layout === 'ring' && list.length > 1 && (
        <div className="relative z-20 px-4 py-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {list.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveIdx(i)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
              style={{
                background: i === activeIdx ? 'rgba(0,255,200,0.85)' : 'rgba(255,255,255,0.08)',
                color: i === activeIdx ? '#012' : 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,255,200,0.35)',
              }}
            >
              {s.emoji} {s.popularName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
