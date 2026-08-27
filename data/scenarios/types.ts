import type { Priority } from "@/lib/incident-data"

export type ScenarioKey = "power" | "cooling" | "storage" | "network"
export type ScenarioMode = ScenarioKey | "auto"
export type DomainType = "Power" | "Cooling" | "Storage" | "Network"
export type NodeStatus = "root" | "impacted" | "normal"

export interface ScenarioIncident {
  id: string
  severity: Priority
  status: string
  title: string
  titleZh: string
  rootCause: string
  rootCauseZh: string
  confidence: number
  analysisTime: string
  alarmReduction: string
  rawAlarms: number
  rootCauseCount: number
  reductionRate: number
  analysisMinutes: number
  affectedAssets: string
  businessImpact: string
  affectedServer: number
  affectedGpu: number
  affectedRack: number
  startTime: string
  executiveLine: string
  investigationFocus: string
  rcaSummary: string
}

export interface ImpactChainNode {
  id: string
  label: string
  sub: string
  type: string
  status: NodeStatus
}

export interface ScenarioTimelineEvent {
  time: string
  title: string
  zh: string
  priority: Priority
  detail: string
}

export interface GraphNode {
  id: string
  label: string
  category: string
}

export interface GraphEdge {
  source: string
  target: string
  relation: string
}

export interface GraphRagFactor {
  label: string
  detail: string
}

export interface ScenarioModel {
  id: ScenarioKey
  name: string
  domain: DomainType
  color: string
  themeName: string

  incident: ScenarioIncident

  impactChain: ImpactChainNode[]

  timeline: {
    events: ScenarioTimelineEvent[]
    conclusion: string
  }

  graph: {
    mapping: string[]
    nodes: GraphNode[]
    edges: GraphEdge[]
    graphrag: {
      title: string
      confidence: number
      factors: GraphRagFactor[]
    }
    conclusion: string
  }

  digitalTwin: {
    focus: string
    rootCauseLabel: string
    conclusion: string
  }

  copilot: {
    snapshot: string
    suggestions: string[]
  }

  businessValue: {
    annualRoi: number
    automationRate: number
    efficiencyGain: number
    businessRisk: number
    reductionRate: number
    mttrBefore: string
    mttrAfter: string
    tagline: string
  }

  portfolio: {
    summaryLines: string[]
    recommendedAction: {
      action: string
      ownerTeam: string
      eta: string
      riskReduction: number
      status: "Suggested" | "In Progress" | "Completed"
      confidence: number
    }
  }
}
