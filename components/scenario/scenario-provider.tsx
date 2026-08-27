"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  SCENARIO_STORAGE_KEY,
  scenarios,
  scenarioOrder,
  storeActiveIncident,
  type ScenarioKey,
  type ScenarioMode,
  type ScenarioModel,
} from "@/data/scenarios"

type ScenarioContextValue = {
  scenario: ScenarioModel
  scenarioKey: ScenarioKey
  mode: ScenarioMode
  transitioning: boolean
  autoDemo: boolean
  setScenarioMode: (mode: ScenarioMode) => void
  setScenarioKey: (key: ScenarioKey) => void
}

const ScenarioContext = createContext<ScenarioContextValue | null>(null)

const AUTO_ROTATE_MS = 30_000
const FADE_MS = 400

function readStoredMode(): ScenarioMode {
  if (typeof window === "undefined") return "power"
  const stored = sessionStorage.getItem(SCENARIO_STORAGE_KEY) as ScenarioMode | null
  if (stored === "auto") return "auto"
  if (stored && scenarios[stored as ScenarioKey]) return stored
  return "power"
}

function applyTheme(scenario: ScenarioModel) {
  const root = document.documentElement
  root.style.setProperty("--scenario-accent", scenario.color)
  root.style.setProperty("--p1", scenario.color)
  root.dataset.scenario = scenario.id
}

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ScenarioMode>("power")
  const [scenarioKey, setScenarioKeyState] = useState<ScenarioKey>("power")
  const [transitioning, setTransitioning] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const rotateIndex = useRef(0)
  const timerRef = useRef<number | null>(null)

  const scenario = scenarios[scenarioKey]
  const autoDemo = mode === "auto"

  const commitScenario = useCallback((key: ScenarioKey) => {
    const next = scenarios[key]
    setScenarioKeyState(key)
    storeActiveIncident(next.incident.id)
    applyTheme(next)
    sessionStorage.setItem(SCENARIO_STORAGE_KEY, key)
  }, [])

  const switchWithTransition = useCallback(
    (key: ScenarioKey) => {
      setTransitioning(true)
      window.setTimeout(() => {
        commitScenario(key)
        window.setTimeout(() => setTransitioning(false), FADE_MS)
      }, FADE_MS)
    },
    [commitScenario],
  )

  const setScenarioKey = useCallback(
    (key: ScenarioKey) => {
      if (key === scenarioKey && !transitioning) return
      switchWithTransition(key)
    },
    [scenarioKey, transitioning, switchWithTransition],
  )

  const setScenarioMode = useCallback(
    (nextMode: ScenarioMode) => {
      setMode(nextMode)

      if (nextMode === "auto") {
        sessionStorage.setItem(SCENARIO_STORAGE_KEY, "auto")
        rotateIndex.current = scenarioOrder.indexOf(scenarioKey)
        switchWithTransition(scenarioOrder[rotateIndex.current] ?? "power")
        return
      }

      sessionStorage.setItem(SCENARIO_STORAGE_KEY, nextMode)

      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }

      switchWithTransition(nextMode)
    },
    [scenarioKey, switchWithTransition],
  )

  useEffect(() => {
    const stored = readStoredMode()
    if (stored === "auto") {
      setMode("auto")
      commitScenario("power")
    } else {
      setMode(stored)
      commitScenario(stored)
    }
    setHydrated(true)
  }, [commitScenario])

  useEffect(() => {
    if (!hydrated || !autoDemo) return

    timerRef.current = window.setInterval(() => {
      rotateIndex.current = (rotateIndex.current + 1) % scenarioOrder.length
      switchWithTransition(scenarioOrder[rotateIndex.current]!)
    }, AUTO_ROTATE_MS)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [autoDemo, hydrated, switchWithTransition])

  const value = useMemo(
    () => ({
      scenario,
      scenarioKey,
      mode,
      transitioning,
      autoDemo,
      setScenarioMode,
      setScenarioKey,
    }),
    [scenario, scenarioKey, mode, transitioning, autoDemo, setScenarioMode, setScenarioKey],
  )

  return (
    <ScenarioContext.Provider value={value}>
      <div
        className="transition-opacity duration-500 ease-in-out"
        style={{ opacity: transitioning ? 0.35 : 1 }}
      >
        {children}
      </div>
      {transitioning ? (
        <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
          <div className="rounded-xl border border-border bg-card px-6 py-5 text-center shadow-2xl">
            <div className="mb-2 text-sm font-semibold text-foreground">Loading Scenario ...</div>
            <div className="text-[11px] text-muted-foreground">
              Power → Cooling → Storage → Network
            </div>
          </div>
        </div>
      ) : null}
    </ScenarioContext.Provider>
  )
}

export function useDemoScenario() {
  const ctx = useContext(ScenarioContext)
  if (!ctx) throw new Error("useDemoScenario must be used within ScenarioProvider")
  return ctx
}

export function useScenario() {
  return useDemoScenario()
}
