// 数据中心配电系统故障场景 — 真实运维模拟数据
// 场景: UPS-A01 电池故障 → 级联至 AI Training Service

export type Priority = "P1" | "P2" | "P3"

export const convergenceStages = [
  { key: "raw", label: "原始告警", en: "Raw Alarms", value: 1248, hint: "多系统上报" },
  { key: "correlated", label: "关联事件", en: "Correlated", value: 92, hint: "拓扑/时间/空间收敛" },
  { key: "clusters", label: "告警聚类", en: "Clusters", value: 17, hint: "ML 模式聚类" },
  { key: "groups", label: "事件组", en: "Incident Groups", value: 3, hint: "业务视角归并" },
  { key: "rootcause", label: "根因", en: "Root Cause", value: 1, hint: "唯一源头" },
] as const

export const reductionRate = 99.92

/** Canonical demo metrics — keep all pages aligned */
export const demoMetrics = {
  rootCause: "UPS-A01 Battery Failure",
  confidence: 98,
  reductionRate: 99.92,
  rawAlarms: 1248,
  rootCauseCount: 1,
  analysisMinutes: 2,
  affectedRack: 12,
  affectedRackTotal: 48,
  affectedServer: 84,
  affectedServerTotal: 336,
  affectedGpu: 336,
  affectedGpuTotal: 1344,
  affectedService: 2,
  affectedServiceTotal: 9,
  incidentTime: "03:00",
  incidentMarkerLabel: "UPS Failure",
} as const

export const rootCause = {
  id: "INC-20260820-0417",
  title: demoMetrics.rootCause,
  titleZh: "UPS-A01 电池组故障",
  confidence: demoMetrics.confidence,
  zone: "Power Zone A",
  service: "AI Training Service",
  priority: "P1" as Priority,
  device: "UPS-A01",
  method: "拓扑收敛 + 时间收敛 + 模式收敛",
  detectedAt: "2026-08-20 03:00:12",
  summary:
    "UPS-A01 电池内阻在 5 分钟内上升 34%，触发旁路切换失败，导致 Power Zone A 输出中断，级联影响下游 PDU、机架与 GPU 训练集群。",
}

export const impactKpis = [
  { key: "rack", label: "受影响机架", en: "Affected Racks", value: demoMetrics.affectedRack, total: demoMetrics.affectedRackTotal, unit: "台", trend: [4, 6, 7, 9, 10, 11, 12], immediate: true },
  { key: "server", label: "受影响服务器", en: "Affected Servers", value: demoMetrics.affectedServer, total: demoMetrics.affectedServerTotal, unit: "台", trend: [12, 28, 45, 60, 72, 80, 84], immediate: true },
  { key: "gpu", label: "受影响 GPU", en: "Affected GPUs", value: demoMetrics.affectedGpu, total: demoMetrics.affectedGpuTotal, unit: "卡", trend: [48, 112, 180, 240, 288, 320, 336], immediate: true },
  { key: "service", label: "受影响业务", en: "Affected Services", value: demoMetrics.affectedService, total: demoMetrics.affectedServiceTotal, unit: "个", trend: [0, 0, 1, 1, 1, 2, 2], immediate: true },
] as const

export const powerTrend = [
  { t: "02:55", load: 100, voltage: 400 },
  { t: "03:00", load: 98, voltage: 392, incident: true },
  { t: "03:01", load: 71, voltage: 340 },
  { t: "03:02", load: 44, voltage: 210 },
  { t: "03:03", load: 22, voltage: 96 },
  { t: "03:04", load: 12, voltage: 40 },
  { t: "03:05", load: 12, voltage: 38 },
]

export type NodeStatus = "root" | "impacted" | "normal"

export const propagationNodes: {
  id: string
  label: string
  sub: string
  status: NodeStatus
  layer: number
}[] = [
  { id: "transformer", label: "Transformer", sub: "TR-Main-01", status: "normal", layer: 0 },
  { id: "ups", label: "UPS", sub: "UPS-A01", status: "root", layer: 1 },
  { id: "pdu", label: "PDU", sub: "PDU-A01~A04", status: "impacted", layer: 2 },
  { id: "rack", label: "Rack", sub: "Rack-A01~A12", status: "impacted", layer: 3 },
  { id: "gpu", label: "GPU Server", sub: "84 台 / 336 卡", status: "impacted", layer: 4 },
  { id: "service", label: "AI Service", sub: "AI Training", status: "impacted", layer: 5 },
]

export const timeline = [
  { time: "03:00:12", title: "UPS Failure", zh: "UPS-A01 电池组故障", priority: "P1" as Priority, detail: "电池内阻骤升，旁路切换失败" },
  { time: "03:00:48", title: "Voltage Drop", zh: "输出电压跌落", priority: "P1" as Priority, detail: "Power Zone A 电压 400V → 210V" },
  { time: "03:01:30", title: "PDU Loss", zh: "PDU 失电", priority: "P1" as Priority, detail: "PDU-A01~A04 输入中断" },
  { time: "03:02:15", title: "Rack Down", zh: "机架断电", priority: "P2" as Priority, detail: "Rack-A01~A12 供电丢失" },
  { time: "03:03:40", title: "Server Down", zh: "服务器离线", priority: "P2" as Priority, detail: "84 台 GPU 服务器离线" },
  { time: "03:04:20", title: "Service Impact", zh: "业务中断", priority: "P1" as Priority, detail: "AI Training Service 训练任务中断" },
]

export const actions = [
  {
    id: "ACT-01",
    name: "隔离 UPS-A01 并切换至旁路市电",
    en: "Isolate UPS-A01, switch to bypass",
    team: "Power Team",
    runbook: "RB-PWR-014",
    priority: "P1" as Priority,
    status: "in-progress" as const,
  },
  {
    id: "ACT-02",
    name: "更换 UPS-A01 电池模组",
    en: "Replace UPS-A01 battery modules",
    team: "Facility Team",
    runbook: "RB-FAC-207",
    priority: "P1" as Priority,
    status: "pending" as const,
  },
  {
    id: "ACT-03",
    name: "GPU 训练任务迁移至 Zone-B 集群",
    en: "Failover training jobs to Zone-B",
    team: "AI Platform Team",
    runbook: "RB-AIP-089",
    priority: "P2" as Priority,
    status: "in-progress" as const,
  },
  {
    id: "ACT-04",
    name: "验证机架供电恢复与健康检查",
    en: "Verify rack power & health check",
    team: "IT Operations",
    runbook: "RB-ITO-133",
    priority: "P2" as Priority,
    status: "pending" as const,
  },
  {
    id: "ACT-05",
    name: "确认下游业务已恢复训练",
    en: "Confirm services resumed",
    team: "AI Platform Team",
    runbook: "RB-AIP-090",
    priority: "P3" as Priority,
    status: "pending" as const,
  },
]

export const actionColumns = [
  { key: "pending", label: "待处理", en: "Pending" },
  { key: "in-progress", label: "处理中", en: "In Progress" },
  { key: "done", label: "已完成", en: "Done" },
] as const

export const teams = ["Power Team", "Facility Team", "IT Operations", "AI Platform Team"]

export const priorityMeta: Record<Priority, { label: string; color: string; bg: string }> = {
  P1: { label: "P1 Critical", color: "var(--p1)", bg: "rgba(229,57,53,0.14)" },
  P2: { label: "P2 Major", color: "var(--p2)", bg: "rgba(251,140,0,0.14)" },
  P3: { label: "P3 Minor", color: "var(--p3)", bg: "rgba(253,216,53,0.14)" },
}

// ========================================================================
// RCA Investigation Center 数据
// ========================================================================

export const rcaHeader = {
  incidentId: "INC-20260820",
  rootCause: demoMetrics.rootCause,
  confidence: demoMetrics.confidence,
  duration: "2 Minutes",
  reduction: `${demoMetrics.rawAlarms} → ${demoMetrics.rootCauseCount} (${demoMetrics.reductionRate}%)`,
}

export type AlarmSeverity = "Critical" | "Major" | "Minor" | "Warning"
export type AlarmStatus = "Active" | "Correlated" | "Suppressed" | "Cleared"

export interface RawAlarm {
  id: string
  timestamp: string
  device: string
  code: string
  message: string
  severity: AlarmSeverity
  status: AlarmStatus
  source: string
}

// 约 20 条真实运维风格样例告警
export const rawAlarms: RawAlarm[] = [
  { id: "A-100238", timestamp: "03:00:12.481", device: "UPS-A01", code: "UPS-BATT-CRIT-014", message: "Battery internal resistance exceeded threshold (+34%)", severity: "Critical", status: "Active", source: "Power Monitoring" },
  { id: "A-100239", timestamp: "03:00:13.902", device: "UPS-A01", code: "UPS-BYP-FAIL-021", message: "Static bypass transfer failed", severity: "Critical", status: "Correlated", source: "Power Monitoring" },
  { id: "A-100241", timestamp: "03:00:25.117", device: "UPS-A01", code: "UPS-VOUT-LOW-009", message: "Output voltage low: 210V (nominal 400V)", severity: "Critical", status: "Correlated", source: "Power Monitoring" },
  { id: "A-100244", timestamp: "03:00:31.680", device: "PDU-A01", code: "PDU-INPUT-LOSS-003", message: "Input feed A power loss detected", severity: "Major", status: "Correlated", source: "Facility DCIM" },
  { id: "A-100245", timestamp: "03:00:32.104", device: "PDU-A02", code: "PDU-INPUT-LOSS-003", message: "Input feed A power loss detected", severity: "Major", status: "Suppressed", source: "Facility DCIM" },
  { id: "A-100246", timestamp: "03:00:32.559", device: "PDU-A03", code: "PDU-INPUT-LOSS-003", message: "Input feed A power loss detected", severity: "Major", status: "Suppressed", source: "Facility DCIM" },
  { id: "A-100247", timestamp: "03:00:33.001", device: "PDU-A04", code: "PDU-INPUT-LOSS-003", message: "Input feed A power loss detected", severity: "Major", status: "Suppressed", source: "Facility DCIM" },
  { id: "A-100251", timestamp: "03:01:10.226", device: "Rack-A01", code: "RACK-PWR-DOWN-011", message: "Rack PDU output de-energized", severity: "Major", status: "Correlated", source: "Facility DCIM" },
  { id: "A-100252", timestamp: "03:01:11.870", device: "Rack-A02", code: "RACK-PWR-DOWN-011", message: "Rack PDU output de-energized", severity: "Major", status: "Suppressed", source: "Facility DCIM" },
  { id: "A-100258", timestamp: "03:01:44.512", device: "Rack-A07", code: "RACK-TEMP-HIGH-006", message: "Inlet temperature rising: 31°C", severity: "Minor", status: "Suppressed", source: "Environmental" },
  { id: "A-100263", timestamp: "03:02:05.338", device: "gpu-a01-n03", code: "SRV-UNREACH-002", message: "Server unreachable (ICMP + IPMI timeout)", severity: "Critical", status: "Correlated", source: "Infra Monitoring" },
  { id: "A-100264", timestamp: "03:02:05.905", device: "gpu-a01-n04", code: "SRV-UNREACH-002", message: "Server unreachable (ICMP + IPMI timeout)", severity: "Critical", status: "Suppressed", source: "Infra Monitoring" },
  { id: "A-100271", timestamp: "03:02:19.640", device: "gpu-a02-n01", code: "GPU-NVLINK-DOWN-008", message: "NVLink fabric partition lost", severity: "Major", status: "Suppressed", source: "GPU Telemetry" },
  { id: "A-100277", timestamp: "03:02:41.203", device: "tor-sw-a01", code: "NET-PORT-DOWN-004", message: "48 access ports down (link loss)", severity: "Major", status: "Suppressed", source: "Network NMS" },
  { id: "A-100283", timestamp: "03:03:02.771", device: "k8s-node-a12", code: "K8S-NODE-NOTREADY-005", message: "Kubelet NotReady, 42 pods evicted", severity: "Major", status: "Suppressed", source: "K8s Control Plane" },
  { id: "A-100289", timestamp: "03:03:15.418", device: "ai-train-svc", code: "SVC-DEGRADED-001", message: "Training service throughput dropped to 12%", severity: "Critical", status: "Correlated", source: "APM" },
  { id: "A-100290", timestamp: "03:03:16.002", device: "ai-train-svc", code: "JOB-CKPT-FAIL-007", message: "Distributed job checkpoint failed (rank 0-83)", severity: "Major", status: "Suppressed", source: "APM" },
  { id: "A-100294", timestamp: "03:03:48.559", device: "storage-a01", code: "STG-LATENCY-HIGH-012", message: "NVMe read latency spike: 48ms", severity: "Minor", status: "Suppressed", source: "Storage Array" },
  { id: "A-100298", timestamp: "03:04:05.117", device: "cooling-crah-a03", code: "COOL-FAN-WARN-010", message: "CRAH fan speed reduced (load drop)", severity: "Warning", status: "Suppressed", source: "Environmental" },
  { id: "A-100301", timestamp: "03:04:20.884", device: "ai-train-svc", code: "SLA-BREACH-001", message: "SLA breached: job availability < 99.5%", severity: "Critical", status: "Active", source: "SLA 监控" },
]

export interface PipelineStep {
  key: string
  label: string
  en: string
  input: number
  output: number
  desc: string
}

export const pipelineSteps: PipelineStep[] = [
  { key: "collect", label: "原始采集", en: "Raw Alarm Collection", input: 1248, output: 1248, desc: "多源告警汇聚（8 大监控系统）" },
  { key: "noise", label: "噪声抑制", en: "Noise Reduction", input: 1248, output: 312, desc: "抖动/闪断/重复告警过滤" },
  { key: "topology", label: "影响链路", en: "Impact Chain", input: 312, output: 92, desc: "按设备依赖关系归并关联告警" },
  { key: "spatial", label: "空间关联", en: "Spatial Correlation", input: 92, output: 48, desc: "机房/区域/机柜维度聚合" },
  { key: "temporal", label: "时间关联", en: "Temporal Correlation", input: 48, output: 17, desc: "级联时间窗对齐" },
  { key: "pattern", label: "模式识别", en: "Pattern Recognition", input: 17, output: 8, desc: "匹配历史故障指纹库" },
  { key: "cluster", label: "智能聚类", en: "Smart Clustering", input: 8, output: 3, desc: "相似告警自动归组" },
  { key: "rca", label: "根因分析", en: "Root Cause Analysis", input: 3, output: 1, desc: "因果推理定位唯一源头" },
]

export interface TopoNode {
  id: string
  label: string
  sub: string
  status: NodeStatus
  layer: number
  deps: string[]
}

// 供电拓扑关系图（Azure Service Map 风格）
export const topoNodes: TopoNode[] = [
  { id: "transformer", label: "Transformer", sub: "TR-Main-01 · 2000kVA", status: "normal", layer: 0, deps: ["ups"] },
  { id: "ups", label: "UPS", sub: "UPS-A01", status: "root", layer: 1, deps: ["pdu"] },
  { id: "pdu", label: "PDU", sub: "PDU-A01 ~ A04", status: "impacted", layer: 2, deps: ["rack"] },
  { id: "rack", label: "Rack", sub: "Rack-A01 ~ A12", status: "impacted", layer: 3, deps: ["gpu"] },
  { id: "gpu", label: "GPU Server", sub: "84 台 · 336 卡", status: "impacted", layer: 4, deps: ["service"] },
  { id: "service", label: "AI Training Service", sub: "分布式训练集群", status: "impacted", layer: 5, deps: [] },
]

export interface EvidenceEvent {
  time: string
  title: string
  zh: string
  device: string
  severity: AlarmSeverity
  detail: string
  metrics: { label: string; value: string }[]
}

export const evidenceTimeline: EvidenceEvent[] = [
  {
    time: "03:00:12", title: "UPS Battery Failure", zh: "UPS 电池组故障", device: "UPS-A01", severity: "Critical",
    detail: "电池内阻在 5 分钟采样窗内上升 34%，超过临界阈值，静态旁路切换失败，输出无法维持。",
    metrics: [{ label: "内阻变化", value: "+34%" }, { label: "旁路切换", value: "失败" }, { label: "关联告警", value: "2 条" }],
  },
  {
    time: "03:00:25", title: "Output Voltage Low", zh: "输出电压跌落", device: "UPS-A01", severity: "Critical",
    detail: "UPS 输出电压由额定 400V 跌落至 210V，Power Zone A 供电质量急剧劣化。",
    metrics: [{ label: "电压", value: "400V → 210V" }, { label: "负载", value: "98% → 44%" }],
  },
  {
    time: "03:01:10", title: "PDU Power Loss", zh: "PDU 失电", device: "PDU-A01~A04", severity: "Major",
    detail: "4 台 PDU A 路输入同时丢失，去电时间差 < 500ms，判定为同源供电中断。",
    metrics: [{ label: "受影响 PDU", value: "4 台" }, { label: "时间差", value: "< 500ms" }],
  },
  {
    time: "03:01:30", title: "Rack Power Loss", zh: "机架断电", device: "Rack-A01~A12", severity: "Major",
    detail: "12 个机架供电丢失，机架 PDU 输出去电，触发下游服务器批量掉线。",
    metrics: [{ label: "受影响机架", value: "12 个" }, { label: "抑制告警", value: "180+ 条" }],
  },
  {
    time: "03:02:05", title: "GPU Server Unreachable", zh: "GPU 服务器离线", device: "gpu-a01~a12", severity: "Critical",
    detail: "84 台 GPU 服务器 ICMP 与 IPMI 双通道超时，NVLink Fabric 分区丢失。",
    metrics: [{ label: "离线服务器", value: "84 台" }, { label: "受影响 GPU", value: "336 卡" }],
  },
  {
    time: "03:03:15", title: "AI Training Service Unavailable", zh: "AI 训练业务中断", device: "ai-train-svc", severity: "Critical",
    detail: "分布式训练任务吞吐跌至 12%，Checkpoint 失败，触发 SLA 可用性告警。",
    metrics: [{ label: "吞吐", value: "→ 12%" }, { label: "SLA", value: "已违约" }],
  },
]

export interface ChangeRecord {
  id: string
  title: string
  en: string
  type: string
  window: string
  owner: string
  probability: number
  status: "已完成" | "进行中" | "已回滚"
}

export const changeRecords: ChangeRecord[] = [
  { id: "CHG-88214", title: "UPS-A01 计划性维护", en: "UPS Maintenance", type: "Maintenance", window: "08-19 22:00 ~ 23:30", owner: "Facility Team", probability: 87, status: "已完成" },
  { id: "CHG-88221", title: "配电监控阈值配置变更", en: "Configuration Change", type: "Config", window: "08-19 23:40 ~ 23:55", owner: "Power Team", probability: 46, status: "已完成" },
  { id: "CHG-88235", title: "UPS 控制器固件升级", en: "Firmware Upgrade", type: "Firmware", window: "08-20 01:10 ~ 02:05", owner: "Vendor OEM", probability: 63, status: "已完成" },
  { id: "CHG-88240", title: "A 区维护窗口（未关闭）", en: "Maintenance Window", type: "Window", window: "08-20 00:00 ~ 06:00", owner: "IT Operations", probability: 21, status: "进行中" },
]

export interface RcaRank {
  cause: string
  zh: string
  confidence: number
}

export const rcaRanking: RcaRank[] = [
  { cause: "UPS Battery Failure", zh: "UPS 电池组故障", confidence: 98 },
  { cause: "UPS Controller Failure", zh: "UPS 控制器故障", confidence: 12 },
  { cause: "PDU Input Failure", zh: "PDU 输入故障", confidence: 5 },
]

export const preventiveActions = [
  { title: "Battery Health Monitoring", zh: "电池健康度实时监控", desc: "部署内阻/温度趋势预测，提前 7 天预警劣化电池组。" },
  { title: "Quarterly Inspection", zh: "季度巡检制度", desc: "将 UPS 电池深度放电测试纳入季度巡检 SOP。" },
  { title: "UPS Redundancy Validation", zh: "UPS 冗余验证", desc: "每月演练 A/B 双路切换，验证旁路与冗余可用性。" },
]

export const evidenceChain = [
  { label: "UPS Failure", zh: "UPS 故障", device: "UPS-A01" },
  { label: "PDU Loss", zh: "PDU 失电", device: "PDU-A01~A04" },
  { label: "Rack Down", zh: "机架断电", device: "Rack-A01~A12" },
  { label: "Server Down", zh: "服务器离线", device: "84 台 GPU 服务器" },
  { label: "Service Impact", zh: "业务受损", device: "AI Training Service" },
]

export const rcaSummary = {
  generatedAt: "2026-08-20 03:06:02",
  source: "由 AI 自动生成 · Auto-generated",
  text: [
    "经智能分析，本次事故根因唯一定位为 **UPS-A01 电池组故障**（置信度 98%）。电池内阻在故障前 5 分钟内异常上升 34%，导致静态旁路切换失败，Power Zone A 输出电压由 400V 跌落至 210V。",
    "故障沿供电依赖链级联传播：UPS → PDU(4) → Rack(12) → GPU Server(84) → AI Training Service，最终导致分布式训练任务中断并违反 SLA。1,248 条原始告警经逐步精简归并为唯一根因。",
    "关联分析显示，08-19 夜间的 UPS 计划性维护（CHG-88214，相关概率 87%）为最可能诱因，建议优先核查该变更中电池模组的更换与放电测试记录。",
  ],
}

export const incidentReport = {
  id: "INC-20260820-0417",
  title: "AI Training 集群供电中断事故快报",
  generatedAt: "2026-08-20 03:06:02",
  priority: "P1" as Priority,
  body: [
    { h: "事故概述", t: "2026-08-20 03:00，UPS-A01 电池组故障触发 Power Zone A 供电中断，级联影响 12 个机架、84 台 GPU 服务器（336 卡），导致 AI Training Service 训练任务中断。智能分析在 1,248 条原始告警中定位唯一根因。" },
    { h: "根因结论", t: "UPS-A01 Battery Failure（电池内阻升高 + 旁路切换失败），置信度 98%。" },
    { h: "影响范围", t: "受影响机架 12 / 服务器 84 / GPU 336 卡 / 业务 2 项，供电区域 Power Zone A。" },
    { h: "处置进展", t: "Power Team 已隔离 UPS-A01 并切换旁路；AI Platform Team 正在将训练任务迁移至 Zone-B；Facility Team 待更换电池模组。" },
    { h: "预计恢复", t: "旁路市电供电已恢复，预计电池更换在 45 分钟内完成，业务全量恢复 ETA 03:55。" },
  ],
}
