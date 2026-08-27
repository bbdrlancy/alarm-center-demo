"use client"

import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { rcaHref } from "@/data/scenarios"
import { ContinueTo } from "@/components/page-flow"

export function ScenarioContinueToRca({ label = "根因分析中心" }: { label?: string }) {
  const { scenario } = useDemoScenario()
  return <ContinueTo label={label} href={rcaHref(scenario.incident.id)} />
}
