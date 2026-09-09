import type { ScenarioModel } from "@/data/scenarios"

export const JOURNEY_STEPS = [
  { id: "summary", label: "Summary", zh: "摘要", question: "发生了什么？" },
  { id: "root-cause", label: "Root Cause", zh: "根因", question: "为什么发生？" },
  { id: "propagation", label: "Propagation", zh: "传播", question: "如何传播？" },
  { id: "impact", label: "Impact", zh: "影响", question: "影响了什么？" },
  { id: "mitigation", label: "Mitigation", zh: "处置", question: "如何恢复？" },
  { id: "evidence", label: "Evidence", zh: "证据", question: "为何相信？" },
] as const

export type JourneyStepId = (typeof JOURNEY_STEPS)[number]["id"]

export const DEFAULT_OPEN_STEPS: JourneyStepId[] = ["summary", "root-cause"]

export type PropagationHop = {
  time: string
  clock: string
  title: string
  zh: string
  detail: string
  asset: string
  service: string
  evidence: string
  role: "root" | "cascade" | "business"
}

export function getPropagationHops(scenario: ScenarioModel): PropagationHop[] {
  const events = scenario.timeline.events
  const chain = scenario.impactChain
  const service = scenario.incident.businessImpact

  return events.map((event, index) => {
    const node = chain[mapChainIndex(index, events.length, chain.length)]
    const last = index === events.length - 1
    const first = index === 0
    return {
      time: event.time,
      clock: event.time.slice(0, 5),
      title: event.title,
      zh: event.zh,
      detail: event.detail,
      asset: node?.sub ?? node?.label ?? scenario.incident.affectedAssets,
      service: last || node?.type === "Service" ? service : `${service} · 级联中`,
      evidence: event.detail,
      role: first ? "root" : last ? "business" : "cascade",
    }
  })
}

function mapChainIndex(eventIndex: number, eventCount: number, chainCount: number) {
  if (chainCount <= 1 || eventCount <= 1) return 0
  return Math.round((eventIndex / (eventCount - 1)) * (chainCount - 1))
}
