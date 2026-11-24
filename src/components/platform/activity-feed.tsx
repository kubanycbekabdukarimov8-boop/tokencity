import type { SimEvent } from "@/platform/domain/types"

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function ActivityFeed({
  events,
  onSelectIncident,
}: {
  events: SimEvent[]
  onSelectIncident: (id: string) => void
}) {
  return (
    <section className="feed" aria-label="Activity feed">
      <h2 className="feed-title">Activity</h2>
      {events.slice(0, 40).map((ev) => (
        <button
          key={ev.id}
          type="button"
          className="feed-item"
          onClick={() => ev.incidentId && onSelectIncident(ev.incidentId)}
        >
          <time>{formatTime(ev.at)}</time>
          {ev.message}
        </button>
      ))}
    </section>
  )
}
