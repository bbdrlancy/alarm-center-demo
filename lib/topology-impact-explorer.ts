import { buildEventEvolution, formatEvolutionClock, type EventEvolutionModel } from "@/lib/event-evolution"
import type { ScenarioKey, ScenarioModel } from "@/data/scenarios/types"

export type ImpactLayer = "site" | "physical" | "service" | "business"

export type ImpactNodeKind = "spine" | "upstream" | "downstream" | "related"

export type ImpactExplorerNode = {
  id: string
  chainId: string
  label: string
  labelZh: string
  layer: ImpactLayer
  kind: ImpactNodeKind
  /** Seconds from evolution origin when this node enters impact. */
  startSec: number
  detail: string
  detailZh: string
  site: string
  siteZh: string
  /** Relative order on the main propagation spine (0 = root). Related nodes use nearest spine index. */
  order: number
}

export type ImpactExplorerEdge = {
  id: string
  from: string
  to: string
  kind: "dependency" | "related"
}

export type ScopeBucketKey = "sites" | "assets" | "services" | "domains"

export type ScopeItem = {
  id: string
  label: string
  labelZh: string
  detail: string
  detailZh: string
}

export type ImpactScopeBucket = {
  key: ScopeBucketKey
  zh: string
  en: string
  items: ScopeItem[]
}

export type BlastRadius = {
  physical: number
  service: number
  business: number
  physicalLabel: string
  serviceLabel: string
  businessLabel: string
  summaryZh: string
  summaryEn: string
  reachedCount: number
  totalCount: number
}

export type TopologyImpactModel = {
  scenarioId: ScenarioKey
  originAbs: number
  endSec: number
  seedDefaults: string[]
  nodes: ImpactExplorerNode[]
  edges: ImpactExplorerEdge[]
  catalog: ImpactExplorerNode[]
}

type CatalogSeed = {
  id: string
  chainId: string
  label: string
  labelZh: string
  layer: ImpactLayer
  kind: ImpactNodeKind
  order: number
  detail: string
  detailZh: string
  site: string
  siteZh: string
  /** Fraction along timeline 0..1 for startSec when chain mapping missing. */
  phase: number
}

const CATALOGS: Record<ScenarioKey, CatalogSeed[]> = {
  power: [
    {
      id: "ups-a01",
      chainId: "ups",
      label: "UPS-A01",
      labelZh: "UPS-A01 供电单元",
      layer: "physical",
      kind: "spine",
      order: 0,
      detail: "Battery bank failure · bypass unavailable",
      detailZh: "电池组故障，旁路不可用",
      site: "Power Zone A",
      siteZh: "供电区 A",
      phase: 0,
    },
    {
      id: "pdu-a01",
      chainId: "pdu",
      label: "PDU-A01",
      labelZh: "PDU-A01 配电",
      layer: "physical",
      kind: "spine",
      order: 1,
      detail: "Input loss from UPS feed",
      detailZh: "UPS 馈电中断导致失电",
      site: "Power Zone A",
      siteZh: "供电区 A",
      phase: 0.25,
    },
    {
      id: "rack-a01",
      chainId: "rack",
      label: "Rack-A01",
      labelZh: "Rack-A01 机架",
      layer: "physical",
      kind: "spine",
      order: 2,
      detail: "Rack power bus down",
      detailZh: "机架供电母线掉电",
      site: "Hall A · Row 1",
      siteZh: "机房 A · 1 排",
      phase: 0.45,
    },
    {
      id: "gpu-cluster",
      chainId: "gpu",
      label: "GPU Cluster",
      labelZh: "GPU 集群",
      layer: "service",
      kind: "spine",
      order: 3,
      detail: "84 GPU servers offline",
      detailZh: "84 台 GPU 服务器离线",
      site: "Hall A · Compute",
      siteZh: "机房 A · 计算区",
      phase: 0.7,
    },
    {
      id: "training-service",
      chainId: "service",
      label: "Training Service",
      labelZh: "训练服务",
      layer: "business",
      kind: "spine",
      order: 4,
      detail: "AI training jobs interrupted",
      detailZh: "AI 训练任务中断",
      site: "Business Domain",
      siteZh: "业务域",
      phase: 0.9,
    },
    {
      id: "bypass-sw",
      chainId: "ups",
      label: "Bypass Switch",
      labelZh: "旁路开关",
      layer: "physical",
      kind: "related",
      order: 0,
      detail: "Failed to take load",
      detailZh: "未能接管负载",
      site: "Power Zone A",
      siteZh: "供电区 A",
      phase: 0.05,
    },
    {
      id: "pdu-a02",
      chainId: "pdu",
      label: "PDU-A02",
      labelZh: "PDU-A02",
      layer: "physical",
      kind: "related",
      order: 1,
      detail: "Sibling feed on same UPS",
      detailZh: "同 UPS 并列馈电",
      site: "Power Zone A",
      siteZh: "供电区 A",
      phase: 0.28,
    },
    {
      id: "cooling-companion",
      chainId: "rack",
      label: "CRAC Companion Zone",
      labelZh: "伴生制冷区",
      layer: "physical",
      kind: "related",
      order: 2,
      detail: "Thermal risk rises after power loss",
      detailZh: "断电后热风险上升",
      site: "Cold Aisle A",
      siteZh: "冷通道 A",
      phase: 0.55,
    },
  ],
  cooling: [
    {
      id: "crac-a02",
      chainId: "crac",
      label: "CRAC-A02",
      labelZh: "CRAC-A02 空调",
      layer: "physical",
      kind: "spine",
      order: 0,
      detail: "Compressor trip · cooling output zero",
      detailZh: "压缩机跳闸，冷量归零",
      site: "Cooling Plant A",
      siteZh: "制冷机房 A",
      phase: 0,
    },
    {
      id: "cold-aisle",
      chainId: "zone",
      label: "Cold Aisle A",
      labelZh: "冷通道 A",
      layer: "physical",
      kind: "spine",
      order: 1,
      detail: "Inlet temp 24°C → 38°C",
      detailZh: "进风温度 24°C → 38°C",
      site: "Hall B",
      siteZh: "机房 B",
      phase: 0.25,
    },
    {
      id: "rack-cluster-b",
      chainId: "rack",
      label: "Rack Cluster B",
      labelZh: "机架簇 B",
      layer: "physical",
      kind: "spine",
      order: 2,
      detail: "16 racks over thermal threshold",
      detailZh: "16 台机架超温",
      site: "Hall B · Row B",
      siteZh: "机房 B · B 排",
      phase: 0.45,
    },
    {
      id: "gpu-nodes",
      chainId: "gpu",
      label: "GPU Node Pool",
      labelZh: "GPU 节点池",
      layer: "service",
      kind: "spine",
      order: 3,
      detail: "256 GPUs thermal throttle",
      detailZh: "256 张 GPU 热降频",
      site: "Hall B · Compute",
      siteZh: "机房 B · 计算区",
      phase: 0.7,
    },
    {
      id: "training-cluster-b",
      chainId: "service",
      label: "Training Cluster B",
      labelZh: "训练集群 B",
      layer: "business",
      kind: "spine",
      order: 4,
      detail: "Jobs paused by thermal protection",
      detailZh: "热保护导致作业暂停",
      site: "Business Domain",
      siteZh: "业务域",
      phase: 0.9,
    },
    {
      id: "crac-a01",
      chainId: "crac",
      label: "CRAC-A01 Backup",
      labelZh: "CRAC-A01 备份",
      layer: "physical",
      kind: "related",
      order: 0,
      detail: "Standby unit available for switchover",
      detailZh: "可用作切换备份",
      site: "Cooling Plant A",
      siteZh: "制冷机房 A",
      phase: 0.1,
    },
    {
      id: "temp-sensor",
      chainId: "zone",
      label: "Aisle Temp Sensors",
      labelZh: "通道温感",
      layer: "physical",
      kind: "related",
      order: 1,
      detail: "Sensor cluster confirms cascade",
      detailZh: "传感器簇确认温升传播",
      site: "Hall B",
      siteZh: "机房 B",
      phase: 0.3,
    },
  ],
  storage: [
    {
      id: "ctrl-ab",
      chainId: "ctrl",
      label: "Storage Ctrl-A/B",
      labelZh: "存储双控",
      layer: "physical",
      kind: "spine",
      order: 0,
      detail: "Heartbeat lost · failover incomplete",
      detailZh: "心跳丢失，failover 未完成",
      site: "Storage Room 2",
      siteZh: "存储机房 2",
      phase: 0,
    },
    {
      id: "san-zone2",
      chainId: "san",
      label: "SAN Fabric Zone 2",
      labelZh: "SAN 交换区 2",
      layer: "physical",
      kind: "spine",
      order: 1,
      detail: "Retry storm on fabric",
      detailZh: "交换区出现重试风暴",
      site: "Storage Room 2",
      siteZh: "存储机房 2",
      phase: 0.25,
    },
    {
      id: "dataset-volume",
      chainId: "volume",
      label: "Dataset Volume",
      labelZh: "数据集卷",
      layer: "service",
      kind: "spine",
      order: 2,
      detail: "120 TB volume degraded",
      detailZh: "120 TB 卷进入降级",
      site: "Storage Pool",
      siteZh: "存储池",
      phase: 0.5,
    },
    {
      id: "training-job",
      chainId: "job",
      label: "Training Job-8842",
      labelZh: "训练作业 8842",
      layer: "service",
      kind: "spine",
      order: 3,
      detail: "Checkpoint interrupted",
      detailZh: "Checkpoint 中断",
      site: "Compute Fabric",
      siteZh: "计算网络",
      phase: 0.7,
    },
    {
      id: "dataset-service",
      chainId: "platform",
      label: "Dataset Service",
      labelZh: "数据集服务",
      layer: "business",
      kind: "spine",
      order: 4,
      detail: "Read/write SLA breach",
      detailZh: "读写 SLA 违约",
      site: "Business Domain",
      siteZh: "业务域",
      phase: 0.9,
    },
    {
      id: "mirror-path",
      chainId: "san",
      label: "Mirror Path B",
      labelZh: "镜像路径 B",
      layer: "physical",
      kind: "related",
      order: 1,
      detail: "Secondary path saturated",
      detailZh: "次路径饱和",
      site: "Storage Room 2",
      siteZh: "存储机房 2",
      phase: 0.35,
    },
  ],
  network: [
    {
      id: "sw-core-02",
      chainId: "core",
      label: "SW-CORE-02",
      labelZh: "核心交换机",
      layer: "physical",
      kind: "spine",
      order: 0,
      detail: "Control plane unreachable",
      detailZh: "控制平面不可达",
      site: "Network Core Room",
      siteZh: "核心网络机房",
      phase: 0,
    },
    {
      id: "sw-agg-04",
      chainId: "agg",
      label: "SW-AGG-04",
      labelZh: "汇聚交换机",
      layer: "physical",
      kind: "spine",
      order: 1,
      detail: "BGP flap / reconvergence delay",
      detailZh: "BGP 震荡，收敛延迟",
      site: "Network Core Room",
      siteZh: "核心网络机房",
      phase: 0.2,
    },
    {
      id: "tor-edge",
      chainId: "edge",
      label: "Top-of-Rack",
      labelZh: "机架顶交换机",
      layer: "physical",
      kind: "spine",
      order: 2,
      detail: "East-west path interrupted",
      detailZh: "东西向路径中断",
      site: "Hall C",
      siteZh: "机房 C",
      phase: 0.4,
    },
    {
      id: "gpu-net",
      chainId: "gpu",
      label: "GPU Cluster Net",
      labelZh: "GPU 集群网络",
      layer: "service",
      kind: "spine",
      order: 3,
      detail: "32 servers briefly isolated",
      detailZh: "32 台服务器短暂隔离",
      site: "Hall C · Compute",
      siteZh: "机房 C · 计算区",
      phase: 0.65,
    },
    {
      id: "ai-gateway",
      chainId: "gateway",
      label: "AI Gateway",
      labelZh: "AI 网关",
      layer: "business",
      kind: "spine",
      order: 4,
      detail: "API 503 spike then recover",
      detailZh: "API 503 飙升后恢复",
      site: "Business Domain",
      siteZh: "业务域",
      phase: 0.85,
    },
    {
      id: "redundant-path",
      chainId: "agg",
      label: "Redundant Path A",
      labelZh: "冗余路径 A",
      layer: "physical",
      kind: "related",
      order: 1,
      detail: "Took over after core failure",
      detailZh: "核心故障后接管流量",
      site: "Network Core Room",
      siteZh: "核心网络机房",
      phase: 0.5,
    },
  ],
}

function chainStartSec(evolution: EventEvolutionModel, chainId: string, phase: number): number {
  const bar = evolution.lifecycle.find((item) => item.chainId === chainId)
  if (bar) return bar.startSec
  return Math.round(evolution.endSec * phase)
}

export function buildTopologyImpactModel(scenario: ScenarioModel): TopologyImpactModel {
  const evolution = buildEventEvolution(scenario)
  const seeds = CATALOGS[scenario.id]
  const nodes: ImpactExplorerNode[] = seeds.map((seed) => ({
    id: seed.id,
    chainId: seed.chainId,
    label: seed.label,
    labelZh: seed.labelZh,
    layer: seed.layer,
    kind: seed.kind,
    startSec: chainStartSec(evolution, seed.chainId, seed.phase),
    detail: seed.detail,
    detailZh: seed.detailZh,
    site: seed.site,
    siteZh: seed.siteZh,
    order: seed.order,
  }))

  const spine = nodes.filter((n) => n.kind === "spine").sort((a, b) => a.order - b.order)
  const edges: ImpactExplorerEdge[] = []
  for (let i = 0; i < spine.length - 1; i++) {
    edges.push({
      id: `${spine[i]!.id}->${spine[i + 1]!.id}`,
      from: spine[i]!.id,
      to: spine[i + 1]!.id,
      kind: "dependency",
    })
  }
  for (const related of nodes.filter((n) => n.kind === "related")) {
    const anchor =
      spine.find((n) => n.chainId === related.chainId) ??
      spine.find((n) => n.order === related.order) ??
      spine[0]
    if (!anchor) continue
    edges.push({
      id: `${anchor.id}~${related.id}`,
      from: anchor.id,
      to: related.id,
      kind: "related",
    })
  }

  return {
    scenarioId: scenario.id,
    originAbs: evolution.originAbs,
    endSec: evolution.endSec,
    seedDefaults: spine.map((n) => n.id),
    nodes,
    edges,
    catalog: nodes,
  }
}

export function formatImpactClock(originAbs: number, cursorSec: number) {
  return formatEvolutionClock(originAbs + cursorSec)
}

export function exploreFromSeed(
  model: TopologyImpactModel,
  seedId: string,
  visibleIds: Set<string>,
): {
  seed: ImpactExplorerNode
  upstream: ImpactExplorerNode[]
  downstream: ImpactExplorerNode[]
  path: ImpactExplorerNode[]
  visible: ImpactExplorerNode[]
  edges: ImpactExplorerEdge[]
} {
  const seed = model.nodes.find((n) => n.id === seedId) ?? model.nodes[0]!
  const spine = model.nodes.filter((n) => n.kind === "spine").sort((a, b) => a.order - b.order)
  const seedOrder = seed.order
  const upstream = spine.filter((n) => n.order < seedOrder && visibleIds.has(n.id))
  const downstream = spine.filter((n) => n.order > seedOrder && visibleIds.has(n.id))
  const path = [
    ...upstream,
    ...(visibleIds.has(seed.id) ? [seed] : []),
    ...downstream,
  ].filter((n, i, arr) => arr.findIndex((x) => x.id === n.id) === i)

  const relatedVisible = model.nodes.filter((n) => n.kind === "related" && visibleIds.has(n.id))
  const visible = [...path, ...relatedVisible]
  const idSet = new Set(visible.map((n) => n.id))
  const edges = model.edges.filter((e) => idSet.has(e.from) && idSet.has(e.to))

  return { seed, upstream, downstream, path, visible, edges }
}

export function impactAtCursor(
  model: TopologyImpactModel,
  seedId: string,
  visibleIds: Set<string>,
  cursorSec: number,
): {
  reached: ImpactExplorerNode[]
  pending: ImpactExplorerNode[]
  scope: ImpactScopeBucket[]
  blast: BlastRadius
  frontier: ImpactExplorerNode | null
} {
  const { visible } = exploreFromSeed(model, seedId, visibleIds)
  const reached = visible.filter((n) => n.startSec <= cursorSec).sort((a, b) => a.startSec - b.startSec)
  const pending = visible.filter((n) => n.startSec > cursorSec).sort((a, b) => a.startSec - b.startSec)
  const frontier = reached[reached.length - 1] ?? null

  const siteMap = new Map<string, ScopeItem>()
  const assetItems: ScopeItem[] = []
  const serviceItems: ScopeItem[] = []
  const domainItems: ScopeItem[] = []

  for (const node of reached) {
    if (!siteMap.has(node.site)) {
      siteMap.set(node.site, {
        id: `site-${node.site}`,
        label: node.site,
        labelZh: node.siteZh,
        detail: `Impact reached at T+${Math.round(node.startSec)}s`,
        detailZh: `在 T+${Math.round(node.startSec)}s 进入影响范围`,
      })
    }
    const item: ScopeItem = {
      id: node.id,
      label: node.label,
      labelZh: node.labelZh,
      detail: node.detail,
      detailZh: node.detailZh,
    }
    if (node.layer === "physical" || node.layer === "site") assetItems.push(item)
    if (node.layer === "service") serviceItems.push(item)
    if (node.layer === "business") domainItems.push(item)
  }

  const scope: ImpactScopeBucket[] = [
    { key: "sites", zh: "受影响站点", en: "Affected Sites", items: [...siteMap.values()] },
    { key: "assets", zh: "受影响资产", en: "Affected Assets", items: assetItems },
    { key: "services", zh: "受影响服务", en: "Affected Services", items: serviceItems },
    { key: "domains", zh: "受影响业务域", en: "Affected Business Domains", items: domainItems },
  ]

  const physicalNodes = visible.filter((n) => n.layer === "physical" || n.layer === "site")
  const serviceNodes = visible.filter((n) => n.layer === "service")
  const businessNodes = visible.filter((n) => n.layer === "business")
  const physHit = physicalNodes.filter((n) => n.startSec <= cursorSec).length
  const svcHit = serviceNodes.filter((n) => n.startSec <= cursorSec).length
  const bizHit = businessNodes.filter((n) => n.startSec <= cursorSec).length
  const pct = (hit: number, total: number) => (total === 0 ? 0 : Math.round((hit / total) * 100))

  const physical = pct(physHit, physicalNodes.length)
  const service = pct(svcHit, serviceNodes.length)
  const business = pct(bizHit, businessNodes.length)

  let summaryZh = "影响尚未扩散"
  let summaryEn = "Impact has not expanded yet"
  if (business > 0) {
    summaryZh = "已穿透到业务层，Blast Radius 最大"
    summaryEn = "Blast radius reached business layer"
  } else if (service > 0) {
    summaryZh = "已影响服务层，业务风险上升"
    summaryEn = "Service layer impacted · business risk rising"
  } else if (physical > 0) {
    summaryZh = "影响仍在物理层，尚未到达业务"
    summaryEn = "Impact contained in physical layer"
  }

  return {
    reached,
    pending,
    scope,
    blast: {
      physical,
      service,
      business,
      physicalLabel: `${physHit}/${physicalNodes.length || 0}`,
      serviceLabel: `${svcHit}/${serviceNodes.length || 0}`,
      businessLabel: `${bizHit}/${businessNodes.length || 0}`,
      summaryZh,
      summaryEn,
      reachedCount: reached.length,
      totalCount: visible.length,
    },
    frontier,
  }
}

export function candidatesToAdd(
  model: TopologyImpactModel,
  seedId: string,
  visibleIds: Set<string>,
): { upstream: ImpactExplorerNode[]; downstream: ImpactExplorerNode[]; related: ImpactExplorerNode[] } {
  const seed = model.nodes.find((n) => n.id === seedId) ?? model.nodes[0]!
  const spine = model.nodes.filter((n) => n.kind === "spine")
  return {
    upstream: spine.filter((n) => n.order < seed.order && !visibleIds.has(n.id)),
    downstream: spine.filter((n) => n.order > seed.order && !visibleIds.has(n.id)),
    related: model.nodes.filter((n) => n.kind === "related" && !visibleIds.has(n.id)),
  }
}

export function defaultVisibleIds(model: TopologyImpactModel, seedId: string): string[] {
  const seed = model.nodes.find((n) => n.id === seedId) ?? model.nodes[0]!
  // Default explore: full spine path so Sankey shows complete blast path from seed perspective.
  return model.nodes.filter((n) => n.kind === "spine" || n.id === seed.id).map((n) => n.id)
}

export const LAYER_META: Record<ImpactLayer, { zh: string; en: string; color: string }> = {
  site: { zh: "站点", en: "Site", color: "#64748b" },
  physical: { zh: "物理", en: "Physical", color: "#e53935" },
  service: { zh: "服务", en: "Service", color: "#fb8c00" },
  business: { zh: "业务", en: "Business", color: "#3dcd58" },
}
