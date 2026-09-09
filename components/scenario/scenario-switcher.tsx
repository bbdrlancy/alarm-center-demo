"use client"

import { IncidentSelectorBar } from "@/components/scenario/incident-selector"
import { useDemoScenario } from "@/components/scenario/scenario-provider"

export function ScenarioSwitcher() {
  const { scenarioKey, setScenarioMode } = useDemoScenario()

  return (
    <section
      id="incident-selector"
      aria-label="事故选择器"
      className="sticky top-14 z-20 overflow-hidden rounded-lg border border-border bg-card/95 shadow-card backdrop-blur supports-[backdrop-filter]:bg-card/90"
    >
      <IncidentSelectorBar
        selectedKey={scenarioKey}
        onSelect={(key) => setScenarioMode(key)}
      />
    </section>
  )
}
