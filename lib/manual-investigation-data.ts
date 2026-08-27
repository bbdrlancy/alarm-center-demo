import type { ScenarioModel, ImpactChainNode } from "@/data/scenarios"

export type InvestigationNodeEvidence = {
  nodeId: string
  deviceName: string
  alarmCount: number
  relatedIncidents: number
  historicalSimilarity: number
  dependentSystems: number
  relationships: string[]
  timelineEvents: { time: string; label: string }[]
  kgRelationships: string[]
  historicalCases: string[]
  isRootCandidate: boolean
}

export type InvestigationNote = {
  id: string
  text: string
  createdAt: string
}

export type RcaCandidate = {
  id: string
  label: string
  confidence: number
}

const relationshipTemplates: Record<string, string[]> = {
  root: ["supplies_power_to", "upstream_of", "monitored_by"],
  impacted: ["depends_on", "downstream_of", "receives_from"],
  normal: ["peer_of", "monitored_by"],
}

export function buildInvestigationEvidence(scenario: ScenarioModel): InvestigationNodeEvidence[] {
  const alarmCounts = [312, 148, 96, 72, 41]
  const incidents = [4, 2, 1, 1, 0]
  const similarity = [94, 88, 76, 71, 65]
  const dependents = [5, 4, 3, 2, 1]
  const { incident, timeline, graph } = scenario

  return scenario.impactChain.map((node: ImpactChainNode, i) => ({
    nodeId: node.id,
    deviceName: node.sub,
    alarmCount: alarmCounts[i] ?? 24,
    relatedIncidents: incidents[i] ?? 1,
    historicalSimilarity: similarity[i] ?? 70,
    dependentSystems: dependents[i] ?? 1,
    relationships: relationshipTemplates[node.status] ?? relationshipTemplates.impacted,
    timelineEvents: timeline.events
      .filter((_, idx) => idx >= i && idx <= i + 1)
      .map((ev) => ({ time: ev.time, label: ev.title })),
    kgRelationships: [
      `instance_of → ${scenario.domain}Asset`,
      `located_in → ${graph.mapping[1] ?? scenario.domain}`,
      `impacts → ${incident.businessImpact}`,
    ],
    historicalCases: [
      `${node.label} failure pattern (${similarity[i] ?? 70}% match)`,
      `Prior ${scenario.domain.toLowerCase()} incident ${incident.id.slice(-4)}`,
    ],
    isRootCandidate: node.status === "root" || i === 0,
  }))
}

export const defaultOperatorNote = `Observed abnormal signals before outage.
Review impact chain and timeline for root cause candidates.`

export const timeRangeOptions = [
  "Last 5 Minutes",
  "Last 30 Minutes",
  "Last 24 Hours",
  "Custom Range",
] as const

export const severityFilters = ["Critical", "Major", "Minor", "Warning"] as const

export const incidentSeverityFilters = ["P1", "P2", "P3"] as const
