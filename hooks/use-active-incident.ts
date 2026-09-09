"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { incidentIdToScenarioKey, storeActiveIncident } from "@/data/scenarios"

export function useActiveIncident() {
  const searchParams = useSearchParams()
  const paramId = searchParams.get("incident")
  const { scenario, setScenarioKey, setScenarioMode, scenarioKey } = useDemoScenario()
  const [incidentId, setIncidentId] = useState(scenario.incident.id)

  useEffect(() => {
    if (paramId) {
      const key = incidentIdToScenarioKey(paramId)
      if (key !== scenarioKey) setScenarioMode(key)
      setIncidentId(paramId)
      storeActiveIncident(paramId)
    } else {
      setIncidentId(scenario.incident.id)
    }
  }, [paramId, scenario.incident.id, scenarioKey, setScenarioMode])

  const selectIncident = useCallback(
    (id: string) => {
      setScenarioKey(incidentIdToScenarioKey(id))
      setIncidentId(id)
      storeActiveIncident(id)
    },
    [setScenarioKey],
  )

  return { incidentId, scenario, selectIncident }
}
