export type TwinEdgeKind = "business" | "install" | "spatial" | "power" | "cooling" | "data"

export type TwinHeatDomain = "Power" | "Cooling" | "Storage" | "Network"

export type TwinNode = {
  id: string
  name: string
  code: string
  kind: "service" | "rack" | "device"
}

export type TwinEdge = {
  from: string
  to: string
  kind: TwinEdgeKind
  label: string
}

export const TWIN_EDGE_STYLE: Record<
  TwinEdgeKind,
  { color: string; label: string }
> = {
  business: { color: "#60a5fa", label: "业务流" },
  install: { color: "#4ade80", label: "物理安装" },
  spatial: { color: "#94a3b8", label: "空间位置" },
  power: { color: "#facc15", label: "供电链路" },
  cooling: { color: "#22d3ee", label: "制冷链路" },
  data: { color: "#c084fc", label: "数据链路" },
}

export const twinNodes = {
  aiservice: { id: "aiservice", name: "AI训练服务", code: "AIService", kind: "service" },
  aiplatform: { id: "aiplatform", name: "AI训练平台", code: "AIPlatform", kind: "service" },
  job: { id: "job", name: "AI容器", code: "training-job-001", kind: "device" },
  vm: { id: "vm", name: "GPU虚拟机", code: "VM-GPU-01", kind: "device" },
  gpu: { id: "gpu", name: "GPU服务器", code: "GPU-Server-01", kind: "device" },
  san: { id: "san", name: "全闪存阵列", code: "SAN-01", kind: "device" },
  coresw: { id: "coresw", name: "核心交换机", code: "CoreSW-01", kind: "device" },
  aisleA: { id: "aisleA", name: "冷通道 A", code: "Cold Aisle-A", kind: "device" },
  aisleB: { id: "aisleB", name: "冷通道 B", code: "Cold Aisle-B", kind: "device" },
  rackA01: { id: "rackA01", name: "机架-A01", code: "Rack-A01", kind: "rack" },
  rackA02: { id: "rackA02", name: "机架-A02", code: "Rack-A02", kind: "rack" },
  rackA03: { id: "rackA03", name: "机架-A03", code: "Rack-A03", kind: "rack" },
  rackB01: { id: "rackB01", name: "机架-B01", code: "Rack-B01", kind: "rack" },
  rackB02: { id: "rackB02", name: "机架-B02", code: "Rack-B02", kind: "rack" },
  rackB03: { id: "rackB03", name: "机架-B03", code: "Rack-B03", kind: "rack" },
  transformer: { id: "transformer", name: "变压器", code: "Transformer-01", kind: "device" },
  ups: { id: "ups", name: "UPS电源", code: "UPS-A01", kind: "device" },
  pdu: { id: "pdu", name: "配电单元", code: "PDU-A01", kind: "device" },
  chiller: { id: "chiller", name: "冷水机组", code: "CH-01", kind: "device" },
  pump: { id: "pump", name: "水泵", code: "Pump-01", kind: "device" },
  crah: { id: "crah", name: "精密空调", code: "CRAH-01", kind: "device" },
} as const satisfies Record<string, TwinNode>

export const twinEdges: TwinEdge[] = [
  { from: "aiservice", to: "aiplatform", kind: "business", label: "依赖" },
  { from: "aiplatform", to: "job", kind: "business", label: "运行于" },
  { from: "job", to: "vm", kind: "business", label: "托管于" },
  { from: "vm", to: "gpu", kind: "business", label: "托管于" },
  { from: "gpu", to: "rackA01", kind: "install", label: "安装在" },
  { from: "rackA01", to: "aisleA", kind: "spatial", label: "位于" },
  { from: "rackA02", to: "aisleA", kind: "spatial", label: "位于" },
  { from: "rackA03", to: "aisleA", kind: "spatial", label: "位于" },
  { from: "rackB01", to: "aisleB", kind: "spatial", label: "位于" },
  { from: "rackB02", to: "aisleB", kind: "spatial", label: "位于" },
  { from: "rackB03", to: "aisleB", kind: "spatial", label: "位于" },
  { from: "transformer", to: "ups", kind: "power", label: "供电" },
  { from: "ups", to: "pdu", kind: "power", label: "供电" },
  { from: "pdu", to: "rackA01", kind: "power", label: "供电" },
  { from: "pdu", to: "rackA02", kind: "power", label: "供电" },
  { from: "pdu", to: "rackA03", kind: "power", label: "供电" },
  { from: "pdu", to: "rackB01", kind: "power", label: "供电" },
  { from: "pdu", to: "rackB02", kind: "power", label: "供电" },
  { from: "pdu", to: "rackB03", kind: "power", label: "供电" },
  { from: "chiller", to: "pump", kind: "cooling", label: "供水" },
  { from: "pump", to: "crah", kind: "cooling", label: "供水" },
  { from: "crah", to: "aisleA", kind: "cooling", label: "服务于" },
  { from: "crah", to: "aisleB", kind: "cooling", label: "服务于" },
  { from: "gpu", to: "san", kind: "data", label: "读取" },
  { from: "gpu", to: "coresw", kind: "data", label: "连接" },
]
