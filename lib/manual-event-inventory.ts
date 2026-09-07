import { scenarioOrder, scenarios, type ScenarioKey, type ScenarioModel } from "@/data/scenarios"
import {
  applyConvergenceRule,
  applyConvergenceRuleToAlarms,
  buildConvergenceFlow,
  CONVERGENCE_RULES,
  getScenarioRawAlarms,
  getStageEventRows,
  RULE_SPECS,
  type ConvergenceItem,
  type ConvergenceRule,
  type EventRow,
  type TaggedAlarm,
} from "@/lib/alarm-convergence"

export type InventoryRuleKey = "raw" | ConvergenceRule["key"]

export type InventoryEventRow = EventRow & {
  scenarioKey: ScenarioKey
  incidentId: string
  domain: string
  incidentTitle: string
}

export type InventoryRulePreview = {
  ruleKey: InventoryRuleKey
  rule: ConvergenceRule | null
  spec: { conditions: string[]; window?: string } | null
  rows: InventoryEventRow[]
  rawCount: number
  outputCount: number
  reduced: number
  ratio: number
  byIncident: { scenarioKey: ScenarioKey; incidentId: string; domain: string; input: number; output: number }[]
}

export const INVENTORY_RULE_OPTIONS: { key: InventoryRuleKey; zh: string; en: string }[] = [
  { key: "raw", zh: "原始清单", en: "Full Inventory" },
  ...CONVERGENCE_RULES.map((rule) => ({ key: rule.key, zh: rule.zh, en: rule.en })),
]

const STAGE_FOR_RULE: Record<string, string> = {
  noise: "noise",
  cluster: "cluster",
  topology: "topology",
  causal: "causal",
}

export function getInventoryRawCount(): number {
  return scenarioOrder.reduce((sum, key) => sum + getScenarioRawAlarms(scenarios[key]).length, 0)
}

export function scenarioFromEventRow(row: Pick<EventRow, "scenarioKey" | "id" | "alarmId">): ScenarioKey {
  if (row.scenarioKey) return row.scenarioKey
  const token = `${row.id} ${row.alarmId ?? ""}`
  if (token.includes("A-C-") || token.startsWith("cooling:")) return "cooling"
  if (token.includes("A-S-") || token.startsWith("storage:")) return "storage"
  if (token.includes("A-N-") || token.startsWith("network:")) return "network"
  return "power"
}

function tagRows(scenario: ScenarioModel, rows: EventRow[]): InventoryEventRow[] {
  return rows.map((row) => ({
    ...row,
    id: `${scenario.id}:${row.id}`,
    scenarioKey: scenario.id,
    incidentId: scenario.incident.id,
    domain: scenario.domain,
    incidentTitle: scenario.incident.titleZh,
    members: row.members,
  }))
}

function itemToRow(scenario: ScenarioModel, rule: ConvergenceRule, item: ConvergenceItem, alarms: TaggedAlarm[]): EventRow {
  const members = alarms.filter((alarm) => item.members?.includes(alarm.id))
  const merged = item.merged ?? members.length
  return {
    id: item.id,
    kind: merged > 1 ? "group" : "alarm",
    timestamp: item.time,
    severity: item.severity,
    device: item.device,
    code: item.title,
    displayCode: merged > 1 ? `${item.title} (${merged})` : item.title,
    ruleApplied: rule.en,
    aggregationGroup: item.title,
    category: item.hint ?? rule.en,
    status: item.status ?? "Aggregated",
    summary: item.detail,
    expandable: members.length > 1,
    members,
    mergedBy: rule.en,
    reasons: [rule.how],
    window: RULE_SPECS[rule.key]?.window,
    alarmId: members[0]?.id ?? item.id,
  }
}

function rowsForScenario(scenario: ScenarioModel, ruleKey: InventoryRuleKey): EventRow[] {
  const flow = buildConvergenceFlow(scenario)
  if (ruleKey === "raw") return getStageEventRows(flow, "raw")

  const stageKey = STAGE_FOR_RULE[ruleKey]
  if (stageKey) return getStageEventRows(flow, stageKey)

  const rule = CONVERGENCE_RULES.find((item) => item.key === ruleKey)
  if (!rule) return getStageEventRows(flow, "raw")
  const alarms = getScenarioRawAlarms(scenario)
  return applyConvergenceRule(scenario, ruleKey).map((item) => itemToRow(scenario, rule, item, alarms))
}

export function getInventoryRulePreview(ruleKey: InventoryRuleKey): InventoryRulePreview {
  const rule = ruleKey === "raw" ? null : (CONVERGENCE_RULES.find((item) => item.key === ruleKey) ?? null)
  const spec = ruleKey === "raw" ? null : (RULE_SPECS[ruleKey] ?? null)

  const byIncident = scenarioOrder.map((key) => {
    const scenario = scenarios[key]
    const input = getScenarioRawAlarms(scenario).length
    const output = rowsForScenario(scenario, ruleKey).length
    return {
      scenarioKey: key,
      incidentId: scenario.incident.id,
      domain: scenario.domain,
      input,
      output,
    }
  })

  const rows = scenarioOrder.flatMap((key) => tagRows(scenarios[key], rowsForScenario(scenarios[key], ruleKey)))
  const rawCount = byIncident.reduce((sum, item) => sum + item.input, 0)
  const outputCount = rows.length
  const reduced = Math.max(0, rawCount - outputCount)
  const ratio = rawCount === 0 ? 0 : Math.round((reduced / rawCount) * 100)

  return { ruleKey, rule, spec, rows, rawCount, outputCount, reduced, ratio, byIncident }
}

export function resolveInventoryAlarm(row: InventoryEventRow): TaggedAlarm | undefined {
  if (row.members?.[0]) return row.members[0]
  const alarms = getScenarioRawAlarms(scenarios[row.scenarioKey])
  const rawId = row.alarmId ?? row.id.replace(`${row.scenarioKey}:`, "")
  return alarms.find((alarm) => alarm.id === rawId || alarm.device === row.device)
}

export function parseEventClock(timestamp: string): number {
  const match = timestamp.match(/^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?/)
  if (!match) return Number.NaN
  const ms = match[4] ? Number(match[4].padEnd(3, "0").slice(0, 3)) : 0
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] ?? 0) + ms / 1000
}

export function eventInTimeRange(timestamp: string, from?: string, to?: string): boolean {
  if (!from && !to) return true
  const clock = parseEventClock(timestamp)
  if (Number.isNaN(clock)) return true
  if (from && clock < parseEventClock(from)) return false
  if (to && clock > parseEventClock(to)) return false
  return true
}

export type InventoryTimeWindow = {
  id: string
  zh: string
  en: string
  from: string
  to: string
}

export function getInventoryTimeWindows(rows: EventRow[]): InventoryTimeWindow[] {
  const byIncident = new Map<string, EventRow[]>()
  for (const row of rows) {
    const key = row.incidentId
    if (!key) continue
    const list = byIncident.get(key) ?? []
    list.push(row)
    byIncident.set(key, list)
  }
  return [...byIncident.entries()]
    .sort((a, b) => (a[1][0]?.timestamp ?? "").localeCompare(b[1][0]?.timestamp ?? ""))
    .map(([incidentId, list]) => {
      const stamps = [...list].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      const from = stamps[0]!.timestamp
      const to = stamps[stamps.length - 1]!.timestamp
      const domain = list[0]?.domain ?? ""
      const domainZh: Record<string, string> = { Power: "电力", Cooling: "制冷", Storage: "存储", Network: "网络" }
      return {
        id: incidentId,
        zh: `${domainZh[domain] ?? domain} ${from.slice(0, 5)}–${to.slice(0, 5)}`,
        en: `${incidentId} ${from.slice(0, 5)}–${to.slice(0, 5)}`,
        from,
        to,
      }
    })
}

export function getInventoryMinutes(rows: EventRow[]): string[] {
  return [...new Set(rows.map((row) => row.timestamp.slice(0, 5)))].sort()
}

export type InventoryConvergencePreview = {
  ruleKey: ConvergenceRule["key"]
  rule: ConvergenceRule
  spec: { conditions: string[]; window?: string } | null
  inputCount: number
  outputCount: number
  reduced: number
  ratio: number
  rows: InventoryEventRow[]
}

export function convergeInventorySelection(
  rows: InventoryEventRow[],
  ruleKey: ConvergenceRule["key"],
): InventoryConvergencePreview {
  const rule = CONVERGENCE_RULES.find((item) => item.key === ruleKey) ?? CONVERGENCE_RULES[0]!
  const spec = RULE_SPECS[rule.key] ?? null
  const byScenario = new Map<ScenarioKey, InventoryEventRow[]>()
  for (const row of rows) {
    const list = byScenario.get(row.scenarioKey) ?? []
    list.push(row)
    byScenario.set(row.scenarioKey, list)
  }

  const output = [...byScenario.entries()].flatMap(([key, group]) => {
    const scenario = scenarios[key]
    const alarms = group
      .map((row) => resolveInventoryAlarm(row))
      .filter((alarm): alarm is TaggedAlarm => Boolean(alarm))
    const items = applyConvergenceRuleToAlarms(alarms, rule.key, scenario).map((item) => ({
      ...item,
      id: `${key}-${item.id}`,
    }))
    return tagRows(scenario, items.map((item) => itemToRow(scenario, rule, item, alarms)))
  })

  const inputCount = rows.length
  const outputCount = output.length
  const reduced = Math.max(0, inputCount - outputCount)
  return {
    ruleKey: rule.key,
    rule,
    spec,
    inputCount,
    outputCount,
    reduced,
    ratio: inputCount === 0 ? 0 : Math.round((reduced / inputCount) * 100),
    rows: output,
  }
}
