import { getIncidentOverview } from "@/lib/incident-overview"
import {
  scenarioOrder,
  scenarios,
  type ScenarioKey,
  type ScenarioModel,
} from "@/data/scenarios"
import type { Priority } from "@/lib/incident-data"

export type LifecycleStatus = "Investigating" | "Analyzed" | "Mitigating" | "Recovering" | "Resolved"
export type ActionRunStatus = "Pending" | "Running" | "Completed"
export type ImpactLevel = "High" | "Medium" | "Low"

export type RecoveryStageId =
  | "detected"
  | "analyzed"
  | "rootCause"
  | "mitigating"
  | "recovering"
  | "closed"

export type StageMark = "done" | "current" | "todo"

export type PortfolioFilter = "all" | "critical" | "open" | "recovered"

export const RECOVERY_STAGES: { id: RecoveryStageId; zh: string; en: string; short: string }[] = [
  { id: "detected", zh: "已发现", en: "Detected", short: "Detected" },
  { id: "analyzed", zh: "已分析", en: "Analyzed", short: "Analyzed" },
  { id: "rootCause", zh: "根因已定位", en: "Root Cause Found", short: "Root Cause" },
  { id: "mitigating", zh: "处置中", en: "Mitigating", short: "Mitigating" },
  { id: "recovering", zh: "恢复中", en: "Recovering", short: "Recovering" },
  { id: "closed", zh: "已关闭", en: "Closed", short: "Closed" },
]

const STAGE_INDEX: Record<RecoveryStageId, number> = {
  detected: 0,
  analyzed: 1,
  rootCause: 2,
  mitigating: 3,
  recovering: 4,
  closed: 5,
}

type CommandProfile = {
  shortTitle: string
  commandStatus: string
  commandStatusZh: string
  duration: string
  durationMins: number
  recoveryPercent: number
  recoveryEta: string
  currentStage: RecoveryStageId
  impactScore: number
  impact: {
    services: number
    domains: number
    devices: number
    customers: number
    slaRisk: "High" | "Medium" | "Low"
    gpuNodes: number
  }
  whatHappened: string[]
  evidence: { zh: string; en: string; value: string }[]
  impactBreakdown: {
    business: { title: string; detail: string }
    service: { title: string; detail: string }
    asset: { title: string; detail: string }
  }
  propagationPath: string[]
  actionCompletion: number
  shortAction: string
  nextActionLine2?: string
}

const PROFILES: Record<ScenarioKey, CommandProfile> = {
  power: {
    shortTitle: "UPS Failure",
    commandStatus: "Mitigating",
    commandStatusZh: "处置中",
    duration: "34 Minutes",
    durationMins: 34,
    recoveryPercent: 62,
    recoveryEta: "15 mins",
    currentStage: "recovering",
    impactScore: 95,
    impact: { services: 3, domains: 2, devices: 126, customers: 1, slaRisk: "High", gpuNodes: 18 },
    whatHappened: [
      "UPS-A01 电池故障导致供电链路异常。",
      "影响 Rack Group A。",
      "18 台 GPU 节点中断。",
      "AI Training Service 不可用。",
      "系统已自动切换至旁路供电。",
    ],
    evidence: [
      { zh: "最早事件", en: "Earliest Event", value: "03:00:12" },
      { zh: "拓扑匹配", en: "Topology Match", value: "95%" },
      { zh: "扰动方向", en: "Disturbance Direction", value: "Confirmed" },
      { zh: "历史相似", en: "Historical Similarity", value: "94%" },
    ],
    impactBreakdown: {
      business: { title: "训练业务停摆", detail: "AI 训练作业无法推进，客户侧 SLA 窗口承压。" },
      service: { title: "AI Training Service", detail: "服务不可用，已切旁路供电，等待电池更换后恢复。" },
      asset: { title: "Rack Group A", detail: "供电链路异常，GPU 节点离线，旁路已接管。" },
    },
    propagationPath: ["UPS-A01", "Rack Group A", "GPU Nodes", "AI Training Service"],
    actionCompletion: 62,
    shortAction: "Replace UPS Battery",
  },
  cooling: {
    shortTitle: "CRAC Failure",
    commandStatus: "Analyzed",
    commandStatusZh: "已分析",
    duration: "12 Minutes",
    durationMins: 12,
    recoveryPercent: 28,
    recoveryEta: "15 mins",
    currentStage: "mitigating",
    impactScore: 88,
    impact: { services: 2, domains: 2, devices: 72, customers: 1, slaRisk: "High", gpuNodes: 16 },
    whatHappened: [
      "CRAC-A02 压缩机停机，冷通道 A 失冷。",
      "影响 Rack Cluster B。",
      "进风温度升至 38°C，GPU 触发降频。",
      "Training Cluster B 作业已暂停。",
      "待切换至备用 CRAC 恢复冷量。",
    ],
    evidence: [
      { zh: "最早事件", en: "Earliest Event", value: "05:42:08" },
      { zh: "拓扑匹配", en: "Topology Match", value: "93%" },
      { zh: "扰动方向", en: "Disturbance Direction", value: "Confirmed" },
      { zh: "历史相似", en: "Historical Similarity", value: "91%" },
    ],
    impactBreakdown: {
      business: { title: "Training Cluster B 暂停", detail: "训练作业因热保护停算，业务窗口持续消耗。" },
      service: { title: "训练平台降级", detail: "Cluster B 作业已挂起，等待冷量恢复后重启。" },
      asset: { title: "Rack Cluster B 过热", detail: "进风升高触发 GPU 降频，机架热冲击尚未消除。" },
    },
    propagationPath: ["CRAC-A02", "Rack Cluster-B", "GPU Nodes", "Training Platform"],
    actionCompletion: 0,
    shortAction: "Switch Backup CRAC",
    nextActionLine2: "To Backup CRAC",
  },
  storage: {
    shortTitle: "Storage Failure",
    commandStatus: "Analyzed",
    commandStatusZh: "已分析",
    duration: "22 Minutes",
    durationMins: 22,
    recoveryPercent: 18,
    recoveryEta: "20 mins",
    currentStage: "rootCause",
    impactScore: 72,
    impact: { services: 2, domains: 2, devices: 56, customers: 1, slaRisk: "Medium", gpuNodes: 0 },
    whatHappened: [
      "存储双控心跳丢失，failover 未完成。",
      "SAN Fabric Zone 2 出现重试风暴。",
      "120 TB 数据卷进入降级模式。",
      "Dataset Service 读写 SLA 承压。",
      "待触发控制器故障切换。",
    ],
    evidence: [
      { zh: "最早事件", en: "Earliest Event", value: "08:15:22" },
      { zh: "拓扑匹配", en: "Topology Match", value: "90%" },
      { zh: "扰动方向", en: "Disturbance Direction", value: "Confirmed" },
      { zh: "历史相似", en: "Historical Similarity", value: "88%" },
    ],
    impactBreakdown: {
      business: { title: "数据集服务承压", detail: "训练数据读写变慢，作业排队拉长。" },
      service: { title: "Dataset Service 降级", detail: "双控 failover 未完成，卷处于降级模式。" },
      asset: { title: "存储集群心跳丢失", detail: "SAN Zone 2 重试风暴，数据路径不稳定。" },
    },
    propagationPath: ["Storage Ctrl-A/B", "SAN Fabric Zone 2", "Dataset Volume", "Dataset Service"],
    actionCompletion: 0,
    shortAction: "Trigger Failover",
  },
  network: {
    shortTitle: "Core Switch Failure",
    commandStatus: "Resolved",
    commandStatusZh: "已恢复",
    duration: "4 Minutes",
    durationMins: 4,
    recoveryPercent: 100,
    recoveryEta: "0 mins",
    currentStage: "closed",
    impactScore: 41,
    impact: { services: 1, domains: 1, devices: 32, customers: 1, slaRisk: "Low", gpuNodes: 8 },
    whatHappened: [
      "核心交换机 SW-CORE-02 控制平面不可达。",
      "东西向流量短暂中断。",
      "AI Gateway 出现 503。",
      "冗余路径已接管。",
      "服务已恢复，事故关闭。",
    ],
    evidence: [
      { zh: "最早事件", en: "Earliest Event", value: "11:08:15" },
      { zh: "拓扑匹配", en: "Topology Match", value: "96%" },
      { zh: "扰动方向", en: "Disturbance Direction", value: "Confirmed" },
      { zh: "历史相似", en: "Historical Similarity", value: "Confirmed" },
    ],
    impactBreakdown: {
      business: { title: "网关访问已恢复", detail: "短暂 503 后冗余路径接管，业务已回到正常窗口。" },
      service: { title: "AI Gateway 恢复", detail: "东西向流量已切至备用路径，服务关闭事故。" },
      asset: { title: "核心交换机不可达已消除", detail: "控制平面故障已被冗余链路覆盖。" },
    },
    propagationPath: ["SW-CORE-02", "Aggregation", "GPU Cluster", "AI Gateway"],
    actionCompletion: 100,
    shortAction: "Reroute Traffic",
  },
}

export type CommandIncident = {
  scenarioKey: ScenarioKey
  scenario: ScenarioModel
  incidentId: string
  title: string
  titleZh: string
  shortTitle: string
  startTime: string
  startTimeLabel: string
  updateTimeLabel: string
  severity: Priority
  severityLabel: string
  domain: string
  rootCause: string
  rootCauseZh: string
  confidence: number
  rawStatus: string
  commandStatus: string
  commandStatusZh: string
  duration: string
  durationMins: number
  commander: string
  recoveryPercent: number
  recoveryEta: string
  currentStage: RecoveryStageId
  stages: { id: RecoveryStageId; zh: string; en: string; short: string; mark: StageMark }[]
  impact: CommandProfile["impact"]
  impactScore: number
  impactBreakdown: CommandProfile["impactBreakdown"]
  propagationPath: string[]
  whatHappened: string[]
  evidence: CommandProfile["evidence"]
  nextAction: {
      action: string
      short: string
      actionZh: string
      line2?: string
      ownerTeam: string
      eta: string
      etaShort: string
      riskReduction: number
      status: "Suggested" | "In Progress" | "Completed"
      runStatus: ActionRunStatus
      completion: number
    }
    recovered: boolean
    open: boolean
    critical: boolean
  }

function stageMarks(current: RecoveryStageId): CommandIncident["stages"] {
  const currentIdx = STAGE_INDEX[current]
  return RECOVERY_STAGES.map((stage, index) => ({
    ...stage,
    mark: index < currentIdx ? "done" : index === currentIdx ? "current" : "todo",
  }))
}

function minutesLabel(value: string | number) {
  if (typeof value === "number") return `${value}m`
  const mins = String(value).match(/\d+/)?.[0]
  return mins ? `${mins}m` : value
}

export function actionRunStatus(
  status: "Suggested" | "In Progress" | "Completed",
): ActionRunStatus {
  if (status === "Completed") return "Completed"
  if (status === "In Progress") return "Running"
  return "Pending"
}

function splitAction(action: string, line2?: string) {
  if (line2) {
    const cut = action.replace(/\s+to backup CRAC unit\.?/i, "").replace(/\.$/, "")
    return { line1: cut, line2 }
  }
  return { line1: action.replace(/\.$/, ""), line2: undefined }
}

function withIncidentDate(id: string, time: string) {
  const match = id.match(/INC-(\d{4})(\d{2})(\d{2})/)
  const date = match ? `${match[1]}-${match[2]}-${match[3]}` : ""
  return date ? `${date} ${time}` : time
}

export function getCommandIncident(key: ScenarioKey): CommandIncident {
  const scenario = scenarios[key]
  const overview = getIncidentOverview(scenario)
  const profile = PROFILES[key]
  const action = overview.recommendedAction
  const split = splitAction(action.action, profile.nextActionLine2)
  const recovered = scenario.incident.status === "Resolved"
  const firstEvent = scenario.timeline.events[0]
  const lastEvent = scenario.timeline.events[scenario.timeline.events.length - 1]
  const startClock = firstEvent?.time ?? `${scenario.incident.startTime}:00`
  const updateClock = lastEvent?.time ?? startClock
  return {
    scenarioKey: key,
    scenario,
    incidentId: scenario.incident.id,
    title: scenario.incident.title,
    titleZh: scenario.incident.titleZh,
    shortTitle: profile.shortTitle,
    startTime: scenario.incident.startTime,
    startTimeLabel: withIncidentDate(scenario.incident.id, startClock),
    updateTimeLabel: withIncidentDate(scenario.incident.id, updateClock),
    severity: scenario.incident.severity,
    severityLabel: scenario.incident.severity === "P1" ? "P1 Critical" : scenario.incident.severity === "P2" ? "P2 Major" : "P3 Minor",
    domain: scenario.domain,
    rootCause: scenario.incident.rootCause,
    rootCauseZh: scenario.incident.rootCauseZh,
    confidence: scenario.incident.confidence,
    rawStatus: scenario.incident.status,
    commandStatus: profile.commandStatus,
    commandStatusZh: profile.commandStatusZh,
    duration: profile.duration,
    durationMins: profile.durationMins,
    commander: action.ownerTeam,
    recoveryPercent: profile.recoveryPercent,
    recoveryEta: profile.recoveryEta,
    currentStage: profile.currentStage,
    stages: stageMarks(profile.currentStage),
    impact: profile.impact,
    impactScore: profile.impactScore,
    impactBreakdown: profile.impactBreakdown,
    propagationPath: profile.propagationPath,
    whatHappened: profile.whatHappened,
    evidence: profile.evidence,
    nextAction: {
      action: split.line1,
      short: profile.shortAction,
      actionZh: action.actionZh,
      line2: split.line2,
      ownerTeam: action.ownerTeam,
      eta: action.eta,
      etaShort: minutesLabel(action.eta),
      riskReduction: action.riskReduction,
      status: action.status,
      runStatus: actionRunStatus(action.status),
      completion: profile.actionCompletion,
    },
    recovered,
    open: !recovered,
    critical: scenario.incident.severity === "P1",
  }
}

export function getCommandPortfolio(): CommandIncident[] {
  const severityRank: Record<string, number> = { P1: 0, P2: 1, P3: 2 }
  const impactRank: Record<ImpactLevel, number> = { High: 0, Medium: 1, Low: 2 }
  return scenarioOrder
    .map((key) => getCommandIncident(key))
    .sort((a, b) => {
      const bySev = (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9)
      if (bySev !== 0) return bySev
      const byImpact = impactRank[a.impact.slaRisk] - impactRank[b.impact.slaRisk]
      if (byImpact !== 0) return byImpact
      return a.recoveryPercent - b.recoveryPercent
    })
}

export type PortfolioSummary = {
  openIncidents: number
  p1Critical: number
  p2Major: number
  affectedServices: number
  affectedAssets: number
  teamsWorking: number
  averageRecovery: number
}

export function getPortfolioSummary(items: CommandIncident[] = getCommandPortfolio()): PortfolioSummary {
  const p1 = items.filter((item) => item.severity === "P1")
  return {
    openIncidents: items.length,
    p1Critical: p1.length,
    p2Major: items.filter((item) => item.severity === "P2").length,
    affectedServices: p1.reduce((sum, item) => sum + item.impact.services, 0),
    affectedAssets: p1.reduce((sum, item) => sum + item.impact.devices, 0),
    teamsWorking: new Set(items.map((item) => item.commander)).size,
    averageRecovery: Math.round(items.reduce((sum, item) => sum + item.recoveryPercent, 0) / Math.max(items.length, 1)),
  }
}

export function filterCommandPortfolio(items: CommandIncident[], filter: PortfolioFilter) {
  if (filter === "critical") return items.filter((item) => item.critical)
  if (filter === "open") return items.filter((item) => item.open)
  if (filter === "recovered") return items.filter((item) => item.recovered)
  return items
}

export function defaultCommandKey(items: CommandIncident[]): ScenarioKey {
  return items.find((item) => item.open && item.critical)?.scenarioKey ?? items[0]?.scenarioKey ?? "power"
}

export const LIFECYCLE_TONE: Record<string, string> = {
  Investigating: "border-sky-400/40 bg-sky-500/12 text-sky-700",
  Analyzed: "border-violet-400/40 bg-violet-500/12 text-violet-700",
  Mitigating: "border-indigo-400/40 bg-indigo-500/12 text-indigo-700",
  Recovering: "border-cyan-400/40 bg-cyan-500/12 text-cyan-700",
  Resolved: "border-primary/35 bg-primary/12 text-primary",
}

export const ACTION_RUN_TONE: Record<ActionRunStatus, string> = {
  Pending: "text-muted-foreground",
  Running: "text-indigo-700",
  Completed: "text-primary",
}

export const TEAM_TAG: Record<string, string> = {
  "Power Team": "border-amber-400/45 bg-amber-400/15 text-amber-800",
  "Facility Team": "border-cyan-400/45 bg-cyan-400/15 text-cyan-800",
  "Storage Team": "border-violet-400/45 bg-violet-400/15 text-violet-800",
  "Network Team": "border-sky-400/45 bg-sky-400/15 text-sky-800",
}

export const SLA_TONE: Record<ImpactLevel, string> = {
  High: "text-[var(--p1)]",
  Medium: "text-[var(--p2)]",
  Low: "text-primary",
}

export type ActionStatusCount = {
  Suggested: number
  "In Progress": number
  Completed: number
}

export function countActionStatus(
  rows: { status: "Suggested" | "In Progress" | "Completed" }[],
): ActionStatusCount {
  return rows.reduce<ActionStatusCount>(
    (acc, row) => {
      acc[row.status] += 1
      return acc
    },
    { Suggested: 0, "In Progress": 0, Completed: 0 },
  )
}
