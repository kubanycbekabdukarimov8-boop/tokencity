"use client"

import type { ScenarioKind } from "@/platform/domain/types"
import type { EngineSnapshot } from "@/platform/simulation/engine"
import {
  bindAnimationLoop,
  ensureEngine,
  persistSettings,
  startGuidedDemo,
  startSeveralAlerts,
} from "@/platform/stores/app"
import { useEffect, useRef, useState } from "react"
import { ActivityFeed } from "./activity-feed"
import { KpiStrip } from "./kpi-strip"
import { LeftRail } from "./left-rail"
import { MapView, type MapViewHandle } from "./map-view"
import { RightPanel } from "./right-panel"
import { TopBar } from "./top-bar"

export function PlatformApp() {
  const engine = ensureEngine()
  const mapView = useRef<MapViewHandle>(null)
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(() => engine.snapshot())
  const [pendingScenario, setPendingScenario] = useState<ScenarioKind | null>(null)
  const [populationDraft, setPopulationDraft] = useState(engine.settings.population)
  const [mobileView, setMobileView] = useState<"map" | "list" | "detail">("map")
  const [clockLabel, setClockLabel] = useState(engine.clock.format())
  const [clockPaused, setClockPaused] = useState(engine.clock.paused)
  const [clockSpeed, setClockSpeed] = useState(engine.settings.speed)

  function syncClock() {
    setClockLabel(engine.clock.format())
    setClockPaused(engine.clock.paused)
    setClockSpeed(engine.settings.speed)
  }

  function refresh() {
    setSnapshot(engine.snapshot())
  }

  useEffect(() => {
    const unsub = engine.subscribe(() => {
      setSnapshot(engine.snapshot())
      syncClock()
    })
    const disposeLoop = bindAnimationLoop(() => {
      syncClock()
    })
    refresh()
    syncClock()
    return () => {
      disposeLoop()
      unsub()
    }
    // The simulation engine is a module singleton.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="platform-root">
      <div className="app-shell">
        <TopBar
          simClockLabel={clockLabel}
          paused={clockPaused}
          presentationMode={snapshot.settings.presentationMode}
          speed={clockSpeed}
          onStart={() => {
            engine.start()
            refresh()
          }}
          onPause={() => {
            engine.pause()
            refresh()
          }}
          onResume={() => {
            engine.resume()
            refresh()
          }}
          onReset={() => {
            engine.applySettingsAndReset({
              population: populationDraft,
              seed: engine.settings.seed,
            })
            persistSettings()
            setPendingScenario(null)
            refresh()
          }}
          onGuided={() => {
            startGuidedDemo()
            refresh()
            syncClock()
          }}
          onTogglePresentation={() => {
            engine.setPresentationMode(!engine.settings.presentationMode)
            refresh()
          }}
        />
        <KpiStrip kpis={snapshot.kpis} />
        <div className="mobile-toggle">
          <button
            type="button"
            className={mobileView === "map" ? "btn active" : "btn"}
            onClick={() => setMobileView("map")}
          >
            Map
          </button>
          <button
            type="button"
            className={mobileView === "list" ? "btn active" : "btn"}
            onClick={() => setMobileView("list")}
          >
            Controls
          </button>
          <button
            type="button"
            className={mobileView === "detail" ? "btn active" : "btn"}
            onClick={() => setMobileView("detail")}
          >
            Detail
          </button>
        </div>
        <div
          className={`workspace${mobileView === "list" ? " show-list" : ""}${
            mobileView === "detail" ? " show-detail" : ""
          }`}
        >
          <LeftRail
            snapshot={snapshot}
            pendingScenario={pendingScenario}
            populationDraft={populationDraft}
            onArmScenario={(kind) => setPendingScenario((current) => (current === kind ? null : kind))}
            onTriggerArmed={() => {
              if (!pendingScenario) return
              const incident = engine.triggerScenario(pendingScenario)
              setPendingScenario(null)
              if (incident) setMobileView("detail")
              refresh()
            }}
            onSeveralAlerts={() => {
              startSeveralAlerts()
              setPendingScenario(null)
              setMobileView("detail")
              refresh()
              syncClock()
            }}
            onSelectIncident={(id) => {
              engine.selectIncident(id)
              setMobileView("detail")
              refresh()
            }}
            onSpeed={(s) => {
              engine.setSpeed(s)
              refresh()
            }}
            onLayers={(partial) => {
              engine.setLayers(partial)
              refresh()
            }}
            onPopulationDraft={setPopulationDraft}
            onResetSettings={() => {
              engine.applySettingsAndReset({
                population: populationDraft,
                seed: engine.settings.seed,
              })
              persistSettings()
              setPendingScenario(null)
              refresh()
            }}
            onDiscovery={(m) => {
              engine.setDiscoveryRadius(m)
              refresh()
            }}
            onBenefitDelay={(on) => {
              engine.setBenefitDelay(on)
              refresh()
            }}
            onFollow={(on) => {
              engine.setFollowMode(on)
              refresh()
            }}
            onRecenter={() => mapView.current?.recenter()}
            onSelectPerson={(id) => {
              engine.selectPerson(id)
              setMobileView("detail")
              refresh()
            }}
          />
          <MapView
            ref={mapView}
            snapshot={snapshot}
            pendingScenario={pendingScenario}
            onMapReady={(status) => {
              engine.setMapStatus(status)
              refresh()
            }}
            onSelectPerson={(id) => {
              engine.selectPerson(id)
              setMobileView("detail")
              refresh()
            }}
            onSelectFacility={(id) => {
              engine.selectFacility(id)
              setMobileView("detail")
              refresh()
            }}
            onSelectIncident={(id) => {
              engine.selectIncident(id)
              setMobileView("detail")
              refresh()
            }}
            onMapClick={(lat, lng) => {
              if (!pendingScenario) return
              const incident = engine.triggerScenario(pendingScenario, { lat, lng })
              if (!incident) {
                refresh()
                return
              }
              setPendingScenario(null)
              setMobileView("detail")
              refresh()
            }}
            onUserPan={() => {
              if (engine.settings.followMode) {
                engine.setFollowMode(false)
                refresh()
              }
            }}
          />
          <RightPanel
            snapshot={snapshot}
            onCancel={(id) => {
              engine.cancelIncident(id)
              refresh()
            }}
            onRetryAwards={() => {
              engine.retryPendingAwards()
              refresh()
            }}
          />
        </div>
        <ActivityFeed
          events={snapshot.events}
          onSelectIncident={(id) => {
            engine.selectIncident(id)
            setMobileView("detail")
            refresh()
          }}
        />
      </div>
      {snapshot.toasts.length ? (
        <div className="toast-stack" aria-live="polite">
          {snapshot.toasts.slice(0, 3).map((t) => (
            <div key={t.id} className="toast">
              {t.message}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
