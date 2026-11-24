"use client"

import { DEMO_AREA, NEIGHBORHOOD_ANCHORS } from "@/platform/data/geo"
import type { Person, ScenarioKind } from "@/platform/domain/types"
import { mountCityMap } from "@/platform/maps/create"
import type { MapAdapter, MarkerSpec } from "@/platform/maps/types"
import type { EngineSnapshot } from "@/platform/simulation/engine"
import { ensureEngine } from "@/platform/stores/app"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"

export type MapViewHandle = { recenter: () => void }

function personDetail(person: Person) {
  const role =
    person.role === "member"
      ? "Resident"
      : person.role === "helper"
        ? "Community helper"
        : person.role === "nurse"
          ? "Nurse"
          : person.role === "doctor"
            ? "Doctor"
            : "Police officer"
  const state = person.assignedIncidentId ? "responding" : person.availability
  return `${role} · ${state}`
}

function buildMarkers(snap: EngineSnapshot): MarkerSpec[] {
  const layers = snap.settings.layers
  const markers: MarkerSpec[] = []

  for (const p of snap.people) {
    const kind = p.role
    const hidden =
      (kind === "member" && !layers.members) ||
      (kind === "helper" && !layers.helpers) ||
      (kind === "nurse" && !layers.nurses) ||
      (kind === "doctor" && !layers.doctors) ||
      (kind === "police" && !layers.police)
    markers.push({
      id: p.id,
      position: p.position,
      kind,
      label: p.displayName,
      detail: personDetail(p),
      caption: `${p.profile.age} · ${p.profile.neighborhood}`,
      photo: p.profile.photo,
      selected: snap.selectedPersonId === p.id,
      hidden,
    })
  }

  for (const f of snap.facilities) {
    const kind = f.kind === "hospital" ? "hospital" : f.kind === "police" ? "police_base" : "care_hub"
    markers.push({
      id: f.id,
      position: f.position,
      kind,
      label: f.name,
      selected: snap.selectedFacilityId === f.id,
      hidden: !layers.facilities,
    })
  }

  for (const v of snap.vehicles) {
    markers.push({
      id: v.id,
      position: v.position,
      kind: "ambulance",
      label: v.label,
      hidden: !layers.ambulances,
    })
  }

  for (const inc of snap.incidents) {
    if (inc.status === "closed" || inc.status === "cancelled") continue
    const resolvedPulse = inc.status === "resolved"
    const pulse = !resolvedPulse && !["resolved", "closed"].includes(inc.status)
    markers.push({
      id: inc.id,
      position: inc.position,
      kind: "incident",
      label: inc.kind,
      selected: snap.selectedIncidentId === inc.id,
      pulse,
      resolvedPulse,
      hidden: !layers.incidents,
    })
  }
  return markers
}

export const MapView = forwardRef<
  MapViewHandle,
  {
    snapshot: EngineSnapshot
    pendingScenario: ScenarioKind | null
    onMapReady?: (status: string | null) => void
    onSelectPerson: (id: string) => void
    onSelectFacility: (id: string) => void
    onSelectIncident: (id: string) => void
    onMapClick: (lat: number, lng: number) => void
    onUserPan: () => void
  }
>(function MapView(
  {
    snapshot,
    pendingScenario,
    onMapReady,
    onSelectPerson,
    onSelectFacility,
    onSelectIncident,
    onMapClick,
    onUserPan,
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<MapAdapter | null>(null)
  const snapshotRef = useRef(snapshot)
  const pendingRef = useRef(pendingScenario)
  const followSuspended = useRef(false)
  const lastFollowAt = useRef(0)
  const lastRunId = useRef(-1)
  const [supportsTilt, setSupportsTilt] = useState(false)
  const [tiltOn, setTiltOn] = useState(true)

  snapshotRef.current = snapshot
  pendingRef.current = pendingScenario

  useImperativeHandle(ref, () => ({
    recenter() {
      followSuspended.current = false
      adapterRef.current?.fitBounds(DEMO_AREA.bounds)
    },
  }))

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let alive = true
    let adapter: MapAdapter | null = null
    const swallow = { current: false }

    const paintPositions = () => {
      if (!adapter) return
      const engine = ensureEngine()
      const moving: { id: string; position: { lat: number; lng: number } }[] = []
      for (const person of engine.people) {
        if (person.movement.kind !== "stationary") {
          moving.push({ id: person.id, position: person.position })
        }
      }
      for (const vehicle of engine.vehicles) {
        if (vehicle.movement.kind !== "stationary") {
          moving.push({ id: vehicle.id, position: vehicle.position })
        }
      }
      if (moving.length) adapter.updateMarkerPositions(moving)
      const snap = snapshotRef.current
      if (!snap.settings.followMode || followSuspended.current || !snap.selectedIncidentId) return
      const now = performance.now()
      if (now - lastFollowAt.current < 2500) return
      const incident = engine.incidents.find((i) => i.id === engine.selectedIncidentId)
      if (!incident || incident.status === "closed" || incident.status === "cancelled") return
      lastFollowAt.current = now
      adapter.panTo(incident.position)
    }

    const disposePositions = ensureEngine().onPositions(paintPositions)

    void (async () => {
      try {
        const result = await mountCityMap(host)
        if (!alive) {
          result.adapter.destroy()
          return
        }
        adapter = result.adapter
        adapterRef.current = adapter
        const canTilt = typeof adapter.toggleTilt === "function"
        setSupportsTilt(canTilt)
        setTiltOn(canTilt)
        adapter.onClick((pos) => {
          if (swallow.current) {
            swallow.current = false
            return
          }
          if (pendingRef.current) onMapClick(pos.lat, pos.lng)
        })
        adapter.onMarkerSelect((id) => {
          swallow.current = true
          setTimeout(() => {
            swallow.current = false
          }, 0)
          const person = snapshotRef.current.people.find((p) => p.id === id)
          if (
            pendingRef.current &&
            person?.role === "member" &&
            !person.assignedIncidentId &&
            person.availability === "available"
          ) {
            onMapClick(person.position.lat, person.position.lng)
            return
          }
          if (id.startsWith("inc-")) onSelectIncident(id)
          else if (id.startsWith("fac-")) onSelectFacility(id)
          else if (id.startsWith("p-")) onSelectPerson(id)
        })
        adapter.onUserPan(() => {
          followSuspended.current = true
          onUserPan()
        })
        const snap = snapshotRef.current
        adapter.setPathNetwork(snap.paths)
        adapter.setLabels(
          NEIGHBORHOOD_ANCHORS.map((a) => ({
            id: a.id,
            position: a.position,
            text: a.label,
          })),
        )
        adapter.fitBounds(DEMO_AREA.bounds)
        onMapReady?.(result.statusMessage)
      } catch (e) {
        if (alive) onMapReady?.(e instanceof Error ? e.message : "The 3D city map did not load.")
      }
    })()

    return () => {
      alive = false
      disposePositions()
      adapter?.destroy()
      adapterRef.current = null
    }
    // Map listeners stay on refs so the city map is mounted once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const adapter = adapterRef.current
    if (!adapter) return
    if (snapshot.runId !== lastRunId.current) {
      lastRunId.current = snapshot.runId
      followSuspended.current = false
      adapter.setPathNetwork(snapshot.paths)
      adapter.setLabels(
        NEIGHBORHOOD_ANCHORS.map((a) => ({
          id: a.id,
          position: a.position,
          text: a.label,
        })),
      )
      adapter.fitBounds(DEMO_AREA.bounds)
    }
    adapter.setMarkers(buildMarkers(snapshot))
    const routes = snapshot.settings.layers.routes
      ? snapshot.assignments
          .filter((a) => a.status === "en_route")
          .flatMap((a) => {
            const person = snapshot.people.find((p) => p.id === a.personId)
            const mov = person?.movement
            if (!mov || mov.kind !== "assigned") return []
            return [
              {
                id: a.id,
                points: mov.path,
                color: a.role === "police" ? "#1a3358" : a.role === "doctor" ? "#6b4c9a" : "#1f7a72",
              },
            ]
          })
      : []
    for (const v of snapshot.vehicles) {
      if (
        (v.movement.kind === "assigned" || v.movement.kind === "returning") &&
        snapshot.settings.layers.routes
      ) {
        routes.push({ id: `vr-${v.id}`, points: v.movement.path, color: "#c45c26" })
      }
    }
    adapter.setRoutes(routes)
    const circles = snapshot.incidents
      .filter((i) => !["closed", "cancelled", "resolved"].includes(i.status))
      .map((i) => ({
        id: `c-${i.id}`,
        center: i.position,
        radiusM: i.discoveryRadiusM,
      }))
    adapter.setCircles(snapshot.settings.layers.incidents ? circles : [])
  }, [snapshot])

  function zoom(direction: 1 | -1) {
    followSuspended.current = true
    adapterRef.current?.nudgeZoom(direction)
  }

  function toggleTilt() {
    const adapter = adapterRef.current
    if (!adapter?.toggleTilt) return
    setTiltOn(adapter.toggleTilt())
  }

  return (
    <div className="map-stage">
      <div className="map-host" ref={hostRef} />
      <div className="map-toolbar">
        <button type="button" className="btn" onClick={() => zoom(1)} aria-label="Zoom in">
          +
        </button>
        <button type="button" className="btn" onClick={() => zoom(-1)} aria-label="Zoom out">
          −
        </button>
        {supportsTilt ? (
          <button
            type="button"
            className={tiltOn ? "btn active" : "btn"}
            aria-pressed={tiltOn}
            aria-label="Toggle 3D tilt"
            onClick={toggleTilt}
          >
            3D
          </button>
        ) : null}
      </div>
      {snapshot.mapStatus ? (
        <div className="map-status" role="status">
          {snapshot.mapStatus}
        </div>
      ) : null}
      <div className="map-legend" aria-label="Map legend">
        <div>
          <span style={{ color: "#3b6ea5" }}>●</span> Members
        </div>
        <div>
          <span style={{ color: "#2f8f6b" }}>●</span> Helpers
        </div>
        <div>
          <span style={{ color: "#1f7a72" }}>■</span> Nurses (N)
        </div>
        <div>
          <span style={{ color: "#6b4c9a" }}>◆</span> Doctors (D)
        </div>
        <div>
          <span style={{ color: "#1a3358" }}>▲</span> Police
        </div>
        <div>
          <span style={{ color: "#b23b3b" }}>▣</span> Facilities
        </div>
        <div>
          <span style={{ color: "#c45c26" }}>■</span> Ambulances
        </div>
        <div>
          <span style={{ color: "#d64545" }}>◎</span> Active incident
        </div>
      </div>
      {snapshot.presenterCaption ? (
        <div className="caption-bar" role="status">
          {snapshot.presenterCaption}
        </div>
      ) : null}
      {pendingScenario ? (
        <div className="map-status place-hint" role="status">
          Click a member or a path to place {pendingScenario.replaceAll("_", " ")}. Invalid spots are
          declined.
        </div>
      ) : null}
    </div>
  )
})
