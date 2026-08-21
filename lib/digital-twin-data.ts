export type ImpactRole = "root" | "impacted" | "healthy"

export type TwinFilter =
  | "physical"
  | "electrical"
  | "cooling"
  | "network"
  | "business"
  | "knowledge"

export const twinFilters: { key: TwinFilter; label: string; en: string }[] = [
  { key: "physical", label: "物理空间", en: "Physical" },
  { key: "electrical", label: "供电", en: "Electrical" },
  { key: "cooling", label: "制冷", en: "Cooling" },
  { key: "network", label: "网络", en: "Network" },
  { key: "business", label: "业务", en: "Business" },
  { key: "knowledge", label: "知识图谱", en: "Knowledge Graph" },
]

export const impactLegend = [
  { role: "root" as const, label: "根因 Root Cause", color: "var(--p1)" },
  { role: "impacted" as const, label: "受影响 Impacted", color: "var(--p2)" },
  { role: "healthy" as const, label: "健康 Healthy", color: "var(--ok)" },
]

export const spaceHeatmap = [
  { id: "building-a", label: "Building A", zh: "A 栋", role: "impacted" as ImpactRole, heat: 72 },
  { id: "floor-1", label: "Floor 1", zh: "1 层", role: "impacted" as ImpactRole, heat: 85 },
  { id: "power-zone-a", label: "Power Zone A", zh: "供电区域 A", role: "root" as ImpactRole, heat: 98 },
]

export const physicalSpace = {
  dc: { id: "dc", label: "Data Center", zh: "数据中心", role: "healthy" as ImpactRole },
  building: { id: "building-a", label: "Building A", zh: "A 栋", role: "healthy" as ImpactRole },
  floor: { id: "floor-1", label: "Floor 1", zh: "1 层", role: "healthy" as ImpactRole },
  zone: { id: "power-zone-a", label: "Power Zone A", zh: "供电区域 A", role: "root" as ImpactRole },
  aisle: { id: "cold-aisle-a", label: "Cold Aisle-A", zh: "冷通道 A", role: "impacted" as ImpactRole },
  rack: { id: "rack-a01", label: "Rack-A01", zh: "机架 A01", role: "impacted" as ImpactRole },
}

export const infraDomains = {
  electrical: {
    label: "Electrical Domain",
    zh: "供电域",
    chain: [
      { id: "transformer", label: "Transformer", zh: "变压器", role: "healthy" as ImpactRole },
      { id: "ups-a01", label: "UPS-A01", zh: "UPS-A01", role: "root" as ImpactRole },
      { id: "pdu-a01", label: "PDU-A01", zh: "PDU-A01", role: "impacted" as ImpactRole },
      { id: "rack-a01", label: "Rack-A01", zh: "机架 A01", role: "impacted" as ImpactRole },
    ],
  },
  cooling: {
    label: "Cooling Domain",
    zh: "制冷域",
    chain: [
      { id: "ch-01", label: "CH-01", zh: "冷水机组", role: "healthy" as ImpactRole },
      { id: "pump-01", label: "Pump-01", zh: "水泵", role: "healthy" as ImpactRole },
      { id: "crah-01", label: "CRAH-01", zh: "精密空调", role: "healthy" as ImpactRole },
      { id: "cold-aisle-a", label: "Cold Aisle-A", zh: "冷通道 A", role: "impacted" as ImpactRole },
    ],
  },
  network: {
    label: "Network Domain",
    zh: "网络域",
    chain: [{ id: "coresw-01", label: "CoreSW-01", zh: "核心交换机", role: "healthy" as ImpactRole }],
  },
  storage: {
    label: "Storage Domain",
    zh: "存储域",
    chain: [{ id: "san-01", label: "SAN-01", zh: "存储阵列", role: "healthy" as ImpactRole }],
  },
}

export const businessLayer = [
  { id: "ai-training-service", label: "AI Training Service", zh: "AI 训练服务", role: "impacted" as ImpactRole },
  { id: "ai-training-platform", label: "AI Training Platform", zh: "AI 训练平台", role: "impacted" as ImpactRole },
  { id: "training-job", label: "Training Job", zh: "训练任务", role: "impacted" as ImpactRole },
  { id: "vm-gpu-01", label: "VM-GPU-01", zh: "GPU 虚拟机", role: "impacted" as ImpactRole },
  { id: "gpu-server-01", label: "GPU-Server-01", zh: "GPU 服务器", role: "impacted" as ImpactRole },
]

/** Cross-layer knowledge links for Knowledge Graph filter */
export const knowledgeLinks = [
  { from: "ups-a01", fromLayer: "infra", to: "power-zone-a", toLayer: "physical", label: "located_in" },
  { from: "rack-a01", fromLayer: "infra", to: "rack-a01", toLayer: "physical", label: "hosts" },
  { from: "gpu-server-01", fromLayer: "business", to: "rack-a01", toLayer: "infra", label: "runs_on" },
  { from: "ai-training-service", fromLayer: "business", to: "gpu-server-01", toLayer: "business", label: "depends_on" },
  { from: "ups-a01", fromLayer: "infra", to: "ai-training-service", toLayer: "business", label: "impacts" },
]

export const impactPath = ["ups-a01", "pdu-a01", "rack-a01", "gpu-server-01", "ai-training-service"]

export function impactStyles(role: ImpactRole) {
  switch (role) {
    case "root":
      return {
        card: "border-[var(--p1)] bg-[var(--p1)]/10 shadow-[0_0_0_1px_var(--p1)]",
        text: "text-[var(--p1)]",
        dot: "bg-[var(--p1)]",
        heat: "from-[var(--p1)]/25 to-[var(--p1)]/8",
      }
    case "impacted":
      return {
        card: "border-[var(--p2)] bg-[var(--p2)]/10 shadow-[0_0_0_1px_var(--p2)]",
        text: "text-[var(--p2)]",
        dot: "bg-[var(--p2)]",
        heat: "from-[var(--p2)]/25 to-[var(--p2)]/8",
      }
    default:
      return {
        card: "border-primary/35 bg-primary/8",
        text: "text-primary",
        dot: "bg-primary",
        heat: "from-primary/20 to-primary/5",
      }
  }
}
