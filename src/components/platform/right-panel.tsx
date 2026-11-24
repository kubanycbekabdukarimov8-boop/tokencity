import type { EngineSnapshot } from "@/platform/simulation/engine"

const STAGES = [
  "triggered",
  "locating",
  "routing",
  "responding",
  "on_scene",
  "assisting",
  "verification_pending",
  "resolved",
  "closed",
] as const

function stageState(status: string, stage: string): "done" | "active" | "" {
  if (status === "cancelled") return stage === "triggered" ? "active" : ""
  const si = STAGES.indexOf(stage as (typeof STAGES)[number])
  const ci = STAGES.indexOf(status as (typeof STAGES)[number])
  if (ci < 0) return ""
  if (si < ci) return "done"
  if (si === ci) return "active"
  return ""
}

export function RightPanel({
  snapshot,
  onCancel,
  onRetryAwards,
}: {
  snapshot: EngineSnapshot
  onCancel: (incidentId: string) => void
  onRetryAwards: () => void
}) {
  const incident = snapshot.incidents.find((i) => i.id === snapshot.selectedIncidentId) ?? null
  const person = snapshot.people.find((p) => p.id === snapshot.selectedPersonId) ?? null
  const facility = snapshot.facilities.find((f) => f.id === snapshot.selectedFacilityId) ?? null
  const assignments = incident
    ? snapshot.assignments.filter((a) => a.incidentId === incident.id)
    : []
  const awards = incident ? snapshot.awards.filter((a) => a.incidentId === incident.id) : []
  const patient = incident ? snapshot.people.find((p) => p.id === incident.patientId) : null

  return (
    <aside className="detail-panel" aria-label="Incident and selection detail">
      {snapshot.summary ? (
        <div className="card-block summary-box">
          <strong>Run summary</strong>
          <div>Handled incidents: {snapshot.summary.handledIncidents}</div>
          <div>
            Arrival times:{" "}
            {snapshot.summary.arrivalTimesSec.length
              ? snapshot.summary.arrivalTimesSec.map((t) => `${Math.round(t)}s`).join(", ")
              : "—"}
          </div>
          <div>Professionals involved: {snapshot.summary.professionalParticipation}</div>
          <div>Verified helper contributions: {snapshot.summary.verifiedCommunityContributions}</div>
          <div>Credits issued: {snapshot.summary.creditsIssued}</div>
        </div>
      ) : null}

      {incident ? (
        <>
          <h2 className="section-title">Selected incident</h2>
          <div className="card-block">
            <strong>{incident.kind.replaceAll("_", " ")}</strong>
            <div>{incident.sourceLabel}</div>
            <div style={{ color: "var(--vg-muted)", marginTop: "0.25rem" }}>
              Patient: {patient?.displayName ?? incident.patientId} · status {incident.status}
            </div>
            {incident.notes.map((note) => (
              <div key={note} style={{ marginTop: "0.35rem" }}>
                {note}
              </div>
            ))}
            {!["closed", "cancelled", "resolved"].includes(incident.status) ? (
              <div className="btn-row" style={{ marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-danger" onClick={() => onCancel(incident.id)}>
                  Cancel incident
                </button>
              </div>
            ) : null}
          </div>

          <h2 className="section-title">Progress</h2>
          <div className="timeline">
            {STAGES.map((stage) =>
              stage !== "closed" || incident.status === "closed" ? (
                <div key={stage} className="timeline-item">
                  <span className={`dot ${stageState(incident.status, stage)}`} />
                  <span>{stage.replaceAll("_", " ")}</span>
                </div>
              ) : null,
            )}
          </div>

          <h2 className="section-title">Matching</h2>
          <div className="card-block">
            Discovery radius {incident.discoveryRadiusM} m
            {incident.expandedDiscovery ? " · expanded to 200 m" : ""}
            {incident.communityRestricted ? (
              <div style={{ marginTop: "0.35rem", color: "var(--vg-alert)" }}>
                Community response restricted — professional response requested.
              </div>
            ) : null}
            {incident.professionalEscalation ? (
              <div style={{ marginTop: "0.25rem" }}>Professional escalation active.</div>
            ) : null}
          </div>

          <h2 className="section-title">Assigned responders</h2>
          {assignments.length === 0 ? (
            <div className="card-block">No assignments yet.</div>
          ) : (
            assignments.map((a) => {
              const who = snapshot.people.find((p) => p.id === a.personId)
              return (
                <div key={a.id} className="card-block">
                  <strong>{who?.displayName ?? a.personId}</strong> · {a.role}
                  <div>
                    {a.status}
                    {a.stagingOnly ? " · staging (safe point)" : ""}
                  </div>
                  <div style={{ color: "var(--vg-muted)" }}>
                    {a.routeLabel} · ~{Math.round(a.illustrativeEtaSec)}s
                  </div>
                </div>
              )
            })
          )}

          {incident.hospitalId ? (
            <>
              <h2 className="section-title">Hospital coordination</h2>
              <div className="card-block">
                <strong>
                  {snapshot.facilities.find((f) => f.id === incident.hospitalId)?.name ?? "Demo Hospital"}
                </strong>
                <div>Fictional coordination panel — no live beds or institutional partnership.</div>
                {incident.vehicleId ? (
                  <div style={{ marginTop: "0.35rem" }}>
                    {snapshot.vehicles.find((x) => x.id === incident.vehicleId)?.label} ·{" "}
                    {snapshot.vehicles.find((x) => x.id === incident.vehicleId)?.status}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {incident.kind === "security_sos" ? (
            <>
              <h2 className="section-title">Police coordination</h2>
              <div className="card-block">
                Demo Police Base — simulated professional response. No personal rescue points for officers.
              </div>
            </>
          ) : null}

          <h2 className="section-title">Verification</h2>
          <div className="card-block">
            Simulated workflow — location proximity alone is insufficient.
            {incident.verificationChecks.map((check) => (
              <div key={check.label} style={{ marginTop: "0.3rem" }}>
                {check.passed ? "✓" : "○"} {check.label}
              </div>
            ))}
          </div>

          <h2 className="section-title">Benefits</h2>
          {awards.length === 0 ? (
            <div className="card-block">No helper awards for this incident yet.</div>
          ) : (
            awards.map((award) => (
              <div key={award.idempotencyKey} className="card-block">
                {award.credits} credits · {award.status}
                {award.reason ? <div style={{ color: "var(--vg-muted)" }}>{award.reason}</div> : null}
                <div style={{ fontSize: "0.75rem", color: "var(--vg-muted)" }}>{award.idempotencyKey}</div>
              </div>
            ))
          )}
          <button type="button" className="btn" onClick={onRetryAwards}>
            Retry pending awards
          </button>
        </>
      ) : person ? (
        <>
          <h2 className="section-title">Selected person</h2>
          <div className="card-block person-card">
            <img className="person-photo" src={person.profile.photo} alt="" />
            <div>
              <strong>{person.displayName}</strong>
              <div>
                {person.role} · {person.availability}
              </div>
              <div>
                {person.profile.age} · {person.profile.neighborhood}
              </div>
              <div>{person.profile.summary}</div>
              <div>Consent to respond: {person.consentToRespond ? "yes" : "no"}</div>
              {person.qualifications.length ? (
                <div>Qualifications: {person.qualifications.join(", ")}</div>
              ) : null}
              <div>Assigned incident: {person.assignedIncidentId ?? "—"}</div>
              <div>Benefit balance: {person.benefitBalance} demo credits</div>
              <div style={{ color: "var(--vg-muted)", marginTop: "0.35rem" }}>
                ID {person.id} · fictional profile
              </div>
            </div>
          </div>
        </>
      ) : facility ? (
        <>
          <h2 className="section-title">Facility</h2>
          <div className="card-block">
            <strong>{facility.name}</strong>
            <div>{facility.kind} · fictional operational capacity</div>
            {facility.sourceNote ? (
              <div style={{ marginTop: "0.35rem", color: "var(--vg-muted)" }}>{facility.sourceNote}</div>
            ) : null}
            <div style={{ marginTop: "0.5rem" }}>Associated simulated staff:</div>
            {facility.staffIds.map((sid) => {
              const staff = snapshot.people.find((p) => p.id === sid)
              return (
                <div key={sid}>
                  {staff?.displayName ?? sid} · {staff?.role}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <h2 className="section-title">Detail</h2>
          <div className="card-block">
            Select an incident, professional, or facility on the map or from the lists. KPIs and the
            activity feed stay in sync with the simulation clock.
          </div>
        </>
      )}
    </aside>
  )
}
