/** Portfolio helpers — derived from scenario registry */
export {
  portfolioMeta,
  portfolioMeta as portfolioSummary,
  portfolioExecutiveIntro,
  topImpactedServices,
  domainHeatmap,
  incidentDistribution,
  getPortfolioIncidents,
  getRecommendedActions,
  rcaHref,
  storeActiveIncident,
  readStoredIncident,
  ACTIVE_INCIDENT_KEY,
  platformValue,
  type PortfolioTableRow,
} from "@/data/scenarios"

export type { ScenarioModel as IncidentScenario } from "@/data/scenarios"

export type RiskLevel = "Critical" | "High" | "Medium" | "Low"
