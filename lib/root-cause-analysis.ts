import type { ScenarioModel } from "@/data/scenarios"
import { getCommandIncident } from "@/lib/incident-command"
import { getIncidentOverview } from "@/lib/incident-overview"
import { getInvestigationWorkbench, type RootCauseCandidate } from "@/lib/manual-investigation-data"

export type RcaFocusCard = {
  id: string
  zh: string
  en: string
  value: string
  detail: string
}

export type RootCauseWorkspaceModel = {
  confidence: number
  rootName: string
  rootNameZh: string
  whyThis: { zh: string; en: string }
  whyNotOthers: { name: string; nameZh: string; zh: string; en: string }[]
  focus: RcaFocusCard[]
  candidates: RootCauseCandidate[]
  ranking: { name: string; nameZh: string; confidence: number; likelyRoot: boolean }[]
  factors: { label: string; detail: string }[]
}

export function getRootCauseWorkspace(scenario: ScenarioModel): RootCauseWorkspaceModel {
  const incident = getCommandIncident(scenario.id)
  const overview = getIncidentOverview(scenario)
  const workbench = getInvestigationWorkbench(scenario)
  const ranked = [...workbench.candidates].sort((a, b) => b.confidence - a.confidence)
  const top = ranked[0]!
  const evidence = Object.fromEntries(incident.evidence.map((item) => [item.en, item]))
  const earliest = evidence["Earliest Event"]
  const topology = evidence["Topology Match"]
  const disturbance = evidence["Disturbance Direction"]
  const history = evidence["Historical Similarity"]

  return {
    confidence: overview.confidence,
    rootName: overview.rootCause,
    rootNameZh: overview.rootCauseZh,
    whyThis: { zh: top.whyZh, en: top.why },
    whyNotOthers: ranked
      .filter((item) => !item.likelyRoot)
      .map((item) => ({
        name: item.name,
        nameZh: item.nameZh,
        zh: item.whyZh,
        en: item.why,
      })),
    focus: [
      {
        id: "earliest",
        zh: "最早事件",
        en: "Earliest Event",
        value: earliest?.value ?? overview.firstDetectedTime,
        detail: overview.evidenceHighlights.find((item) => item.id === "earliest")?.detail ?? top.name,
      },
      {
        id: "topology",
        zh: "拓扑证据",
        en: "Topology Evidence",
        value: topology?.value ?? "—",
        detail: top.topologyRelationships[0] ?? "Upstream topology match",
      },
      {
        id: "disturbance",
        zh: "扰动证据",
        en: "Disturbance Evidence",
        value: disturbance?.value ?? "Confirmed",
        detail: top.metrics[0] ? `${top.metrics[0].zh} ${top.metrics[0].value}` : "Disturbance direction confirmed",
      },
      {
        id: "history",
        zh: "历史相似",
        en: "Historical Similarity",
        value: history?.value ?? `${top.historicalSimilarity}%`,
        detail: top.historicalCases[0] ?? "Pattern library match",
      },
      {
        id: "confidence",
        zh: "置信度",
        en: "Confidence",
        value: `${overview.confidence}%`,
        detail: "Causal + temporal + topology",
      },
    ],
    candidates: ranked,
    ranking: ranked.map((item) => ({
      name: item.name,
      nameZh: item.nameZh,
      confidence: item.confidence,
      likelyRoot: item.likelyRoot,
    })),
    factors: scenario.graph.graphrag.factors,
  }
}
