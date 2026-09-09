"use client"

import { IncidentSelectorBar } from "@/components/scenario/incident-selector"
import { useDemoScenario } from "@/components/scenario/scenario-provider"

export function ScenarioSwitcher() {
  const { scenarioKey, setScenarioMode } = useDemoScenario()

  return (
    <section
      id="incident-selector"
      aria-label="事故选择器"
      className="overflow-hidden rounded-lg border border-border bg-card shadow-card"
    >
      <IncidentSelectorBar
        selectedKey={scenarioKey}
        onSelect={(key) => setScenarioMode(key)}
      />
    </section>
  )
}
