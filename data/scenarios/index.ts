import { coolingScenario } from "./cooling"
import { networkScenario } from "./network"
import { powerScenario } from "./power"
import { storageScenario } from "./storage"
import type { ScenarioKey, ScenarioModel, ScenarioMode } from "./types"

export * from "./types"

export const scenarios: Record<ScenarioKey, ScenarioModel> = {
  power: powerScenario,
  cooling: coolingScenario,
  storage: storageScenario,
  network: networkScenario,
}

export const scenarioOrder: ScenarioKey[] = ["power", "cooling", "storage", "network"]

export const SCENARIO_STORAGE_KEY = "aiops-demo-scenario"
export const SCENARIO_AUTO_KEY = "aiops-demo-scenario-auto"

export const platformValue = {
  annualRoi: 8.6,
  scenarioCount: 4,
  domainsCovered: 4,
  mttrBefore: "4 Hours",
  mttrAfter: "2 Minutes",
  efficiencyGain: 120,
  automationRate: 85,
  monthlyAlarms: 48321,
  autoCorrelated: 47982,
  autoHandled: 38610,
  hoursSavedPerMonth: 1240,
  tagline:
    "Platform-wide AIOps delivers ¥8.6M annual ROI across Power, Cooling, Storage and Network domains.",
} as const

export const portfolioMeta = {
  openIncidents: 12,
  p1Critical: 2,
  p2Major: 5,
  p3Minor: 5,
  affectedAssets: 248,
  protectedServices: 18,
  estimatedBusinessRisk: 12.3,
} as const

export const portfolioExecutiveIntro =
  "12 incidents are currently active across Power, Cooling, Storage and Network domains."

export const topImpactedServices = [
  "AI Training Service",
  "Manufacturing Analytics",
  "Predictive Maintenance",
  "Energy Optimization Platform",
]

export const domainHeatmap = [
  { domain: "Power" as const, incidentCount: 4, criticalCount: 1, riskLevel: "Critical" as const },
  { domain: "Cooling" as const, incidentCount: 3, criticalCount: 1, riskLevel: "Critical" as const },
  { domain: "Storage" as const, incidentCount: 3, criticalCount: 0, riskLevel: "High" as const },
  { domain: "Network" as const, incidentCount: 2, criticalCount: 0, riskLevel: "Medium" as const },
]

export const incidentDistribution = [
  { domain: "Power" as const, count: 4, color: "#e53935" },
  { domain: "Cooling" as const, count: 3, color: "#fb8c00" },
  { domain: "Storage" as const, count: 3, color: "#7b1fa2" },
  { domain: "Network" as const, count: 2, color: "#1e88e5" },
]

export type PortfolioTableRow = {
  id: string
  severity: ScenarioModel["incident"]["severity"]
  rootCause: string
  domain: ScenarioModel["domain"]
  status: string
  confidence: number
  affectedAssets: string
  businessImpact: string
  startTime: string
  scenarioKey: ScenarioKey
}

export type RecommendedActionRow = {
  priority: ScenarioModel["incident"]["severity"]
  incidentId: string
  action: string
  ownerTeam: string
  eta: string
  riskReduction: number
  status: ScenarioModel["portfolio"]["recommendedAction"]["status"]
  confidence: number
  scenarioKey: ScenarioKey
}

const priorityRank: Record<string, number> = { P1: 0, P2: 1, P3: 2 }

export function getRecommendedActions(): RecommendedActionRow[] {
  return scenarioOrder
    .map((key) => {
      const s = scenarios[key]
      const ra = s.portfolio.recommendedAction
      return {
        priority: s.incident.severity,
        incidentId: s.incident.id,
        action: ra.action,
        ownerTeam: ra.ownerTeam,
        eta: ra.eta,
        riskReduction: ra.riskReduction,
        status: ra.status,
        confidence: ra.confidence,
        scenarioKey: key,
      }
    })
    .sort((a, b) => (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9))
}

export function getPortfolioIncidents(): PortfolioTableRow[] {
  return scenarioOrder.map((key) => {
    const s = scenarios[key]
    return {
      id: s.incident.id,
      severity: s.incident.severity,
      rootCause: s.incident.title,
      domain: s.domain,
      status: s.incident.status,
      confidence: s.incident.confidence,
      affectedAssets: s.incident.affectedAssets,
      businessImpact: s.incident.businessImpact,
      startTime: s.incident.startTime,
      scenarioKey: key,
    }
  })
}

export function getScenarioByKey(key: ScenarioKey): ScenarioModel {
  return scenarios[key]
}

export function getScenarioByIncidentId(id: string): ScenarioModel | undefined {
  return scenarioOrder.map((k) => scenarios[k]).find((s) => s.incident.id === id)
}

export function incidentIdToScenarioKey(id: string): ScenarioKey {
  return getScenarioByIncidentId(id)?.id ?? "power"
}

export function rcaHref(incidentId: string) {
  return `/rca?incident=${encodeURIComponent(incidentId)}`
}

export type ScenarioSelectOption = { value: ScenarioMode; label: string }

export const scenarioSelectOptions: ScenarioSelectOption[] = [
  { value: "power", label: "Power Failure" },
  { value: "cooling", label: "Cooling Failure" },
  { value: "storage", label: "Storage Failure" },
  { value: "network", label: "Network Failure" },
  { value: "auto", label: "Auto Demo" },
]

export const ACTIVE_INCIDENT_KEY = "aiops-active-incident"

export function storeActiveIncident(id: string) {
  if (typeof window !== "undefined") sessionStorage.setItem(ACTIVE_INCIDENT_KEY, id)
}

export function readStoredIncident(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(ACTIVE_INCIDENT_KEY)
}

export function getDeviceFilterOptions(scenario: ScenarioModel): string[] {
  return ["All Devices", ...scenario.impactChain.map((n) => n.label)]
}

export function getServiceFilterOptions(scenario: ScenarioModel): string[] {
  return ["All Services", scenario.incident.businessImpact, "AI Training", "Dataset Service", "AI Gateway"]
}
