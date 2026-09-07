import { buildConvergenceFlow } from "@/lib/alarm-convergence"
import type { ScenarioKey, ScenarioModel } from "@/data/scenarios/types"

export type PropagationStep = {
  id: string
  title: string
  caption: string
  role: "root" | "impact" | "business"
}

export type OverviewEvidence = {
  title: string
  value: string
  detail: string
}

export type StoryBeat = {
  time: string
  title: string
  priority: "P1" | "P2" | "P3"
}

export type OverviewAction = {
  action: string
  actionZh: string
  ownerTeam: string
  eta: string
  riskReduction: number
  status: "Suggested" | "In Progress" | "Completed"
  confidence: number
  rationaleZh: string
  steps: { zh: string; team: string }[]
}

const PROPAGATION: Record<ScenarioKey, PropagationStep[]> = {
  power: [
    { id: "ups", title: "UPS-A01", caption: "ROOT CAUSE", role: "root" },
    { id: "pdu", title: "PDU-A01 ~ PDU-A04", caption: "4 Devices", role: "impact" },
    { id: "rack", title: "Rack-A01 ~ A12", caption: "12 Racks", role: "impact" },
    { id: "gpu", title: "GPU Servers", caption: "84 Servers", role: "impact" },
    { id: "service", title: "AI Training Service", caption: "Business Impact", role: "business" },
  ],
  cooling: [
    { id: "crac", title: "CRAC-A02", caption: "ROOT CAUSE", role: "root" },
    { id: "zone", title: "Cold Aisle A", caption: "Thermal Zone", role: "impact" },
    { id: "rack", title: "Rack Cluster B", caption: "16 Racks", role: "impact" },
    { id: "gpu", title: "GPU Servers", caption: "256 GPUs", role: "impact" },
    { id: "service", title: "Training Cluster B", caption: "Business Impact", role: "business" },
  ],
  storage: [
    { id: "ctrl", title: "Storage Ctrl-A/B", caption: "ROOT CAUSE", role: "root" },
    { id: "san", title: "SAN Fabric Zone 2", caption: "Storage Fabric", role: "impact" },
    { id: "volume", title: "Dataset Volume", caption: "120 TB", role: "impact" },
    { id: "job", title: "Training Job-8842", caption: "Compute Job", role: "impact" },
    { id: "platform", title: "Dataset Service", caption: "Business Impact", role: "business" },
  ],
  network: [
    { id: "core", title: "SW-CORE-02", caption: "ROOT CAUSE", role: "root" },
    { id: "agg", title: "SW-AGG-04", caption: "Aggregation", role: "impact" },
    { id: "edge", title: "Top-of-Rack", caption: "Edge Network", role: "impact" },
    { id: "gpu", title: "GPU Cluster", caption: "32 Servers", role: "impact" },
    { id: "gateway", title: "AI Gateway", caption: "Business Impact", role: "business" },
  ],
}

const SUMMARY_ZH: Record<ScenarioKey, string> = {
  power:
    "UPS-A01 电池内阻在短时间内上升 34%，旁路切换失败，Power Zone A 失电。故障沿 UPS → PDU → 机架 → GPU 级联，约 4 分钟内导致 84 台 GPU 服务器离线，AI 训练服务中断。",
  cooling:
    "CRAC-A02 压缩机停机后冷量输出归零，冷通道 A 进风温度由 24°C 升至 38°C。热故障沿制冷区传到 16 台机架，256 张 GPU 触发降频保护，训练集群 B 作业暂停。",
  storage:
    "存储双控心跳丢失且 failover 未完成，SAN Fabric Zone 2 出现重试风暴。120 TB 数据卷进入降级模式，训练作业 checkpoint 中断，数据集服务读写 SLA 违约。",
  network:
    "核心交换机 SW-CORE-02 控制平面不可达，引发 BGP 震荡和东西向流量中断。32 台 GPU 服务器短暂隔离，AI 网关出现 503；冗余路径接管后服务逐步恢复。",
}

const ACTION_COPY: Record<ScenarioKey, Pick<OverviewAction, "actionZh" | "rationaleZh" | "steps">> = {
  power: {
    actionZh: "更换 UPS 电池模组，并验证旁路切换",
    rationaleZh: "先切断供电源头，再恢复电池与旁路能力，避免二次失电。",
    steps: [
      { zh: "隔离 UPS-A01 并切换至旁路市电", team: "Power Team" },
      { zh: "更换 UPS-A01 电池模组", team: "Facility Team" },
      { zh: "验证机架供电恢复与健康检查", team: "IT Operations" },
    ],
  },
  cooling: {
    actionZh: "将制冷区 A 切换至备用 CRAC",
    rationaleZh: "先恢复冷量，再排查压缩机，避免 GPU 继续超温降频。",
    steps: [
      { zh: "将制冷区 A 切换至备用 CRAC", team: "Facility Team" },
      { zh: "检查压缩机电流与冷量输出", team: "Cooling Team" },
      { zh: "确认 GPU 进风温度回落到阈值内", team: "IT Operations" },
    ],
  },
  storage: {
    actionZh: "触发存储控制器故障切换",
    rationaleZh: "先恢复控制器通路，再压住 SAN 重试，避免数据卷继续降级。",
    steps: [
      { zh: "触发存储控制器故障切换", team: "Storage Team" },
      { zh: "隔离 SAN Fabric Zone 2 重试风暴", team: "Storage Team" },
      { zh: "恢复训练作业 checkpoint", team: "AI Platform Team" },
    ],
  },
  network: {
    actionZh: "将流量切换至备用网络路径",
    rationaleZh: "先用冗余路径恢复业务，再验证核心交换机与 BGP 收敛。",
    steps: [
      { zh: "将流量切换至备用网络路径", team: "Network Team" },
      { zh: "验证 BGP 收敛与冗余链路", team: "Network Team" },
      { zh: "确认 AI Gateway 可用性恢复", team: "AI Platform Team" },
    ],
  },
}

const STORY: Record<ScenarioKey, string[]> = {
  power: [
    "UPS Battery Failure",
    "Voltage Drop",
    "PDU Power Loss",
    "Rack Shutdown",
    "GPU Offline",
    "AI Training Service Interrupted",
  ],
  cooling: [
    "CRAC Compressor Failure",
    "Inlet Temperature Rise",
    "Rack Thermal Alert",
    "GPU Throttle",
    "Training Cluster B Interrupted",
  ],
  storage: [
    "Controller Failover Failed",
    "SAN Retry Storm",
    "Volume Degraded",
    "Training Job Failed",
    "Dataset Service Interrupted",
  ],
  network: [
    "Core Switch Down",
    "BGP Flap",
    "East-West Traffic Loss",
    "Gateway Timeout",
    "AI Gateway Restored",
  ],
}

function toSeconds(time: string): number {
  const [hours, minutes, seconds] = time.split(":").map((part) => Number(part) || 0)
  return hours * 3600 + minutes * 60 + seconds
}

function durationLabel(scenario: ScenarioModel): string {
  const events = scenario.timeline.events
  if (events.length < 2) return scenario.incident.analysisTime
  const span = toSeconds(events[events.length - 1]!.time) - toSeconds(events[0]!.time)
  const minutes = Math.max(1, Math.round(span / 60))
  return `${minutes} Minutes`
}

export function getIncidentOverview(scenario: ScenarioModel) {
  const flow = buildConvergenceFlow(scenario)
  const earliest = [...flow.evidence.direct].sort((a, b) => a.timestamp.localeCompare(b.timestamp))[0]
  const cascaded = flow.evidence.cascadedCount
  const storyTitles = STORY[scenario.id]

  return {
    severity: scenario.incident.severity,
    rootCause: scenario.incident.rootCause,
    rootCauseZh: scenario.incident.rootCauseZh,
    summaryZh: SUMMARY_ZH[scenario.id],
    confidence: scenario.incident.confidence,
    businessImpact: `${scenario.incident.businessImpact} Interrupted`,
    businessImpactZh: `${scenario.incident.businessImpact} 中断`,
    affectedAssets: scenario.incident.affectedAssets,
    affectedAlarms: `${cascaded} Cascaded Alarms`,
    cascadedCount: cascaded,
    duration: durationLabel(scenario),
    incidentId: scenario.incident.id,
    domain: scenario.domain,
    status: scenario.incident.status,
    conclusionZh: scenario.timeline.conclusion,
    recommendedAction: {
      ...scenario.portfolio.recommendedAction,
      ...ACTION_COPY[scenario.id],
    } satisfies OverviewAction,
    propagation: PROPAGATION[scenario.id],
    evidence: [
      {
        title: "Earliest Critical Alarm",
        value: earliest?.code ?? scenario.incident.rootCause,
        detail: earliest?.timestamp.slice(0, 8) ?? scenario.incident.startTime,
      },
      {
        title: "Temporal Correlation",
        value: "Matches event timeline",
        detail: `${scenario.timeline.events[0]?.time ?? "—"} → ${scenario.timeline.events[scenario.timeline.events.length - 1]?.time ?? "—"}`,
      },
      {
        title: "Topology Correlation",
        value: `Explains ${cascaded} dependent alarms`,
        detail: "Downstream cascade on the same path",
      },
      {
        title: "Confidence",
        value: `${scenario.incident.confidence}%`,
        detail: "Causal + temporal + topology",
      },
    ] satisfies OverviewEvidence[],
    story: scenario.timeline.events.map((event, index) => ({
      time: event.time,
      title: storyTitles[index] ?? event.title,
      priority: event.priority,
    })),
  }
}
