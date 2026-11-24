export function TopBar({
  simClockLabel,
  paused,
  presentationMode,
  speed,
  onStart,
  onPause,
  onResume,
  onReset,
  onGuided,
  onTogglePresentation,
}: {
  simClockLabel: string
  paused: boolean
  presentationMode: boolean
  speed: number
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onGuided: () => void
  onTogglePresentation: () => void
}) {
  return (
    <header className="top-bar">
      <div className="brand-block">
        <img
          src="/brand/token-city.gif"
          alt=""
          width={118}
          height={53}
          className="brand-mark"
        />
        <div>
          <div className="brand">Token City</div>
          <div className="brand-sub">Pozuelo de Alarcón · proposed city pilot</div>
        </div>
        <span className="badge">Investor demo · simulated data</span>
      </div>
      <div className="btn-row" style={{ alignItems: "center" }}>
        <span className="badge" aria-live="polite">
          Sim clock {simClockLabel} · {speed}× · {paused ? "Paused" : "Running"}
        </span>
        {presentationMode ? (
          paused ? (
            <button type="button" className="btn" onClick={onResume}>
              Resume
            </button>
          ) : (
            <button type="button" className="btn" onClick={onPause}>
              Pause
            </button>
          )
        ) : (
          <>
            <button type="button" className="btn" onClick={onStart}>
              Start
            </button>
            {paused ? (
              <button type="button" className="btn" onClick={onResume}>
                Resume
              </button>
            ) : (
              <button type="button" className="btn" onClick={onPause}>
                Pause
              </button>
            )}
            <button type="button" className="btn" onClick={onReset}>
              Reset
            </button>
          </>
        )}
        <button type="button" className="btn btn-primary" onClick={onGuided}>
          Run investor demo
        </button>
        <button
          type="button"
          className={presentationMode ? "btn active" : "btn"}
          onClick={onTogglePresentation}
        >
          {presentationMode ? "Exit presentation" : "Presentation"}
        </button>
      </div>
    </header>
  )
}
