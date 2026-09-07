import type { ScenarioKey, ScenarioModel } from "@/data/scenarios/types"
import type { Priority } from "@/lib/incident-data"

export type CheckResult = "confirmed" | "pending" | "next"

export type DetectedAnomaly = {
  time: string
  zh: string
  en: string
}

export type RootCauseCandidate = {
  id: string
  chainId: string
  name: string
  nameZh: string
  confidence: number
  alarmCount: number
  historicalSimilarity: number
  evidenceCount: number
  likelyRoot: boolean
  health: "Critical" | "Degraded" | "Impacted" | "Watch"
  voltage: string
  batteryStatus: string
  why: string
  whyZh: string
  metrics: { zh: string; en: string; value: string }[]
  relatedIncidents: string[]
  historicalCases: string[]
  topologyRelationships: string[]
  kgRelationships: string[]
}

export type ImpactKpis = {
  infrastructure: string
  compute: string
  business: string
  alarm: string
}

export type VerificationStep = {
  id: string
  stepZh: string
  stepEn: string
  status: CheckResult
  finding: string
  nextAction: string
}

export type InvestigationWorkbench = {
  eventType: string
  eventTypeZh: string
  severity: Priority
  detectedTime: string
  duration: string
  eventVolume: string
  status: string
  anomalies: DetectedAnomaly[]
  impact: ImpactKpis
  propagation: { id: string; label: string }[]
  sourceLabel: string
  sourceDetail: string
  candidates: RootCauseCandidate[]
  steps: VerificationStep[]
}

function durationLabel(scenario: ScenarioModel): string {
  const events = scenario.timeline.events
  if (events.length < 2) return scenario.incident.analysisTime
  const toSec = (time: string) => {
    const [h = "0", m = "0", s = "0"] = time.split(":")
    return Number(h) * 3600 + Number(m) * 60 + Number(s)
  }
  const span = toSec(events[events.length - 1]!.time) - toSec(events[0]!.time)
  return `${Math.max(1, Math.round(span / 60))} Minutes`
}

const ANOMALIES: Record<ScenarioKey, DetectedAnomaly[]> = {
  power: [
    { time: "03:00:12", zh: "电池内阻上升", en: "Battery Resistance Increase" },
    { time: "03:00:13", zh: "UPS 旁路失败", en: "UPS Bypass Failure" },
    { time: "03:00:48", zh: "输出电压跌落", en: "Voltage Drop" },
    { time: "03:01:30", zh: "PDU 输入失电", en: "PDU Input Loss" },
  ],
  cooling: [
    { time: "05:42:08", zh: "压缩机停机", en: "Compressor Stop" },
    { time: "05:42:20", zh: "冷量输出归零", en: "Cooling Output Zero" },
    { time: "05:43:10", zh: "冷通道温升", en: "Aisle Temperature Rise" },
    { time: "05:44:02", zh: "GPU 热降频", en: "GPU Thermal Throttle" },
  ],
  storage: [
    { time: "08:15:04", zh: "控制器心跳丢失", en: "Controller Heartbeat Loss" },
    { time: "08:15:18", zh: "故障切换未完成", en: "Failover Incomplete" },
    { time: "08:16:02", zh: "SAN 重试风暴", en: "SAN Retry Storm" },
    { time: "08:16:40", zh: "Checkpoint 失败", en: "Checkpoint Failure" },
  ],
  network: [
    { time: "11:08:11", zh: "核心交换机不可达", en: "Core Switch Unreachable" },
    { time: "11:08:19", zh: "BGP 震荡", en: "BGP Flapping" },
    { time: "11:08:36", zh: "聚合上行中断", en: "Aggregation Uplink Down" },
    { time: "11:09:02", zh: "网关 503", en: "Gateway 503" },
  ],
}

const IMPACT: Record<ScenarioKey, ImpactKpis> = {
  power: {
    infrastructure: "PDU-A01 ~ A04 · Power Zone A",
    compute: "12 Racks · 84 GPU Servers",
    business: "AI Training Service Interrupted",
    alarm: "33 Cascaded Alarms",
  },
  cooling: {
    infrastructure: "Cold Aisle A · 24°C → 38°C",
    compute: "16 Racks · 256 GPUs Throttled",
    business: "Training Cluster B Paused",
    alarm: "28 Cascaded Alarms",
  },
  storage: {
    infrastructure: "SAN Fabric Zone 2 Retry Storm",
    compute: "Training Job-8842 Hung",
    business: "Dataset Service Degraded",
    alarm: "21 Cascaded Alarms",
  },
  network: {
    infrastructure: "SW-AGG-04 / ToR Isolated",
    compute: "32 Servers · 128 GPUs Cut Off",
    business: "AI Gateway 503 then Recovered",
    alarm: "19 Cascaded Alarms",
  },
}

const CANDIDATES: Record<ScenarioKey, RootCauseCandidate[]> = {
  power: [
    {
      id: "ups-battery",
      chainId: "ups",
      name: "UPS-A01 Battery Failure",
      nameZh: "UPS-A01 电池组故障",
      confidence: 98,
      alarmCount: 33,
      historicalSimilarity: 94,
      evidenceCount: 8,
      likelyRoot: true,
      health: "Critical",
      voltage: "210 V",
      batteryStatus: "Failed · IR +34%",
      whyZh: "最早 Critical Event 落在 UPS-A01；旁路失败与电压跌落同一窗口；PDU / Rack / GPU 均为级联，不是独立源。",
      why: "Earliest critical Event is on UPS-A01. Bypass failure and voltage drop share the same window. Downstream PDU, rack and GPU Events are cascade, not independent sources.",
      metrics: [
        { zh: "电池内阻", en: "Internal Resistance", value: "+34%" },
        { zh: "输出电压", en: "Output Voltage", value: "210 V" },
        { zh: "旁路切换", en: "Bypass Transfer", value: "Failed" },
      ],
      relatedIncidents: ["INC-20260820", "INC-20260512"],
      historicalCases: ["Battery IR surge pattern (94% match)", "Prior power incident 0512"],
      topologyRelationships: ["supplies_power_to → PDU-A01~A04", "upstream_of → Rack A01~A12", "located_in → Power Zone A"],
      kgRelationships: ["instance_of → PowerAsset", "generates → INC-20260820", "impacts → AI Training Service"],
    },
    {
      id: "pdu-loss",
      chainId: "pdu",
      name: "PDU Input Loss",
      nameZh: "配电单元输入失电",
      confidence: 61,
      alarmCount: 12,
      historicalSimilarity: 71,
      evidenceCount: 4,
      likelyRoot: false,
      health: "Impacted",
      voltage: "0 V",
      batteryStatus: "N/A",
      whyZh: "PDU 失电比 UPS 输出跌落晚 78 秒，时间顺序说明它是下游传播，不是源头。",
      why: "PDU input loss occurs 78 seconds after the UPS voltage drop, so it is downstream impact rather than the source.",
      metrics: [
        { zh: "A 路输入", en: "A-path Input", value: "Lost" },
        { zh: "负载", en: "Load", value: "0%" },
      ],
      relatedIncidents: ["INC-20260820"],
      historicalCases: ["Distribution loss after UPS drop"],
      topologyRelationships: ["depends_on → UPS-A01", "feeds → Rack A01~A12"],
      kgRelationships: ["downstream_of → UPS-A01", "located_in → Power Zone A"],
    },
    {
      id: "rack-thermal",
      chainId: "rack",
      name: "Rack Inlet Temperature Rise",
      nameZh: "机架进风温度上升",
      confidence: 28,
      alarmCount: 6,
      historicalSimilarity: 42,
      evidenceCount: 2,
      likelyRoot: false,
      health: "Watch",
      voltage: "Lost",
      batteryStatus: "N/A",
      whyZh: "进风温升出现在机架断电之后，是风扇停转的伴随现象，不是制冷根因。",
      why: "Inlet temperature rise appears after rack power loss. It is a companion symptom from stopped fans, not a cooling root cause.",
      metrics: [
        { zh: "进风温度", en: "Inlet Temp", value: "31°C" },
        { zh: "风扇", en: "Fan Status", value: "Stopped" },
      ],
      relatedIncidents: ["INC-20260820"],
      historicalCases: ["Companion heat after rack blackout"],
      topologyRelationships: ["powered_by → PDU", "hosts → GPU Servers"],
      kgRelationships: ["companion_of → Rack Power Loss"],
    },
    {
      id: "gpu-offline",
      chainId: "gpu",
      name: "GPU Server Unreachable",
      nameZh: "GPU 服务器不可达",
      confidence: 22,
      alarmCount: 14,
      historicalSimilarity: 35,
      evidenceCount: 3,
      likelyRoot: false,
      health: "Impacted",
      voltage: "Lost",
      batteryStatus: "N/A",
      whyZh: "84 台主机在机架失电后同时不可达，属于计算层影响，不能解释更早的 UPS 告警。",
      why: "84 hosts become unreachable only after rack power loss. This is compute impact and cannot explain the earlier UPS Events.",
      metrics: [
        { zh: "离线主机", en: "Offline Hosts", value: "84" },
        { zh: "可达性", en: "Reachability", value: "Timeout" },
      ],
      relatedIncidents: ["INC-20260820"],
      historicalCases: ["GPU blackout after rack PDU loss"],
      topologyRelationships: ["hosted_in → Rack A01~A12", "serves → AI Training Service"],
      kgRelationships: ["downstream_of → Rack Power"],
    },
  ],
  cooling: [
    {
      id: "crac-compressor",
      chainId: "crac",
      name: "CRAC-A02 Compressor Failure",
      nameZh: "CRAC-A02 压缩机故障",
      confidence: 95,
      alarmCount: 28,
      historicalSimilarity: 91,
      evidenceCount: 7,
      likelyRoot: true,
      health: "Critical",
      voltage: "0 kW cooling",
      batteryStatus: "Compressor stopped",
      whyZh: "压缩机电流归零是最早 Event，随后冷通道升温、GPU 降频，传播顺序完整。",
      why: "Compressor current drops to zero first. Aisle heat and GPU throttle follow in order, completing the thermal cascade.",
      metrics: [
        { zh: "冷量输出", en: "Cooling Output", value: "0 kW" },
        { zh: "压缩机电流", en: "Compressor Current", value: "0 A" },
      ],
      relatedIncidents: ["INC-20260821", "INC-20260318"],
      historicalCases: ["Compressor trip pattern (91% match)"],
      topologyRelationships: ["cools → Cold Aisle A", "serves → Rack Cluster B"],
      kgRelationships: ["instance_of → CoolingAsset", "impacts → Training Cluster B"],
    },
    {
      id: "aisle-heat",
      chainId: "zone",
      name: "Cold Aisle Overheat",
      nameZh: "冷通道过热",
      confidence: 58,
      alarmCount: 16,
      historicalSimilarity: 68,
      evidenceCount: 4,
      likelyRoot: false,
      health: "Degraded",
      voltage: "N/A",
      batteryStatus: "N/A",
      whyZh: "冷通道温升发生在压缩机停机之后，是热传播结果。",
      why: "Aisle overheat starts after the compressor stop, so it is thermal propagation rather than the source.",
      metrics: [{ zh: "进风温度", en: "Inlet Temp", value: "38°C" }],
      relatedIncidents: ["INC-20260821"],
      historicalCases: ["Aisle heat after CRAC loss"],
      topologyRelationships: ["downstream_of → CRAC-A02"],
      kgRelationships: ["contains → Rack Cluster B"],
    },
    {
      id: "gpu-throttle",
      chainId: "gpu",
      name: "GPU Thermal Throttle",
      nameZh: "GPU 热降频",
      confidence: 31,
      alarmCount: 11,
      historicalSimilarity: 44,
      evidenceCount: 3,
      likelyRoot: false,
      health: "Impacted",
      voltage: "N/A",
      batteryStatus: "N/A",
      whyZh: "降频发生在机架进风超温之后，属于计算保护动作。",
      why: "Throttle begins after rack inlet over-temp. It is a compute protection action, not the originating fault.",
      metrics: [{ zh: "芯片温度", en: "Die Temp", value: "92°C" }],
      relatedIncidents: ["INC-20260821"],
      historicalCases: ["GPU throttle after aisle heat"],
      topologyRelationships: ["hosted_in → Rack Cluster B"],
      kgRelationships: ["serves → Training Cluster B"],
    },
  ],
  storage: [
    {
      id: "ctrl-cluster",
      chainId: "ctrl",
      name: "Storage Controller Cluster Failure",
      nameZh: "存储控制器集群故障",
      confidence: 92,
      alarmCount: 21,
      historicalSimilarity: 89,
      evidenceCount: 6,
      likelyRoot: true,
      health: "Critical",
      voltage: "N/A",
      batteryStatus: "Heartbeat lost",
      whyZh: "双控心跳丢失最早出现，且 failover 未完成，足以解释 SAN 重试与作业中断。",
      why: "Dual-controller heartbeat is the earliest Event, and failover did not complete. That explains the SAN retry storm and job hang.",
      metrics: [
        { zh: "心跳", en: "Heartbeat", value: "Lost" },
        { zh: "故障切换", en: "Failover", value: "Incomplete" },
      ],
      relatedIncidents: ["INC-20260822", "INC-20260409"],
      historicalCases: ["Split-brain controller pattern (89% match)"],
      topologyRelationships: ["serves → SAN Fabric Zone 2"],
      kgRelationships: ["instance_of → StorageAsset", "impacts → Dataset Service"],
    },
    {
      id: "san-retry",
      chainId: "san",
      name: "SAN Retry Storm",
      nameZh: "SAN 重试风暴",
      confidence: 54,
      alarmCount: 18,
      historicalSimilarity: 63,
      evidenceCount: 4,
      likelyRoot: false,
      health: "Degraded",
      voltage: "N/A",
      batteryStatus: "N/A",
      whyZh: "重试风暴出现在控制器心跳丢失之后，是通路层症状。",
      why: "The retry storm starts after controller heartbeat loss, so it is a path-layer symptom.",
      metrics: [{ zh: "重试率", en: "Retry Rate", value: "38%" }],
      relatedIncidents: ["INC-20260822"],
      historicalCases: ["SAN storm after controller split"],
      topologyRelationships: ["depends_on → Storage Controller"],
      kgRelationships: ["carries → Dataset Volume"],
    },
    {
      id: "ckpt-fail",
      chainId: "job",
      name: "Training Checkpoint Failure",
      nameZh: "训练 checkpoint 失败",
      confidence: 26,
      alarmCount: 5,
      historicalSimilarity: 33,
      evidenceCount: 2,
      likelyRoot: false,
      health: "Impacted",
      voltage: "N/A",
      batteryStatus: "N/A",
      whyZh: "Checkpoint 失败发生在数据卷降级之后，是业务结果。",
      why: "Checkpoint failure occurs after volume degradation, so it is a business result rather than the source.",
      metrics: [{ zh: "作业", en: "Job", value: "Job-8842" }],
      relatedIncidents: ["INC-20260822"],
      historicalCases: ["Checkpoint fail on degraded volume"],
      topologyRelationships: ["depends_on → Dataset Volume"],
      kgRelationships: ["owned_by → Dataset Service"],
    },
  ],
  network: [
    {
      id: "core-sw",
      chainId: "core",
      name: "Core Switch Failure",
      nameZh: "核心交换机故障",
      confidence: 94,
      alarmCount: 19,
      historicalSimilarity: 90,
      evidenceCount: 7,
      likelyRoot: true,
      health: "Critical",
      voltage: "N/A",
      batteryStatus: "Control plane down",
      whyZh: "SW-CORE-02 控制平面中断最早，随后 BGP 震荡、接入隔离与网关 503，定位在核心层。",
      why: "SW-CORE-02 control-plane loss is earliest. BGP flap, edge isolation and gateway 503 follow, locating the fault at the core.",
      metrics: [
        { zh: "控制平面", en: "Control Plane", value: "Unreachable" },
        { zh: "BGP", en: "BGP", value: "Flapping" },
      ],
      relatedIncidents: ["INC-20260823", "INC-20260221"],
      historicalCases: ["Core control-plane loss (90% match)"],
      topologyRelationships: ["upstream_of → SW-AGG-04"],
      kgRelationships: ["instance_of → NetworkAsset", "impacts → AI Gateway"],
    },
    {
      id: "agg-isolate",
      chainId: "agg",
      name: "Aggregation Path Isolation",
      nameZh: "聚合路径隔离",
      confidence: 49,
      alarmCount: 9,
      historicalSimilarity: 57,
      evidenceCount: 3,
      likelyRoot: false,
      health: "Impacted",
      voltage: "N/A",
      batteryStatus: "N/A",
      whyZh: "聚合上行走在核心交换机之后，是传播路径而不是源头。",
      why: "Aggregation uplink loss follows the core switch Event, so it is the propagation path rather than the source.",
      metrics: [{ zh: "上行", en: "Uplink", value: "Down" }],
      relatedIncidents: ["INC-20260823"],
      historicalCases: ["Agg isolation after core loss"],
      topologyRelationships: ["depends_on → SW-CORE-02"],
      kgRelationships: ["aggregates → Top-of-Rack"],
    },
    {
      id: "gw-503",
      chainId: "gateway",
      name: "AI Gateway 503",
      nameZh: "AI 网关不可用",
      confidence: 24,
      alarmCount: 4,
      historicalSimilarity: 29,
      evidenceCount: 2,
      likelyRoot: false,
      health: "Watch",
      voltage: "N/A",
      batteryStatus: "N/A",
      whyZh: "网关 503 是业务层结果，冗余路径接管后已恢复。",
      why: "Gateway 503 is a business-layer result and recovered after the redundant path took over.",
      metrics: [{ zh: "HTTP", en: "HTTP", value: "503" }],
      relatedIncidents: ["INC-20260823"],
      historicalCases: ["Gateway 503 during core isolation"],
      topologyRelationships: ["downstream_of → GPU Cluster"],
      kgRelationships: ["exposes → AI Gateway"],
    },
  ],
}

const STEPS: Record<ScenarioKey, VerificationStep[]> = {
  power: [
    { id: "s1", stepZh: "确认 UPS-A01 为最早 Event", stepEn: "Confirm UPS-A01 is the earliest Event", status: "confirmed", finding: "03:00:12 电池内阻告警早于全部下游", nextAction: "隔离 UPS-A01" },
    { id: "s2", stepZh: "核对旁路切换失败", stepEn: "Verify bypass transfer failure", status: "confirmed", finding: "旁路失败与电压跌落同一窗口", nextAction: "切至市电旁路" },
    { id: "s3", stepZh: "排除 PDU 作为源头", stepEn: "Rule out PDU as the source", status: "confirmed", finding: "PDU 失电晚 78 秒，属于级联", nextAction: "继续在 UPS 侧取证" },
    { id: "s4", stepZh: "核对历史电池故障模式", stepEn: "Match historical battery pattern", status: "pending", finding: "历史相似度 94%，待复核案例 0512", nextAction: "打开历史案例对照" },
    { id: "s5", stepZh: "确认业务中断为级联结果", stepEn: "Confirm service outage is cascade", status: "next", finding: "训练中断落在 GPU 离线之后", nextAction: "UPS 恢复后再做机架健康检查" },
  ],
  cooling: [
    { id: "s1", stepZh: "确认压缩机停机为最早 Event", stepEn: "Confirm compressor stop is earliest", status: "confirmed", finding: "压缩机电流归零早于冷通道温升", nextAction: "隔离 CRAC-A02" },
    { id: "s2", stepZh: "核对冷通道热传播", stepEn: "Verify aisle heat propagation", status: "confirmed", finding: "24°C → 38°C 与停机对齐", nextAction: "切换备用 CRAC" },
    { id: "s3", stepZh: "排除 GPU 过热为源头", stepEn: "Rule out GPU heat as source", status: "pending", finding: "降频发生在进风超温之后", nextAction: "核对机架进风曲线" },
    { id: "s4", stepZh: "确认备用冷量可接管", stepEn: "Confirm backup cooling is ready", status: "next", finding: "备用机组状态待验证", nextAction: "检查备用 CRAC 风阀" },
  ],
  storage: [
    { id: "s1", stepZh: "确认双控心跳丢失为最早 Event", stepEn: "Confirm heartbeat loss is earliest", status: "confirmed", finding: "Ctrl-A/B 心跳中断早于 SAN 重试", nextAction: "隔离故障控制器" },
    { id: "s2", stepZh: "核对 failover 未完成", stepEn: "Verify incomplete failover", status: "confirmed", finding: "控制器角色分裂，路径未切", nextAction: "触发强制切换" },
    { id: "s3", stepZh: "排除 checkpoint 为源头", stepEn: "Rule out checkpoint as source", status: "pending", finding: "作业失败发生在数据卷降级之后", nextAction: "核对卷状态" },
    { id: "s4", stepZh: "验证备用控制器接管", stepEn: "Validate standby controller", status: "next", finding: "待观察 SAN 重试是否回落", nextAction: "执行控制器 failover" },
  ],
  network: [
    { id: "s1", stepZh: "确认核心交换机为最早 Event", stepEn: "Confirm core switch is earliest", status: "confirmed", finding: "SW-CORE-02 控制平面中断最早", nextAction: "隔离核心交换机" },
    { id: "s2", stepZh: "核对冗余路径接管", stepEn: "Verify redundant path takeover", status: "confirmed", finding: "备用链路收敛后 503 消失", nextAction: "锁定冗余路径" },
    { id: "s3", stepZh: "排除 ToR 为源头", stepEn: "Rule out ToR as source", status: "pending", finding: "接入告警为上行丢失伴随", nextAction: "对照 ToR 时序" },
    { id: "s4", stepZh: "复核 BGP 邻居稳定", stepEn: "Recheck BGP neighbor stability", status: "next", finding: "待观察 15 分钟无 flap", nextAction: "持续监控 BGP" },
  ],
}

export function getInvestigationWorkbench(scenario: ScenarioModel): InvestigationWorkbench {
  const first = scenario.timeline.events[0]
  const root = scenario.impactChain.find((node) => node.status === "root") ?? scenario.impactChain[0]
  return {
    eventType: scenario.incident.title,
    eventTypeZh: scenario.incident.titleZh,
    severity: scenario.incident.severity,
    detectedTime: first ? `2026-08-20 ${first.time}` : `2026-08-20 ${scenario.incident.startTime}`,
    duration: durationLabel(scenario),
    eventVolume: String(scenario.incident.rawAlarms),
    status: scenario.incident.status,
    anomalies: ANOMALIES[scenario.id],
    impact: IMPACT[scenario.id],
    propagation: scenario.impactChain.map((node) => ({ id: node.id, label: node.label })),
    sourceLabel: root?.sub ?? scenario.incident.rootCause,
    sourceDetail: scenario.incident.rootCauseZh,
    candidates: CANDIDATES[scenario.id],
    steps: STEPS[scenario.id],
  }
}
