import type { LayerVisibility, ScenarioKind } from "@/platform/domain/types"
import type { EngineSnapshot } from "@/platform/simulation/engine"

const LAYER_LABELS: Record<keyof LayerVisibility, string> = {
  members: "Members",
  helpers: "Community helpers",
  nurses: "Nurses",
  doctors: "Doctors",
  police: "Police",
  facilities: "Hospitals and care hubs",
  ambulances: "Ambulances",
  incidents: "Incidents",
  routes: "Active routes",
}

const SPEEDS = [1, 2, 4, 8] as const

export function LeftRail({
  snapshot,
  pendingScenario,
  populationDraft,
  onArmScenario,
  onTriggerArmed,
  onSeveralAlerts,
  onSpeed,
  onLayers,
  onPopulationDraft,
  onResetSettings,
  onDiscovery,
  onBenefitDelay,
  onFollow,
  onRecenter,
  onSelectPerson,
  onSelectIncident,
}: {
  snapshot: EngineSnapshot
  pendingScenario: ScenarioKind | null
  populationDraft: number
  onArmScenario: (kind: ScenarioKind) => void
  onTriggerArmed: () => void
  onSeveralAlerts: () => void
  onSpeed: (s: 1 | 2 | 4 | 8) => void
  onLayers: (partial: Partial<LayerVisibility>) => void
  onPopulationDraft: (n: number) => void
  onResetSettings: () => void
  onDiscovery: (m: number) => void
  onBenefitDelay: (on: boolean) => void
  onFollow: (on: boolean) => void
  onRecenter: () => void
  onSelectPerson: (id: string) => void
  onSelectIncident: (id: string) => void
}) {
  const layers = snapshot.settings.layers
  const pros = snapshot.people.filter((p) => p.role === "doctor" || p.role === "nurse")

  return (
    <aside className="rail" aria-label="Scenario and layer controls">
      {snapshot.settings.presentationMode ? (
        <>
          <p style={{ fontSize: "0.85rem", color: "var(--vg-muted)" }}>
            Presentation mode — advanced controls hidden. Use Pause / Resume or Exit presentation.
          </p>
          <div className="btn-row">
            <button type="button" className="btn" onClick={onRecenter}>
              Recenter
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="section-title">Scenarios</h2>
          <div className="btn-row">
            <button
              type="button"
              className={pendingScenario === "fall" ? "btn active" : "btn"}
              aria-pressed={pendingScenario === "fall"}
              onClick={() => onArmScenario("fall")}
            >
              Fall alert
            </button>
            <button
              type="button"
              className={pendingScenario === "medical_sos" ? "btn active" : "btn"}
              aria-pressed={pendingScenario === "medical_sos"}
              onClick={() => onArmScenario("medical_sos")}
            >
              Medical SOS
            </button>
            <button
              type="button"
              className={pendingScenario === "security_sos" ? "btn active" : "btn"}
              aria-pressed={pendingScenario === "security_sos"}
              onClick={() => onArmScenario("security_sos")}
            >
              Security SOS
            </button>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--vg-muted)", margin: "0.4rem 0 0" }}>
            Arm a scenario, then click a member or path on the map. Or place it on the nearest eligible member.
          </p>
          <div className="btn-row" style={{ marginTop: "0.4rem" }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!pendingScenario}
              onClick={onTriggerArmed}
            >
              Trigger at nearest member
            </button>
            <button type="button" className="btn" onClick={onSeveralAlerts}>
              Several alerts
            </button>
          </div>

          <h2 className="section-title">Population</h2>
          <label className="field">
            <span>{populationDraft} people (apply via reset)</span>
            <input
              type="range"
              min={100}
              max={1000}
              step={50}
              value={populationDraft}
              onChange={(e) => onPopulationDraft(Number(e.currentTarget.value))}
            />
          </label>
          <button type="button" className="btn" onClick={onResetSettings}>
            Reset with new settings
          </button>

          <h2 className="section-title">Simulation speed</h2>
          <div className="btn-row">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                className={snapshot.settings.speed === s ? "btn active" : "btn"}
                onClick={() => onSpeed(s)}
              >
                {s}×
              </button>
            ))}
          </div>

          <h2 className="section-title">Discovery radius</h2>
          <label className="field">
            <span>{snapshot.settings.discoveryRadiusM} m, then 200 m if nobody is eligible</span>
            <input
              type="range"
              min={100}
              max={200}
              step={100}
              value={snapshot.settings.discoveryRadiusM}
              onChange={(e) => onDiscovery(Number(e.currentTarget.value))}
            />
          </label>

          <label className="field" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <input
              type="checkbox"
              checked={snapshot.settings.benefitDelay}
              onChange={(e) => onBenefitDelay(e.currentTarget.checked)}
            />
            Simulate benefit-service delay
          </label>
          <label className="field" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <input
              type="checkbox"
              checked={snapshot.settings.followMode}
              onChange={(e) => onFollow(e.currentTarget.checked)}
            />
            Follow selected incident
          </label>

          <div className="btn-row">
            <button type="button" className="btn" onClick={onRecenter}>
              Recenter
            </button>
          </div>

          <h2 className="section-title">Layers</h2>
          <div className="layer-list">
            {(Object.keys(layers) as (keyof LayerVisibility)[]).map((key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={layers[key]}
                  onChange={(e) => onLayers({ [key]: e.currentTarget.checked })}
                />
                {LAYER_LABELS[key]}
              </label>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">Incidents</h2>
      {snapshot.incidents.length === 0 ? (
        <p style={{ fontSize: "0.8rem", color: "var(--vg-muted)", margin: 0 }}>
          No incidents in this run.
        </p>
      ) : (
        <div className="pro-list">
          {snapshot.incidents.map((incident) => (
            <button
              key={incident.id}
              type="button"
              className={
                snapshot.selectedIncidentId === incident.id ? "pro-item active" : "pro-item"
              }
              onClick={() => onSelectIncident(incident.id)}
            >
              <span>
                <strong>{incident.kind.replaceAll("_", " ")}</strong>
                <div className="role">
                  {incident.status.replaceAll("_", " ")} · {incident.id}
                </div>
              </span>
            </button>
          ))}
        </div>
      )}

      <h2 className="section-title">Professional resources</h2>
      <div className="pro-list">
        {pros.slice(0, 12).map((p) => (
          <button key={p.id} type="button" className="pro-item" onClick={() => onSelectPerson(p.id)}>
            <img className="pro-photo" src={p.profile.photo} alt="" />
            <span>
              <strong>{p.displayName}</strong>
              <div className="role">
                {p.role} · {p.availability}
                {p.qualifications[0] ? ` · ${p.qualifications[0]}` : ""}
              </div>
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
