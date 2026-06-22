/** Fallback exibido enquanto o bundle de AR (model-viewer) carrega sob demanda. */
export function ARLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-4xl mb-2 anim-pulse-soft">✦</div>
        <p className="text-sm" style={{ color: 'rgba(186,255,240,0.85)' }}>
          Carregando AR…
        </p>
      </div>
    </div>
  )
}
