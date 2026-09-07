import type { ImpactChainNode, NodeStatus, ScenarioKey, ScenarioModel } from "@/data/scenarios/types"

export type ImpactTwinHop = {
  chainId: string
  twinIds: readonly string[]
  status: NodeStatus
  hop: number
  label: string
  sub: string
}

const CHAIN_TO_TWIN: Record<ScenarioKey, { chainId: string; twinIds: readonly string[] }[]> = {
  power: [
    { chainId: "ups", twinIds: ["ups"] },
    { chainId: "pdu", twinIds: ["pdu"] },
    { chainId: "rack", twinIds: ["rackA01", "rackA02", "rackA03"] },
    { chainId: "gpu", twinIds: ["gpu"] },
    { chainId: "service", twinIds: ["aiservice"] },
  ],
  cooling: [
    { chainId: "crac", twinIds: ["crah"] },
    { chainId: "zone", twinIds: ["aisleA"] },
    { chainId: "rack", twinIds: ["rackA01", "rackA02", "rackA03"] },
    { chainId: "gpu", twinIds: ["gpu"] },
    { chainId: "service", twinIds: ["aiservice"] },
  ],
  storage: [
    { chainId: "ctrl", twinIds: ["san"] },
    { chainId: "san", twinIds: ["san"] },
    { chainId: "volume", twinIds: ["gpu"] },
    { chainId: "job", twinIds: ["job"] },
    { chainId: "platform", twinIds: ["aiplatform"] },
  ],
  network: [
    { chainId: "core", twinIds: ["coresw"] },
    { chainId: "agg", twinIds: ["coresw"] },
    { chainId: "edge", twinIds: ["rackA01", "rackA02", "rackA03"] },
    { chainId: "gpu", twinIds: ["gpu"] },
    { chainId: "gateway", twinIds: ["aiservice"] },
  ],
}

export function getImpactTwinHops(scenario: ScenarioModel): ImpactTwinHop[] {
  const mapping = CHAIN_TO_TWIN[scenario.id]
  return mapping.map((item, index) => {
    const node = scenario.impactChain.find((chain) => chain.id === item.chainId)
    return {
      chainId: item.chainId,
      twinIds: item.twinIds,
      status: node?.status ?? (index === 0 ? "root" : "impacted"),
      hop: index + 1,
      label: node?.label ?? item.chainId,
      sub: node?.sub ?? "",
    }
  })
}

export function hopForTwin(twinId: string, hops: ImpactTwinHop[]): ImpactTwinHop | undefined {
  const matches = hops.filter((hop) => hop.twinIds.includes(twinId))
  return matches.find((hop) => hop.status === "root") ?? matches[0]
}

export function impactSpine(hops: ImpactTwinHop[]): { from: string; to: string }[] {
  const points: string[] = []
  for (const hop of hops) {
    const id = hop.twinIds[0]
    if (!id || points[points.length - 1] === id) continue
    points.push(id)
  }
  return points.slice(0, -1).map((from, index) => ({ from, to: points[index + 1]! }))
}

export function downstreamChainIds(hops: ImpactTwinHop[], selected: string | null): Set<string> | null {
  if (!selected) return null
  const start = hops.findIndex((hop) => hop.chainId === selected)
  if (start < 0) return null
  return new Set(hops.slice(start).map((hop) => hop.chainId))
}

export function impactChainSentence(nodes: ImpactChainNode[]): string {
  return nodes.map((node) => node.label).join(" → ")
}

function chainIdFromAlarm(hops: ImpactTwinHop[], alarm: { hop: number; family: string; device: string }): string {
  const byHop = hops[alarm.hop]
  if (byHop) return byHop.chainId
  const token = `${alarm.family} ${alarm.device}`.toLowerCase()
  const match = hops.find(
    (hop) => token.includes(hop.chainId) || token.includes(hop.label.toLowerCase()),
  )
  return match?.chainId ?? hops[0]?.chainId ?? hops[0]!.chainId
}

export type AlarmTwinLocation = {
  hops: ImpactTwinHop[]
  locationId: string
  activeHops: Set<string>
  path: { id: string; label: string }[]
  device: string
  sentence: string
}

export function locateAlarmOnTwin(
  scenario: ScenarioModel,
  alarm?: { hop: number; family: string; device: string } | null,
): AlarmTwinLocation {
  const hops = getImpactTwinHops(scenario)
  const locationId = alarm ? chainIdFromAlarm(hops, alarm) : (hops[0]?.chainId ?? "")
  const activeHops = downstreamChainIds(hops, locationId) ?? new Set(locationId ? [locationId] : [])
  const start = hops.findIndex((hop) => hop.chainId === locationId)
  const path = hops.slice(Math.max(0, start)).map((hop) => ({ id: hop.chainId, label: hop.label }))
  return {
    hops,
    locationId,
    activeHops,
    path,
    device: alarm?.device ?? scenario.incident.rootCause,
    sentence: path.map((node) => node.label).join(" → "),
  }
}
