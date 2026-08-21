export type ImpactRole = "root" | "impacted" | "healthy"

export type ExplorerView = "spatial" | "power" | "cooling" | "business" | "knowledge"

export const explorerViews: { key: ExplorerView; label: string; en: string }[] = [
  { key: "spatial", label: "空间视图", en: "Spatial View" },
  { key: "power", label: "供电视图", en: "Power View" },
  { key: "cooling", label: "制冷视图", en: "Cooling View" },
  { key: "business", label: "业务视图", en: "Business View" },
  { key: "knowledge", label: "知识图谱", en: "Knowledge Graph View" },
]

export const impactLegend = [
  { role: "root" as const, label: "根因 Root Cause", color: "var(--p1)" },
  { role: "impacted" as const, label: "受影响 Impacted", color: "var(--p2)" },
  { role: "healthy" as const, label: "健康 Healthy", color: "var(--ok)" },
]

export const incidentAutoExpand = ["dc01", "building-a", "floor-1", "domain-electrical"]

export const viewAutoExpand: Record<ExplorerView, string[]> = {
  spatial: ["dc01", "building-a", "floor-1", "floor-2", "domain-electrical", "domain-network", "domain-storage"],
  power: ["dc01", "building-a", "floor-1", "domain-electrical"],
  cooling: ["dc01", "building-a", "floor-1", "domain-cooling"],
  business: ["dc01", "building-a", "floor-2", "domain-it"],
  knowledge: [],
}

/** Quick-reference chains shown per view */
export const viewChains: Record<Exclude<ExplorerView, "knowledge">, string[]> = {
  spatial: ["building-a", "floor-2", "cold-aisle-a", "rack-a01"],
  power: ["transformer-01", "ups-a01", "pdu-a01", "rack-a01", "gpu-server01"],
  cooling: ["ch-01", "pump-01", "crah-01", "cold-aisle-a", "gpu-server01"],
  business: [
    "ai-training-service",
    "ai-training-platform",
    "training-job-001",
    "vm-gpu-01",
    "gpu-server01",
  ],
}

export const impactPathIds = [
  "ups-a01",
  "pdu-a01",
  "rack-a01",
  "gpu-server01",
  "ai-training-service",
]

export const impactPathLabels = [
  "UPS-A01",
  "PDU-A01",
  "Rack-A01",
  "GPU-Server01",
  "AI Training Service",
]

export type NodeDetails = {
  location: string
  dependencies: string[]
  impacts: string[]
  relatedAlarms: string[]
  relatedIncidents: string[]
  relatedRunbooks: string[]
  graphNeighbors: { id: string; label: string; relation: string }[]
}

export type TwinExplorerNode = {
  id: string
  label: string
  zh: string
  kind: string
  role: ImpactRole
  views: ExplorerView[]
  children?: string[]
  details: NodeDetails
}

export const twinNodes: Record<string, TwinExplorerNode> = {
  dc01: {
    id: "dc01",
    label: "DC01 Data Center",
    zh: "DC01 数据中心",
    kind: "datacenter",
    role: "healthy",
    views: ["spatial", "power", "cooling", "business", "knowledge"],
    children: ["building-a", "building-b"],
    details: {
      location: "Shanghai · Tier III",
      dependencies: [],
      impacts: ["Building A", "Building B"],
      relatedAlarms: [],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: [],
      graphNeighbors: [
        { id: "building-a", label: "Building A", relation: "contains" },
        { id: "building-b", label: "Building B", relation: "contains" },
      ],
    },
  },
  "building-a": {
    id: "building-a",
    label: "Building A",
    zh: "A 栋",
    kind: "building",
    role: "impacted",
    views: ["spatial", "power", "cooling", "business", "knowledge"],
    children: ["floor-1", "floor-2"],
    details: {
      location: "DC01 / Building A",
      dependencies: ["DC01"],
      impacts: ["Floor 1", "Floor 2"],
      relatedAlarms: ["ALM-88421"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-DC-EVAC"],
      graphNeighbors: [
        { id: "floor-1", label: "Floor 1", relation: "contains" },
        { id: "floor-2", label: "Floor 2", relation: "contains" },
      ],
    },
  },
  "building-b": {
    id: "building-b",
    label: "Building B",
    zh: "B 栋",
    kind: "building",
    role: "healthy",
    views: ["spatial", "knowledge"],
    children: ["floor-b1"],
    details: {
      location: "DC01 / Building B",
      dependencies: ["DC01"],
      impacts: [],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [{ id: "dc01", label: "DC01", relation: "part_of" }],
    },
  },
  "floor-b1": {
    id: "floor-b1",
    label: "Floor 1",
    zh: "1 层",
    kind: "floor",
    role: "healthy",
    views: ["spatial"],
    details: {
      location: "DC01 / Building B / Floor 1",
      dependencies: ["Building B"],
      impacts: [],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [],
    },
  },
  "floor-1": {
    id: "floor-1",
    label: "Floor 1",
    zh: "1 层 · 基础设施",
    kind: "floor",
    role: "impacted",
    views: ["spatial", "power", "cooling", "knowledge"],
    children: ["domain-electrical", "domain-cooling", "domain-network", "domain-storage"],
    details: {
      location: "DC01 / Building A / Floor 1",
      dependencies: ["Building A"],
      impacts: ["Electrical Domain", "Cooling Domain"],
      relatedAlarms: ["ALM-88421", "ALM-88422"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-PWR-ISOLATE"],
      graphNeighbors: [
        { id: "domain-electrical", label: "Electrical Domain", relation: "hosts" },
        { id: "domain-cooling", label: "Cooling Domain", relation: "hosts" },
      ],
    },
  },
  "floor-2": {
    id: "floor-2",
    label: "Floor 2",
    zh: "2 层 · IT 与业务",
    kind: "floor",
    role: "impacted",
    views: ["spatial", "power", "cooling", "business", "knowledge"],
    children: [
      "cold-aisle-a",
      "cold-aisle-b",
      "rack-a01",
      "rack-a02",
      "rack-a03",
      "rack-b01",
      "rack-b02",
      "rack-b03",
      "domain-it",
    ],
    details: {
      location: "DC01 / Building A / Floor 2",
      dependencies: ["Building A", "Floor 1 Power"],
      impacts: ["Cold Aisles", "Racks", "IT Infrastructure"],
      relatedAlarms: ["ALM-88430"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-GPU-MIGRATE"],
      graphNeighbors: [
        { id: "rack-a01", label: "Rack-A01", relation: "contains" },
        { id: "ai-training-service", label: "AI Training Service", relation: "hosts" },
      ],
    },
  },
  "domain-electrical": {
    id: "domain-electrical",
    label: "Electrical Domain",
    zh: "供电域",
    kind: "domain",
    role: "impacted",
    views: ["spatial", "power", "knowledge"],
    details: {
      location: "Building A / Floor 1 / Electrical Room",
      dependencies: ["Utility Power"],
      impacts: ["PDU-A01", "Rack Power"],
      relatedAlarms: ["ALM-88421"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-PWR-ISOLATE", "RB-UPS-BYPASS"],
      graphNeighbors: [
        { id: "ups-a01", label: "UPS-A01", relation: "contains" },
        { id: "transformer-01", label: "Transformer-01", relation: "fed_by" },
      ],
    },
  },
  "domain-cooling": {
    id: "domain-cooling",
    label: "Cooling Domain",
    zh: "制冷域",
    kind: "domain",
    role: "healthy",
    views: ["spatial", "cooling", "knowledge"],
    details: {
      location: "Building A / Floor 1 / Mechanical Room",
      dependencies: ["CH Plant"],
      impacts: ["Cold Aisle A", "Cold Aisle B"],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: ["RB-CRAH-CHK"],
      graphNeighbors: [
        { id: "ch-01", label: "CH-01", relation: "contains" },
        { id: "cold-aisle-a", label: "Cold Aisle A", relation: "cools" },
      ],
    },
  },
  "domain-it": {
    id: "domain-it",
    label: "Business Domain",
    zh: "业务域 · IT Infrastructure",
    kind: "domain",
    role: "impacted",
    views: ["spatial", "business", "knowledge"],
    details: {
      location: "Building A / Floor 2 / IT Zone",
      dependencies: ["Rack-A01", "Network", "Storage"],
      impacts: ["AI Training Service"],
      relatedAlarms: ["ALM-88430", "ALM-88431"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-GPU-MIGRATE"],
      graphNeighbors: [
        { id: "gpu-server01", label: "GPU-Server01", relation: "contains" },
        { id: "ai-training-service", label: "AI Training Service", relation: "runs" },
      ],
    },
  },
  "transformer-01": {
    id: "transformer-01",
    label: "Transformer-01",
    zh: "变压器 01",
    kind: "transformer",
    role: "healthy",
    views: ["power", "knowledge"],
    details: {
      location: "Floor 1 / Electrical Room",
      dependencies: ["Utility Power"],
      impacts: ["UPS-A01"],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [{ id: "ups-a01", label: "UPS-A01", relation: "powers" }],
    },
  },
  "ups-a01": {
    id: "ups-a01",
    label: "UPS-A01",
    zh: "UPS-A01 · 根因",
    kind: "ups",
    role: "root",
    views: ["power", "cooling", "business", "knowledge"],
    details: {
      location: "Building A / Floor 1 / Power Zone A",
      dependencies: ["Transformer-01"],
      impacts: ["PDU-A01", "Rack-A01", "GPU-Server01", "AI Training Service"],
      relatedAlarms: ["ALM-88421", "ALM-88422"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-UPS-BYPASS", "RB-PWR-ISOLATE"],
      graphNeighbors: [
        { id: "pdu-a01", label: "PDU-A01", relation: "supplies" },
        { id: "transformer-01", label: "Transformer-01", relation: "powered_by" },
        { id: "ai-training-service", label: "AI Training Service", relation: "impacts" },
      ],
    },
  },
  "pdu-a01": {
    id: "pdu-a01",
    label: "PDU-A01",
    zh: "PDU-A01",
    kind: "pdu",
    role: "impacted",
    views: ["power", "knowledge"],
    details: {
      location: "Floor 1 / Power Zone A",
      dependencies: ["UPS-A01"],
      impacts: ["Rack-A01", "Rack-A02", "Rack-A03"],
      relatedAlarms: ["ALM-88422"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-PWR-ISOLATE"],
      graphNeighbors: [
        { id: "ups-a01", label: "UPS-A01", relation: "fed_by" },
        { id: "rack-a01", label: "Rack-A01", relation: "powers" },
      ],
    },
  },
  "ch-01": {
    id: "ch-01",
    label: "CH-01",
    zh: "冷水机组",
    kind: "chiller",
    role: "healthy",
    views: ["cooling", "knowledge"],
    details: {
      location: "Floor 1 / Mechanical Room",
      dependencies: ["Cooling Plant"],
      impacts: ["Pump-01"],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: ["RB-CH-MAINT"],
      graphNeighbors: [{ id: "pump-01", label: "Pump-01", relation: "feeds" }],
    },
  },
  "pump-01": {
    id: "pump-01",
    label: "Pump-01",
    zh: "水泵 01",
    kind: "pump",
    role: "healthy",
    views: ["cooling", "knowledge"],
    details: {
      location: "Floor 1 / Mechanical Room",
      dependencies: ["CH-01"],
      impacts: ["CRAH-01"],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [{ id: "crah-01", label: "CRAH-01", relation: "feeds" }],
    },
  },
  "crah-01": {
    id: "crah-01",
    label: "CRAH-01",
    zh: "精密空调",
    kind: "crah",
    role: "healthy",
    views: ["cooling", "knowledge"],
    details: {
      location: "Floor 1 / Mechanical Room",
      dependencies: ["Pump-01"],
      impacts: ["Cold Aisle A", "Cold Aisle B"],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: ["RB-CRAH-CHK"],
      graphNeighbors: [{ id: "cold-aisle-a", label: "Cold Aisle A", relation: "cools" }],
    },
  },
  "cold-aisle-a": {
    id: "cold-aisle-a",
    label: "Cold Aisle A",
    zh: "冷通道 A",
    kind: "aisle",
    role: "impacted",
    views: ["spatial", "cooling", "knowledge"],
    details: {
      location: "Floor 2 / Zone A",
      dependencies: ["CRAH-01"],
      impacts: ["Rack-A01", "Rack-A02", "Rack-A03"],
      relatedAlarms: ["ALM-88425"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: [],
      graphNeighbors: [{ id: "rack-a01", label: "Rack-A01", relation: "contains" }],
    },
  },
  "cold-aisle-b": {
    id: "cold-aisle-b",
    label: "Cold Aisle B",
    zh: "冷通道 B",
    kind: "aisle",
    role: "healthy",
    views: ["spatial", "cooling"],
    details: {
      location: "Floor 2 / Zone B",
      dependencies: ["CRAH-01"],
      impacts: ["Rack-B01", "Rack-B02", "Rack-B03"],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [],
    },
  },
  "rack-a01": {
    id: "rack-a01",
    label: "Rack-A01",
    zh: "机架 A01",
    kind: "rack",
    role: "impacted",
    views: ["spatial", "power", "cooling", "knowledge"],
    details: {
      location: "Floor 2 / Cold Aisle A",
      dependencies: ["PDU-A01", "Cold Aisle A"],
      impacts: ["GPU-Server01"],
      relatedAlarms: ["ALM-88426"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-RACK-PWR"],
      graphNeighbors: [
        { id: "pdu-a01", label: "PDU-A01", relation: "powered_by" },
        { id: "gpu-server01", label: "GPU-Server01", relation: "hosts" },
      ],
    },
  },
  "rack-a02": {
    id: "rack-a02",
    label: "Rack-A02",
    zh: "机架 A02",
    kind: "rack",
    role: "healthy",
    views: ["spatial"],
    details: {
      location: "Floor 2 / Cold Aisle A",
      dependencies: ["PDU-A01"],
      impacts: [],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [],
    },
  },
  "rack-a03": {
    id: "rack-a03",
    label: "Rack-A03",
    zh: "机架 A03",
    kind: "rack",
    role: "healthy",
    views: ["spatial"],
    details: {
      location: "Floor 2 / Cold Aisle A",
      dependencies: ["PDU-A01"],
      impacts: [],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [],
    },
  },
  "rack-b01": {
    id: "rack-b01",
    label: "Rack-B01",
    zh: "机架 B01",
    kind: "rack",
    role: "healthy",
    views: ["spatial"],
    details: {
      location: "Floor 2 / Cold Aisle B",
      dependencies: ["PDU-B01"],
      impacts: [],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [],
    },
  },
  "rack-b02": {
    id: "rack-b02",
    label: "Rack-B02",
    zh: "机架 B02",
    kind: "rack",
    role: "healthy",
    views: ["spatial"],
    details: {
      location: "Floor 2 / Cold Aisle B",
      dependencies: ["PDU-B01"],
      impacts: [],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [],
    },
  },
  "rack-b03": {
    id: "rack-b03",
    label: "Rack-B03",
    zh: "机架 B03",
    kind: "rack",
    role: "healthy",
    views: ["spatial"],
    details: {
      location: "Floor 2 / Cold Aisle B",
      dependencies: ["PDU-B01"],
      impacts: [],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [],
    },
  },
  "gpu-server01": {
    id: "gpu-server01",
    label: "GPU-Server01",
    zh: "GPU 服务器 01",
    kind: "gpu",
    role: "impacted",
    views: ["power", "cooling", "business", "knowledge"],
    details: {
      location: "Rack-A01 / U12-U24",
      dependencies: ["Rack-A01", "PDU-A01"],
      impacts: ["VM-GPU-01", "Training Job"],
      relatedAlarms: ["ALM-88430"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-GPU-MIGRATE"],
      graphNeighbors: [
        { id: "rack-a01", label: "Rack-A01", relation: "located_in" },
        { id: "vm-gpu-01", label: "VM-GPU-01", relation: "hosts" },
      ],
    },
  },
  "vm-gpu-01": {
    id: "vm-gpu-01",
    label: "VM-GPU-01",
    zh: "GPU 虚拟机",
    kind: "vm",
    role: "impacted",
    views: ["business", "knowledge"],
    details: {
      location: "GPU-Server01 / Hypervisor",
      dependencies: ["GPU-Server01"],
      impacts: ["Training-Job-001"],
      relatedAlarms: ["ALM-88431"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-VM-MIGRATE"],
      graphNeighbors: [
        { id: "gpu-server01", label: "GPU-Server01", relation: "runs_on" },
        { id: "training-job-001", label: "Training-Job-001", relation: "executes" },
      ],
    },
  },
  "training-job-001": {
    id: "training-job-001",
    label: "Training-Job-001",
    zh: "训练任务 001",
    kind: "job",
    role: "impacted",
    views: ["business", "knowledge"],
    details: {
      location: "AI Training Platform / Job Queue",
      dependencies: ["VM-GPU-01", "AI Training Platform"],
      impacts: ["AI Training Service SLA"],
      relatedAlarms: ["ALM-88432"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-JOB-RESUME"],
      graphNeighbors: [
        { id: "ai-training-platform", label: "AI Training Platform", relation: "managed_by" },
        { id: "ai-training-service", label: "AI Training Service", relation: "part_of" },
      ],
    },
  },
  "ai-training-platform": {
    id: "ai-training-platform",
    label: "AI Training Platform",
    zh: "AI 训练平台",
    kind: "platform",
    role: "impacted",
    views: ["business", "knowledge"],
    details: {
      location: "Floor 2 / IT Zone",
      dependencies: ["GPU Cluster", "Storage", "Network"],
      impacts: ["AI Training Service"],
      relatedAlarms: ["ALM-88433"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-PLATFORM-FAILOVER"],
      graphNeighbors: [
        { id: "ai-training-service", label: "AI Training Service", relation: "supports" },
        { id: "training-job-001", label: "Training-Job-001", relation: "schedules" },
      ],
    },
  },
  "ai-training-service": {
    id: "ai-training-service",
    label: "AI Training Service",
    zh: "AI 训练服务",
    kind: "service",
    role: "impacted",
    views: ["business", "knowledge"],
    details: {
      location: "Business Layer / AI Workloads",
      dependencies: ["AI Training Platform", "GPU-Server01"],
      impacts: ["Customer SLA", "Training Pipeline"],
      relatedAlarms: ["ALM-88434", "SLA-BREACH-001"],
      relatedIncidents: ["INC-20260820-0417"],
      relatedRunbooks: ["RB-SLA-NOTIFY", "RB-GPU-MIGRATE"],
      graphNeighbors: [
        { id: "ups-a01", label: "UPS-A01", relation: "impacted_by" },
        { id: "gpu-server01", label: "GPU-Server01", relation: "depends_on" },
      ],
    },
  },
  "utility-power": {
    id: "utility-power",
    label: "Utility Power",
    zh: "市电",
    kind: "utility",
    role: "healthy",
    views: ["power", "knowledge"],
    details: {
      location: "External Grid",
      dependencies: [],
      impacts: ["Transformer-01"],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [{ id: "transformer-01", label: "Transformer-01", relation: "feeds" }],
    },
  },
  "domain-network": {
    id: "domain-network",
    label: "Network Domain",
    zh: "网络域",
    kind: "domain",
    role: "healthy",
    views: ["spatial", "knowledge"],
    details: {
      location: "Building A / Floor 1 / Network Room",
      dependencies: ["Core Network"],
      impacts: ["GPU-Server01", "AI Training Platform"],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: ["RB-NET-FAILOVER"],
      graphNeighbors: [
        { id: "coresw-01", label: "CoreSW-01", relation: "contains" },
        { id: "gpu-server01", label: "GPU-Server01", relation: "connects" },
      ],
    },
  },
  "domain-storage": {
    id: "domain-storage",
    label: "Storage Domain",
    zh: "存储域",
    kind: "domain",
    role: "healthy",
    views: ["spatial", "knowledge"],
    details: {
      location: "Building A / Floor 1 / Storage Room",
      dependencies: ["SAN Fabric"],
      impacts: ["Training Job", "AI Training Service"],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: ["RB-SAN-CHK"],
      graphNeighbors: [
        { id: "san-01", label: "SAN-01", relation: "contains" },
        { id: "training-job-001", label: "Training-Job-001", relation: "serves" },
      ],
    },
  },
  "coresw-01": {
    id: "coresw-01",
    label: "CoreSW-01",
    zh: "核心交换机",
    kind: "switch",
    role: "healthy",
    views: ["knowledge"],
    details: {
      location: "Floor 1 / Network Room",
      dependencies: ["Network Backbone"],
      impacts: ["ToR Switch", "GPU-Server01"],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [{ id: "tor-sw-01", label: "ToR Switch", relation: "connects" }],
    },
  },
  "tor-sw-01": {
    id: "tor-sw-01",
    label: "ToR Switch",
    zh: "机架交换机",
    kind: "switch",
    role: "healthy",
    views: ["knowledge"],
    details: {
      location: "Floor 2 / Rack Row A",
      dependencies: ["CoreSW-01"],
      impacts: ["GPU-Server01"],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: [],
      graphNeighbors: [
        { id: "coresw-01", label: "CoreSW-01", relation: "uplink" },
        { id: "gpu-server01", label: "GPU-Server01", relation: "connects" },
      ],
    },
  },
  "san-01": {
    id: "san-01",
    label: "SAN-01",
    zh: "存储阵列",
    kind: "storage",
    role: "healthy",
    views: ["knowledge"],
    details: {
      location: "Floor 1 / Storage Room",
      dependencies: ["Storage Fabric"],
      impacts: ["GPU-Server01", "Training Job"],
      relatedAlarms: [],
      relatedIncidents: [],
      relatedRunbooks: ["RB-SAN-CHK"],
      graphNeighbors: [{ id: "gpu-server01", label: "GPU-Server01", relation: "serves" }],
    },
  },
}

export const kgEdges = [
  { from: "transformer-01", to: "ups-a01", label: "powers" },
  { from: "ups-a01", to: "pdu-a01", label: "supplies" },
  { from: "pdu-a01", to: "rack-a01", label: "powers" },
  { from: "rack-a01", to: "gpu-server01", label: "hosts" },
  { from: "gpu-server01", to: "vm-gpu-01", label: "runs" },
  { from: "vm-gpu-01", to: "training-job-001", label: "executes" },
  { from: "ai-training-platform", to: "training-job-001", label: "schedules" },
  { from: "ai-training-service", to: "ai-training-platform", label: "depends_on" },
  { from: "ups-a01", to: "ai-training-service", label: "impacts" },
  { from: "crah-01", to: "cold-aisle-a", label: "cools" },
  { from: "cold-aisle-a", to: "rack-a01", label: "contains" },
]

export const kgLayout: { id: string; x: number; y: number }[] = [
  { id: "transformer-01", x: 80, y: 30 },
  { id: "ups-a01", x: 80, y: 90 },
  { id: "pdu-a01", x: 220, y: 90 },
  { id: "rack-a01", x: 360, y: 90 },
  { id: "gpu-server01", x: 500, y: 90 },
  { id: "vm-gpu-01", x: 500, y: 170 },
  { id: "training-job-001", x: 640, y: 170 },
  { id: "ai-training-platform", x: 640, y: 90 },
  { id: "ai-training-service", x: 780, y: 90 },
  { id: "crah-01", x: 220, y: 170 },
  { id: "cold-aisle-a", x: 360, y: 170 },
]

export function impactStyles(role: ImpactRole) {
  switch (role) {
    case "root":
      return {
        row: "border-[var(--p1)]/50 bg-[var(--p1)]/8",
        badge: "bg-[var(--p1)]/15 text-[var(--p1)]",
        dot: "bg-[var(--p1)]",
      }
    case "impacted":
      return {
        row: "border-[var(--p2)]/50 bg-[var(--p2)]/8",
        badge: "bg-[var(--p2)]/15 text-[var(--p2)]",
        dot: "bg-[var(--p2)]",
      }
    default:
      return {
        row: "border-border bg-card",
        badge: "bg-primary/12 text-primary",
        dot: "bg-primary",
      }
  }
}

export function nodeVisibleInView(node: TwinExplorerNode, view: ExplorerView): boolean {
  if (view === "knowledge") return true
  return node.views.includes(view)
}

export function getParentId(id: string): string | null {
  const parent = Object.values(twinNodes).find((n) => n.children?.includes(id))
  return parent?.id ?? null
}

export function getAncestors(id: string): string[] {
  const path: string[] = []
  let current: string | null = id
  while (current) {
    const parent = getParentId(current)
    if (!parent) break
    path.unshift(parent)
    current = parent
  }
  return path
}

export function getBreadcrumb(id: string): TwinExplorerNode[] {
  return [...getAncestors(id), id].map((nid) => twinNodes[nid]).filter(Boolean)
}

/** Node or any descendant matches current view */
export function subtreeMatchesView(id: string, view: ExplorerView): boolean {
  const node = twinNodes[id]
  if (!node) return false
  if (node.kind === "domain") return nodeVisibleInView(node, view)
  if (nodeVisibleInView(node, view)) return true
  return (node.children ?? []).some((cid) => subtreeMatchesView(cid, view))
}

/** Domain internal topology chains — not flat device lists */
export type DomainTopology = {
  title: string
  subtitle: string
  chain: string[]
  impactPath?: string[]
}

export const domainTopologies: Record<string, DomainTopology> = {
  "domain-electrical": {
    title: "Electrical Domain Topology",
    subtitle: "供电链路 · Power Distribution Chain",
    chain: [
      "utility-power",
      "transformer-01",
      "ups-a01",
      "pdu-a01",
      "rack-a01",
      "gpu-server01",
      "ai-training-service",
    ],
    impactPath: ["ups-a01", "pdu-a01", "rack-a01", "gpu-server01", "ai-training-service"],
  },
  "domain-cooling": {
    title: "Cooling Domain Topology",
    subtitle: "制冷覆盖路径 · Cooling Coverage Chain",
    chain: ["ch-01", "pump-01", "crah-01", "cold-aisle-a", "rack-a01", "gpu-server01"],
    impactPath: ["cold-aisle-a", "rack-a01", "gpu-server01"],
  },
  "domain-network": {
    title: "Network Domain Topology",
    subtitle: "网络连接路径 · Network Path",
    chain: ["coresw-01", "tor-sw-01", "gpu-server01", "ai-training-platform"],
  },
  "domain-storage": {
    title: "Storage Domain Topology",
    subtitle: "存储服务路径 · Storage Service Chain",
    chain: ["san-01", "gpu-server01", "training-job-001", "ai-training-service"],
  },
  "domain-it": {
    title: "Business Domain Topology",
    subtitle: "业务服务路径 · Business Service Chain",
    chain: [
      "ai-training-service",
      "ai-training-platform",
      "training-job-001",
      "vm-gpu-01",
      "gpu-server01",
    ],
    impactPath: ["ai-training-service", "training-job-001", "vm-gpu-01", "gpu-server01"],
  },
}

export type SpatialContext = {
  building: string
  floor: string
  zone: string
  room: string
  rack: string
}

export const spatialContexts: Record<string, SpatialContext> = {
  "ups-a01": {
    building: "Building A",
    floor: "Floor 1",
    zone: "Power Zone A",
    room: "Electrical Room",
    rack: "—",
  },
  "pdu-a01": {
    building: "Building A",
    floor: "Floor 1",
    zone: "Power Zone A",
    room: "Electrical Room",
    rack: "—",
  },
  "rack-a01": {
    building: "Building A",
    floor: "Floor 2",
    zone: "Zone A",
    room: "Cold Aisle A",
    rack: "Rack-A01",
  },
  "gpu-server01": {
    building: "Building A",
    floor: "Floor 2",
    zone: "Zone A",
    room: "Cold Aisle A",
    rack: "Rack-A01",
  },
  "ai-training-service": {
    building: "Building A",
    floor: "Floor 2",
    zone: "IT Zone",
    room: "Platform Room",
    rack: "—",
  },
}

export const topologyContexts: Record<string, { upstream: string[]; downstream: string[] }> = {
  "ups-a01": {
    upstream: ["Utility Power", "Transformer-01"],
    downstream: ["PDU-A01", "Rack-A01", "GPU-Server01"],
  },
  "pdu-a01": {
    upstream: ["UPS-A01", "Transformer-01"],
    downstream: ["Rack-A01", "Rack-A02", "Rack-A03"],
  },
  "rack-a01": {
    upstream: ["PDU-A01", "Cold Aisle A"],
    downstream: ["GPU-Server01"],
  },
  "gpu-server01": {
    upstream: ["Rack-A01", "PDU-A01", "ToR Switch", "SAN-01"],
    downstream: ["VM-GPU-01", "Training-Job-001", "AI Training Service"],
  },
  "ai-training-service": {
    upstream: ["AI Training Platform", "GPU-Server01"],
    downstream: ["Customer SLA", "Training Pipeline"],
  },
}

export type CrossLayerItem = {
  layer: "Space" | "Topology" | "Business" | "Knowledge"
  id: string
  label: string
  role: ImpactRole
}

export const crossLayerChain: CrossLayerItem[] = [
  { layer: "Space", id: "building-a", label: "Building A", role: "impacted" },
  { layer: "Space", id: "floor-1", label: "Floor 1", role: "impacted" },
  { layer: "Topology", id: "ups-a01", label: "UPS-A01", role: "root" },
  { layer: "Topology", id: "pdu-a01", label: "PDU-A01", role: "impacted" },
  { layer: "Topology", id: "rack-a01", label: "Rack-A01", role: "impacted" },
  { layer: "Topology", id: "gpu-server01", label: "GPU-Server01", role: "impacted" },
  { layer: "Business", id: "ai-training-service", label: "AI Training Service", role: "impacted" },
  { layer: "Knowledge", id: "incident", label: "Incident INC-0417", role: "impacted" },
  { layer: "Knowledge", id: "knowledge-graph", label: "Knowledge Graph", role: "healthy" },
]

export const graphragExplainability: Record<
  string,
  {
    title: string
    factors: { label: string; detail: string }[]
    confidence: number
  }
> = {
  "ups-a01": {
    title: "为什么 UPS-A01 被判定为根因？",
    factors: [
      { label: "空间关系", detail: "位于 Building A / Floor 1 / Power Zone A，是 Power Zone A 唯一供电源头" },
      { label: "供电关系", detail: "下游 PDU-A01 → Rack-A01 → GPU 全部失电，传播链完整" },
      { label: "业务关系", detail: "AI Training Service SLA 违约时间与 UPS 故障时间完全对齐" },
      { label: "历史事件", detail: "匹配历史 UPS 电池故障模式库（相似度 94%）" },
      { label: "知识图谱关系", detail: "图谱中 UPS-A01 与 1,248 条告警中的 312 条存在 powered_by / supplies 关系" },
    ],
    confidence: 98,
  },
}

export const layeredDependencyColumns = [
  {
    key: "electrical",
    title: "供电依赖链",
    subtitle: "Electrical Dependency Chain",
    description: "展示电力如何支撑业务系统。",
    chain: domainTopologies["domain-electrical"].chain,
    impactPath: domainTopologies["domain-electrical"].impactPath ?? impactPathIds,
  },
  {
    key: "cooling",
    title: "制冷依赖链",
    subtitle: "Cooling Dependency Chain",
    description: "展示冷却能力如何支撑 GPU 集群。",
    chain: domainTopologies["domain-cooling"].chain,
    impactPath: domainTopologies["domain-cooling"].impactPath,
  },
  {
    key: "business",
    title: "业务依赖链",
    subtitle: "Business Dependency Chain",
    description: "展示业务服务如何运行在基础设施之上。",
    chain: domainTopologies["domain-it"].chain,
    impactPath: domainTopologies["domain-it"].impactPath,
  },
] as const

export function isDomainNode(id: string): boolean {
  return twinNodes[id]?.kind === "domain"
}

export function getNodeOrLabel(id: string): { label: string; zh: string; role: ImpactRole } {
  const n = twinNodes[id]
  if (n) return { label: n.label, zh: n.zh, role: n.role }
  if (id === "incident") return { label: "Incident INC-0417", zh: "故障事件", role: "impacted" }
  if (id === "knowledge-graph") return { label: "Knowledge Graph", zh: "知识图谱", role: "healthy" }
  return { label: id, zh: id, role: "healthy" }
}
