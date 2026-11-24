import type { Kpis } from "@/platform/domain/types"

function fmt(n: number | null) {
  return n == null ? "—" : `${Math.round(n)}s`
}

export function KpiStrip({ kpis }: { kpis: Kpis }) {
  return (
    <section className="kpi-strip" aria-label="Simulation KPIs">
      <div className="kpi">
        <div className="kpi-label">Members</div>
        <div className="kpi-value">{kpis.members}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Avail. helpers</div>
        <div className="kpi-value">{kpis.availableHelpers}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Avail. clinical</div>
        <div className="kpi-value">{kpis.availableClinical}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Active incidents</div>
        <div className="kpi-value">{kpis.activeIncidents}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Completed</div>
        <div className="kpi-value">{kpis.completedIncidents}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Median 1st arrival</div>
        <div className="kpi-value">{fmt(kpis.medianFirstArrivalSec)}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Benefits issued</div>
        <div className="kpi-value">{kpis.benefitsIssued}</div>
      </div>
    </section>
  )
}
