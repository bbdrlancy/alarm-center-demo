export type NodeRole = "root" | "impacted" | "normal"

export const spatialTree = [
  { id: "dc", label: "Data Center", zh: "数据中心", role: "normal" as NodeRole },
  { id: "building", label: "Building A", zh: "A 栋", role: "normal" as NodeRole },
  { id: "floor", label: "Floor 1", zh: "1 层", role: "normal" as NodeRole },
  { id: "zone", label: "Power Zone A", zh: "供电区域 A", role: "impacted" as NodeRole },
  { id: "ups", label: "UPS-A01", zh: "UPS-A01", role: "root" as NodeRole },
  { id: "pdu", label: "PDU-A01", zh: "PDU-A01", role: "impacted" as NodeRole },
  { id: "rack", label: "Rack-A01", zh: "机架 A01", role: "impacted" as NodeRole },
  { id: "gpu", label: "GPU Server", zh: "GPU 服务器", role: "impacted" as NodeRole },
]

export const powerChain = [
  { id: "utility", label: "Utility Power", zh: "市电", role: "normal" as NodeRole },
  { id: "transformer", label: "Transformer", zh: "变压器", role: "normal" as NodeRole },
  { id: "ups", label: "UPS-A01", zh: "UPS-A01", role: "root" as NodeRole },
  { id: "pdu", label: "PDU-A01", zh: "PDU-A01", role: "impacted" as NodeRole },
  { id: "rack", label: "Rack-A01", zh: "机架 A01", role: "impacted" as NodeRole },
  { id: "gpu", label: "GPU Server", zh: "GPU 服务器", role: "impacted" as NodeRole },
  { id: "service", label: "AI Training Service", zh: "AI 训练服务", role: "impacted" as NodeRole },
]

export const businessChain = [
  { id: "service", label: "AI Training Service", zh: "AI 训练服务", role: "impacted" as NodeRole },
  { id: "cluster", label: "Training Cluster", zh: "训练集群", role: "impacted" as NodeRole },
  { id: "gpu", label: "GPU Server", zh: "GPU 服务器", role: "impacted" as NodeRole },
  { id: "network", label: "Network", zh: "网络", role: "normal" as NodeRole },
  { id: "storage", label: "Storage", zh: "存储", role: "normal" as NodeRole },
  { id: "power", label: "Power System", zh: "供电系统", role: "root" as NodeRole },
]

export const ontologyEntities = [
  "Location",
  "Asset",
  "Device",
  "Sensor",
  "Alarm",
  "Event",
  "Incident",
  "Change",
  "Work Order",
  "Service",
  "Knowledge",
  "Relationship",
] as const

export const ontologyRelations = [
  { from: "Location", to: "Asset", label: "contains" },
  { from: "Asset", to: "Device", label: "has" },
  { from: "Device", to: "Sensor", label: "monitored_by" },
  { from: "Sensor", to: "Alarm", label: "generates" },
  { from: "Alarm", to: "Event", label: "triggers" },
  { from: "Event", to: "Incident", label: "escalates_to" },
  { from: "Change", to: "Incident", label: "correlates_with" },
  { from: "Incident", to: "Work Order", label: "creates" },
  { from: "Device", to: "Service", label: "supports" },
  { from: "Incident", to: "Knowledge", label: "enriches" },
  { from: "Knowledge", to: "Relationship", label: "defines" },
]

export type GraphNode = {
  id: string
  label: string
  group: "device" | "location" | "service" | "process" | "knowledge"
  concept: string
  x: number
  y: number
  incidentPath?: boolean
}

export type GraphEdge = {
  from: string
  to: string
  label: string
}

export const knowledgeGraphNodes: GraphNode[] = [
  { id: "building-a", label: "Building A", group: "location", concept: "Location", x: 60, y: 50 },
  { id: "power-zone-a", label: "Power Zone A", group: "location", concept: "Location", x: 60, y: 110 },
  { id: "transformer", label: "Transformer-01", group: "device", concept: "Device", x: 180, y: 50 },
  { id: "ups", label: "UPS-A01", group: "device", concept: "Device", x: 180, y: 110, incidentPath: true },
  { id: "pdu", label: "PDU-A01", group: "device", concept: "Device", x: 300, y: 110 },
  { id: "rack", label: "Rack-A01", group: "device", concept: "Device", x: 420, y: 110 },
  { id: "gpu", label: "GPU-Server01", group: "device", concept: "Device", x: 540, y: 110 },
  { id: "service", label: "AI Training Service", group: "service", concept: "Service", x: 660, y: 110, incidentPath: true },
  { id: "alarm", label: "UPS-BAT-001", group: "process", concept: "Alarm", x: 300, y: 190, incidentPath: true },
  { id: "incident", label: "INC-20260820", group: "process", concept: "Incident", x: 420, y: 190, incidentPath: true },
  { id: "runbook", label: "RB-PWR-014", group: "knowledge", concept: "Knowledge", x: 540, y: 190 },
  { id: "workorder", label: "WO-20260820", group: "process", concept: "Work Order", x: 660, y: 190 },
]

export const knowledgeGraphEdges: GraphEdge[] = [
  { from: "building-a", to: "power-zone-a", label: "contains" },
  { from: "power-zone-a", to: "ups", label: "located_in" },
  { from: "transformer", to: "ups", label: "powered_by" },
  { from: "ups", to: "pdu", label: "supplies" },
  { from: "pdu", to: "rack", label: "powers" },
  { from: "rack", to: "gpu", label: "hosts" },
  { from: "gpu", to: "service", label: "runs" },
  { from: "ups", to: "alarm", label: "generates" },
  { from: "alarm", to: "incident", label: "escalates_to" },
  { from: "incident", to: "workorder", label: "creates" },
  { from: "incident", to: "runbook", label: "enriches" },
  { from: "incident", to: "service", label: "impacts" },
]

export const incidentInstanceMapping = [
  { id: "incident", label: "INC-20260820" },
  { id: "ups", label: "UPS-A01" },
  { id: "alarm", label: "UPS-BAT-001" },
  { id: "service", label: "AI Training Service" },
]

export const graphragSteps = [
  { step: 1, title: "读取告警", en: "Read Alarms", value: "1,248", detail: "接入多源告警流" },
  { step: 2, title: "查询知识图谱", en: "Query Knowledge Graph", detail: "检索设备与关系上下文" },
  { step: 3, title: "分析拓扑关系", en: "Analyze Topology", detail: "供电依赖链推理" },
  { step: 4, title: "分析时间关系", en: "Analyze Timeline", detail: "级联事件时间对齐" },
  { step: 5, title: "分析空间关系", en: "Analyze Spatial", detail: "Power Zone A 空间定位" },
  { step: 6, title: "匹配历史事件", en: "Match History", detail: "UPS 电池故障模式库" },
  { step: 7, title: "生成根因候选", en: "Generate Candidates", detail: "3 个候选 → 排序" },
  { step: 8, title: "输出最终根因", en: "Final Root Cause", value: "UPS-A01 Battery Failure", confidence: "98%" },
]

export const copilotLayers = {
  dataSources: ["CMDB", "资产系统", "DCIM", "EMS", "BMS", "工单系统", "告警系统", "知识库", "知识图谱"],
  layers: [
    { id: "data", label: "Data Layer", zh: "数据层", desc: "多源异构数据汇聚" },
    { id: "semantic", label: "Semantic Layer", zh: "语义层", desc: "企业本体统一语义" },
    { id: "knowledge", label: "Knowledge Layer", zh: "知识层", desc: "图谱与关系网络" },
    { id: "graphrag", label: "GraphRAG", zh: "图谱增强推理", desc: "上下文检索与推理" },
    { id: "copilot", label: "Copilot", zh: "智能助手", desc: "自然语言解释与建议" },
  ],
}

export const roleColors: Record<NodeRole, { bg: string; border: string; text: string; label: string }> = {
  root: { bg: "bg-[var(--p1)]/12", border: "border-[var(--p1)]/50", text: "text-[var(--p1)]", label: "根因" },
  impacted: { bg: "bg-[var(--p2)]/12", border: "border-[var(--p2)]/50", text: "text-[var(--p2)]", label: "受影响" },
  normal: { bg: "bg-primary/10", border: "border-primary/40", text: "text-primary", label: "正常" },
}
