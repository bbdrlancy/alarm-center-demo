import { buildConvergenceFlow, type TaggedAlarm } from "@/lib/alarm-convergence"
import { getCommandIncident } from "@/lib/incident-command"
import { getImpactTwinHops, type ImpactTwinHop } from "@/lib/impact-twin"
import { getInvestigationWorkbench, type CheckResult } from "@/lib/manual-investigation-data"
import type { ScenarioModel } from "@/data/scenarios/types"

export type EvolutionLayer = "physical" | "convergence" | "reasoning" | "investigation"

export type AlarmSample = {
  time: string
  title: string
  device: string
  code: string
}

export type ConvergenceExpand = {
  kind: "storm" | "correlation" | "root"
  fromCount: number
  toCount: number
  samples: AlarmSample[]
  moreCount: number
  collapsedBy: string[]
  resultLabel: string
  resultLabelZh: string
  candidateEvents?: string[]
  candidateCauses?: string[]
  rootCause?: string
  rootCauseZh?: string
}

export type PhysicalExpand = {
  rawAlarms: string[]
  aggregatedEvents: string[]
  affectedAssets: string[]
  relatedEvidence: string[]
}

export type ReasoningExpand = {
  confidence?: number
  detail: string
  evidence: string[]
}

export type InvestigationExpand = {
  status: CheckResult
  finding: string
  nextAction: string
}

export type EvolutionNode = {
  id: string
  layer: EvolutionLayer
  time: string
  t0: number
  title: string
  titleZh: string
  badge?: string
  badgeZh?: string
  summary: string
  summaryZh: string
  chainId?: string
  twinIds?: readonly string[]
  physical?: PhysicalExpand
  convergence?: ConvergenceExpand
  reasoning?: ReasoningExpand
  investigation?: InvestigationExpand
}

export type LifecycleBar = {
  id: string
  label: string
  labelZh: string
  startSec: number
  endSec: number
  durationMin: number
  chainId: string
  twinIds: readonly string[]
  isRoot: boolean
}

export type AlarmClass = "root" | "supporting" | "filtered"

export type DeviceAlarmBar = {
  id: string
  code: string
  message: string
  device: string
  time: string
  t0: number
  durationSec: number
  classification: AlarmClass
  role: string
  groupCode?: string
  rules: string[]
  filterReason?: string
}

export type ConvergenceStageDetail = {
  id: string
  title: string
  titleZh: string
  count: number
  countLabel: string
  rules: string[]
  items: string[]
  filterReasons: string[]
}

export type EvidenceTraceStep = {
  id: string
  kind: "raw" | "group" | "candidate" | "root"
  label: string
  labelZh: string
  detail: string
}

export type DeviceLifecycleDetail = {
  chainId: string
  label: string
  alarms: DeviceAlarmBar[]
  convergence: ConvergenceStageDetail[]
  evidenceTrace: EvidenceTraceStep[]
}

export const ALARM_CLASS_META: Record<
  AlarmClass,
  { en: string; zh: string; color: string; bar: string }
> = {
  root: { en: "Root Cause Evidence", zh: "根因证据", color: "#e53935", bar: "bg-[#e53935]" },
  supporting: { en: "Supporting Evidence", zh: "支撑证据", color: "#c9a227", bar: "bg-[#c9a227]" },
  filtered: { en: "Filtered Alarm", zh: "已过滤告警", color: "#94a3b8", bar: "bg-slate-400" },
}

export type TopologyAssetOption = {
  chainId: string
  label: string
  labelZh: string
  twinIds: readonly string[]
  kind: "upstream" | "downstream" | "related"
  recommended: boolean
}

export type EventEvolutionModel = {
  startSec: number
  endSec: number
  originClock: string
  originAbs: number
  physical: EvolutionNode[]
  convergence: EvolutionNode[]
  reasoning: EvolutionNode[]
  investigation: EvolutionNode[]
  lifecycle: LifecycleBar[]
  deviceDetails: Record<string, DeviceLifecycleDetail>
  hops: ImpactTwinHop[]
  defaultChainIds: string[]
  topologyCatalog: TopologyAssetOption[]
  recommendations: TopologyAssetOption[]
  conclusion: string
  rootCause: string
  rootCauseZh: string
}

function parseClock(time: string): number {
  const [h = "0", m = "0", s = "0"] = time.split(":")
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

export function formatEvolutionClock(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function clockAt(originAbs: number, t0: number): string {
  return formatEvolutionClock(originAbs + t0)
}

function alarmSample(alarm: TaggedAlarm): AlarmSample {
  return {
    time: alarm.timestamp.slice(0, 8),
    title: alarm.message,
    device: alarm.device,
    code: alarm.code,
  }
}

export function buildEventEvolution(scenario: ScenarioModel): EventEvolutionModel {
  const flow = buildConvergenceFlow(scenario)
  const workbench = getInvestigationWorkbench(scenario)
  const command = getCommandIncident(scenario.id)
  const hops = getImpactTwinHops(scenario)
  const rawEvents = scenario.timeline.events
  const originAbs = parseClock(rawEvents[0]?.time ?? `${scenario.incident.startTime}:00`)
  const times = rawEvents.map((event) => parseClock(event.time))
  const lastAbs = times[times.length - 1] ?? originAbs
  const span = Math.max(lastAbs - originAbs, 60)

  const sortedRaw = [...flow.rawAlarms].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  const physical: EvolutionNode[] = rawEvents.map((event, index) => {
    const hop = hops[Math.min(index, hops.length - 1)]!
    const chain = scenario.impactChain[Math.min(index, scenario.impactChain.length - 1)]!
    const t0 = (times[index] ?? originAbs) - originAbs
    const isRoot = index === 0
    const isBiz = index === rawEvents.length - 1
    return {
      id: `phy-${scenario.id}-${index}`,
      layer: "physical" as const,
      time: event.time,
      t0,
      title: event.title,
      titleZh: event.zh,
      badge: isRoot ? "ROOT CAUSE" : isBiz ? "BUSINESS IMPACT" : undefined,
      badgeZh: isRoot ? "根因" : isBiz ? "业务影响" : undefined,
      summary: event.detail,
      summaryZh: event.detail,
      chainId: hop.chainId,
      twinIds: hop.twinIds,
      physical: {
        rawAlarms: sortedRaw
          .filter((a) => a.hop === hop.hop || (isRoot && a.role === "root-symptom"))
          .slice(0, 5)
          .map((a) => `${a.timestamp.slice(0, 8)} · ${a.device} · ${a.code}`),
        aggregatedEvents: flow.aggregationGroups.slice(0, 4).map((g) => `${g.code} ×${g.count}`),
        affectedAssets: [chain.label, chain.sub, `${command.impact.devices} devices`],
        relatedEvidence: scenario.graph.graphrag.factors.slice(0, 3).map((f) => `${f.label}: ${f.detail}`),
      },
    }
  })

  const cluster = flow.stages.find((s) => s.key === "cluster")!
  const topology = flow.stages.find((s) => s.key === "topology")!
  const causal = flow.stages.find((s) => s.key === "causal")!

  const stormSamples = sortedRaw.slice(0, 6).map(alarmSample)
  const convergence: EvolutionNode[] = [
    {
      id: `conv-${scenario.id}-storm`,
      layer: "convergence",
      time: clockAt(originAbs, Math.round(span * 0.08)),
      t0: Math.round(span * 0.08),
      title: "Storm Collapse",
      titleZh: "告警风暴坍缩",
      badge: `${cluster.input} → ${cluster.output}`,
      summary: `Collapsed By Storm Collapse · Pattern Match · Topology Merge`,
      summaryZh: `合并重复告警，形成 ${cluster.output} 个告警组`,
      chainId: hops[0]?.chainId,
      twinIds: hops[0]?.twinIds,
      convergence: {
        kind: "storm",
        fromCount: cluster.input,
        toCount: cluster.output,
        samples: stormSamples,
        moreCount: Math.max(0, cluster.input - stormSamples.length),
        collapsedBy: ["Storm Collapse", "Pattern Match", "Topology Merge"],
        resultLabel: `${cluster.output} Alarm Groups`,
        resultLabelZh: `${cluster.output} 个告警组`,
      },
    },
    {
      id: `conv-${scenario.id}-corr`,
      layer: "convergence",
      time: clockAt(originAbs, Math.round(span * 0.45)),
      t0: Math.round(span * 0.45),
      title: "Correlation Analysis",
      titleZh: "关联分析",
      badge: `${topology.input} → ${topology.output}`,
      summary: `Grouped into candidate causes`,
      summaryZh: `候选事件归并为候选根因`,
      chainId: hops[0]?.chainId,
      twinIds: hops[0]?.twinIds,
      convergence: {
        kind: "correlation",
        fromCount: topology.input,
        toCount: topology.output,
        samples: flow.aggregationGroups.slice(0, 6).map((g) => ({
          time: g.members[0]?.timestamp.slice(0, 8) ?? "—",
          title: g.code,
          device: g.members[0]?.device ?? g.family,
          code: `${g.count} alarms`,
        })),
        moreCount: Math.max(0, topology.input - 6),
        collapsedBy: ["Dependency Hop", "Temporal Window", "Spatial Scope"],
        resultLabel: `${topology.output} Candidate Causes`,
        resultLabelZh: `${topology.output} 个候选根因`,
        candidateEvents: flow.aggregationGroups.slice(0, 6).map((g) => `${g.code} · ${g.count}`),
        candidateCauses: workbench.candidates.map((c) => c.nameZh),
      },
    },
    {
      id: `conv-${scenario.id}-rca`,
      layer: "convergence",
      time: clockAt(originAbs, Math.round(span * 0.72)),
      t0: Math.round(span * 0.72),
      title: "Root Cause Analysis",
      titleZh: "根因分析",
      badge: `${causal.input} → ${causal.output}`,
      summary: `Locked ${scenario.incident.rootCause}`,
      summaryZh: `锁定 ${scenario.incident.rootCauseZh}`,
      chainId: hops[0]?.chainId,
      twinIds: hops[0]?.twinIds,
      convergence: {
        kind: "root",
        fromCount: causal.input,
        toCount: causal.output,
        samples: workbench.candidates.slice(0, 5).map((c, i) => ({
          time: clockAt(originAbs, Math.round(span * (0.55 + i * 0.03))),
          title: c.name,
          device: c.nameZh,
          code: `${c.confidence}%`,
        })),
        moreCount: 0,
        collapsedBy: ["Earliest Source", "Cascade Coverage", "Historical Pattern"],
        resultLabel: `1 Root Cause`,
        resultLabelZh: `1 个根因`,
        candidateCauses: workbench.candidates.map((c) => `${c.nameZh} (${c.confidence}%)`),
        rootCause: scenario.incident.rootCause,
        rootCauseZh: scenario.incident.rootCauseZh,
      },
    },
  ]

  const reasoningDefs = [
    {
      id: "earliest",
      title: "Earliest Event Found",
      titleZh: "发现最早事件",
      frac: 0.12,
      detail: `Earliest symptom at ${rawEvents[0]?.time ?? "—"}`,
      evidence: sortedRaw.filter((a) => a.role === "root-symptom").slice(0, 3).map((a) => `${a.timestamp.slice(0, 8)} ${a.code}`),
    },
    {
      id: "direction",
      title: "Propagation Direction Matched",
      titleZh: "传播方向匹配",
      frac: 0.35,
      detail: scenario.impactChain.map((n) => n.label).join(" → "),
      evidence: scenario.impactChain.map((n) => `${n.label} · ${n.sub}`),
    },
    {
      id: "topology",
      title: "Topology Match",
      titleZh: "拓扑匹配",
      frac: 0.5,
      detail: scenario.graph.graphrag.factors.find((f) => /topology|spatial|chain|thermal|power/i.test(f.label))?.detail
        ?? scenario.graph.conclusion,
      evidence: scenario.graph.edges.map((e) => `${e.source} —${e.relation}→ ${e.target}`),
      confidence: scenario.incident.confidence,
    },
    {
      id: "history",
      title: "Historical Similarity",
      titleZh: "历史相似度",
      frac: 0.62,
      detail: scenario.graph.graphrag.factors.find((f) => /historical|pattern/i.test(f.label))?.detail
        ?? `Pattern library match for ${scenario.domain}`,
      evidence: workbench.candidates[0]?.historicalCases.slice(0, 3) ?? [],
      confidence: workbench.candidates[0]?.historicalSimilarity,
    },
    {
      id: "locked",
      title: "Root Cause Locked",
      titleZh: "根因已锁定",
      frac: 0.78,
      detail: scenario.incident.rcaSummary,
      evidence: scenario.graph.graphrag.factors.map((f) => f.label),
      confidence: scenario.incident.confidence,
    },
  ]

  const reasoning: EvolutionNode[] = reasoningDefs.map((def) => ({
    id: `reason-${scenario.id}-${def.id}`,
    layer: "reasoning" as const,
    time: clockAt(originAbs, Math.round(span * def.frac)),
    t0: Math.round(span * def.frac),
    title: def.title,
    titleZh: def.titleZh,
    badge: def.confidence != null ? `${def.confidence}%` : undefined,
    summary: def.detail,
    summaryZh: def.detail,
    chainId: hops[0]?.chainId,
    twinIds: hops[0]?.twinIds,
    reasoning: {
      confidence: def.confidence,
      detail: def.detail,
      evidence: def.evidence,
    },
  }))

  const investigation: EvolutionNode[] = workbench.steps.map((step, index) => {
    const t0 = Math.round((span * (index + 1)) / (workbench.steps.length + 1))
    return {
      id: `inv-${step.id}`,
      layer: "investigation" as const,
      time: clockAt(originAbs, t0),
      t0,
      title: step.stepEn,
      titleZh: step.stepZh,
      badge: step.status === "confirmed" ? "Confirmed" : step.status === "pending" ? "Pending" : "Next",
      badgeZh: step.status === "confirmed" ? "已确认" : step.status === "pending" ? "待核验" : "下一步",
      summary: step.finding,
      summaryZh: step.finding,
      investigation: {
        status: step.status,
        finding: step.finding,
        nextAction: step.nextAction,
      },
    }
  })

  const endSec = Math.max(
    span + 60,
    ...physical.map((n) => n.t0),
    ...convergence.map((n) => n.t0),
    ...reasoning.map((n) => n.t0),
    ...investigation.map((n) => n.t0),
  )

  const lifecycle: LifecycleBar[] = hops.map((hop, index) => {
    const startSec = physical[Math.min(index, physical.length - 1)]?.t0 ?? Math.round((span * index) / hops.length)
    const endSecBar = Math.min(endSec, Math.max(startSec + 45, endSec - (hops.length - 1 - index) * 18))
    const chain = scenario.impactChain.find((c) => c.id === hop.chainId)
    return {
      id: `life-${hop.chainId}`,
      label: hop.label,
      labelZh: chain?.sub ?? hop.sub,
      startSec,
      endSec: endSecBar,
      durationMin: Math.max(1, Math.round((endSecBar - startSec) / 60)),
      chainId: hop.chainId,
      twinIds: hop.twinIds,
      isRoot: hop.status === "root",
    }
  })

  const topologyCatalog: TopologyAssetOption[] = hops.map((hop, index) => {
    const chain = scenario.impactChain.find((c) => c.id === hop.chainId)
    return {
      chainId: hop.chainId,
      label: hop.label,
      labelZh: chain?.sub ?? hop.sub,
      twinIds: hop.twinIds,
      kind: index === 0 ? "related" : "downstream",
      recommended: index > 0 && index <= 3,
    }
  })

  const recommendations = topologyCatalog.filter((item) => item.recommended)

  const deviceDetails: Record<string, DeviceLifecycleDetail> = {}
  for (const hop of hops) {
    deviceDetails[hop.chainId] = buildDeviceLifecycleDetail({
      scenario,
      hop,
      hops,
      flow,
      workbench,
      originAbs,
      endSec,
      bar: lifecycle.find((b) => b.chainId === hop.chainId)!,
    })
  }

  return {
    startSec: 0,
    endSec,
    originClock: rawEvents[0]?.time ?? `${scenario.incident.startTime}:00`,
    originAbs,
    physical,
    convergence,
    reasoning,
    investigation,
    lifecycle,
    deviceDetails,
    hops,
    defaultChainIds: hops.map((h) => h.chainId),
    topologyCatalog,
    recommendations,
    conclusion: scenario.timeline.conclusion,
    rootCause: scenario.incident.rootCause,
    rootCauseZh: scenario.incident.rootCauseZh,
  }
}

function classifyAlarm(alarm: TaggedAlarm, isRootHop: boolean): AlarmClass {
  if (alarm.role === "noise" || alarm.severity === "Warning") return "filtered"
  if (alarm.role === "root-symptom" || (isRootHop && alarm.role !== "secondary")) return "root"
  return "supporting"
}

function buildDeviceLifecycleDetail({
  scenario,
  hop,
  hops,
  flow,
  workbench,
  originAbs,
  endSec,
  bar,
}: {
  scenario: ScenarioModel
  hop: ImpactTwinHop
  hops: ImpactTwinHop[]
  flow: ReturnType<typeof buildConvergenceFlow>
  workbench: ReturnType<typeof getInvestigationWorkbench>
  originAbs: number
  endSec: number
  bar: LifecycleBar
}): DeviceLifecycleDetail {
  const hopIndex = hops.findIndex((h) => h.chainId === hop.chainId)
  const isRootHop = hop.status === "root" || hopIndex === 0

  const related = flow.rawAlarms
    .filter((alarm) => {
      if (alarm.hop === hopIndex) return true
      const token = `${alarm.family} ${alarm.device}`.toLowerCase()
      return token.includes(hop.label.toLowerCase()) || token.includes(hop.chainId.toLowerCase())
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  // Ensure filtered samples appear on root device for demo richness
  const filteredExtra =
    isRootHop
      ? flow.rawAlarms
          .filter((a) => a.role === "noise" || a.severity === "Warning")
          .slice(0, 2)
      : []

  const pool = [...related]
  for (const extra of filteredExtra) {
    if (!pool.some((a) => a.id === extra.id)) pool.push(extra)
  }
  pool.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  const alarms: DeviceAlarmBar[] = pool.slice(0, 8).map((alarm, index, list) => {
    const abs = parseClock(alarm.timestamp.slice(0, 8))
    const t0 = Math.max(0, abs - originAbs)
    const nextAbs = list[index + 1] ? parseClock(list[index + 1]!.timestamp.slice(0, 8)) : originAbs + endSec
    const durationSec = Math.max(15, Math.min(90, nextAbs - abs))
    const group = flow.aggregationGroups.find((g) => g.members.some((m) => m.id === alarm.id))
    const classification = classifyAlarm(alarm, isRootHop)
    return {
      id: alarm.id,
      code: alarm.code.replace(/-\d+$/, "").replace(/-/g, "_"),
      message: alarm.message,
      device: alarm.device,
      time: alarm.timestamp.slice(0, 8),
      t0,
      durationSec,
      classification,
      role: alarm.role,
      groupCode: group?.code,
      rules:
        classification === "filtered"
          ? ["Noise Filter", "Warning Suppression"]
          : group?.reasons?.length
            ? group.reasons
            : ["Storm Collapse", "Pattern Match", "Topology Merge"],
      filterReason:
        classification === "filtered"
          ? alarm.role === "noise"
            ? "Flash / noise role — removed from causal path"
            : "Warning severity — filtered before correlation"
          : undefined,
    }
  })

  // Fall back synthetic alarms if device has none in raw set
  if (alarms.length === 0) {
    const start = bar.startSec
    alarms.push({
      id: `synth-${hop.chainId}`,
      code: `${hop.label.toUpperCase()}_ALERT`,
      message: `${hop.label} cascade symptom`,
      device: hop.sub || hop.label,
      time: formatEvolutionClock(originAbs + start),
      t0: start,
      durationSec: Math.max(20, bar.endSec - bar.startSec),
      classification: isRootHop ? "root" : "supporting",
      role: isRootHop ? "root-symptom" : "cascade",
      rules: ["Topology Merge"],
    })
  }

  const rawCount = alarms.length
  const groups = [...new Set(alarms.filter((a) => a.classification !== "filtered").map((a) => a.groupCode ?? a.code))]
  const candidate = workbench.candidates.find((c) => c.chainId === hop.chainId) ?? workbench.candidates[0]
  const groupCount = Math.max(1, groups.length)
  const candidateCount = candidate ? 1 : 0
  const rootCount = isRootHop || candidate?.likelyRoot ? 1 : 0

  const convergence: ConvergenceStageDetail[] = [
    {
      id: "raw",
      title: "Raw Alarms",
      titleZh: "原始告警",
      count: rawCount,
      countLabel: `${rawCount} Raw Alarms`,
      rules: ["Ingest"],
      items: alarms.map((a) => `${a.time} · ${a.code}`),
      filterReasons: [],
    },
    {
      id: "groups",
      title: "Alarm Groups",
      titleZh: "告警组",
      count: groupCount,
      countLabel: `${groupCount} Alarm Groups`,
      rules: ["Storm Collapse", "Pattern Match", "Topology Merge"],
      items: groups.map((g) => String(g)),
      filterReasons: alarms.filter((a) => a.classification === "filtered").map((a) => `${a.code}: ${a.filterReason}`),
    },
    {
      id: "candidate",
      title: "Candidate Cause",
      titleZh: "候选根因",
      count: candidateCount || 1,
      countLabel: `${candidateCount || 1} Candidate Cause`,
      rules: ["Correlation Analysis", "Dependency Hop"],
      items: [candidate?.nameZh ?? hop.label],
      filterReasons: [],
    },
    {
      id: "root",
      title: "Root Cause",
      titleZh: "最终根因",
      count: rootCount,
      countLabel: rootCount ? "1 Root Cause" : "0 Root Cause",
      rules: ["Earliest Source", "Cascade Coverage", "Historical Pattern"],
      items: rootCount ? [scenario.incident.rootCauseZh] : ["Not selected as final root"],
      filterReasons: [],
    },
  ]

  const firstAlarm = alarms.find((a) => a.classification === "root") ?? alarms[0]!
  const evidenceTrace: EvidenceTraceStep[] = [
    {
      id: "t-raw",
      kind: "raw",
      label: firstAlarm.code,
      labelZh: "Raw Alarm",
      detail: `${firstAlarm.time} · ${firstAlarm.device} · ${firstAlarm.message}`,
    },
    {
      id: "t-group",
      kind: "group",
      label: firstAlarm.groupCode ?? firstAlarm.code,
      labelZh: "Alarm Group",
      detail: (firstAlarm.rules ?? []).join(" · "),
    },
    {
      id: "t-cand",
      kind: "candidate",
      label: candidate?.name ?? hop.label,
      labelZh: "Candidate Cause",
      detail: candidate?.why ?? `${hop.label} retained after correlation`,
    },
    {
      id: "t-root",
      kind: "root",
      label: scenario.incident.rootCause,
      labelZh: "Root Cause",
      detail: scenario.incident.rootCauseZh,
    },
  ]

  return {
    chainId: hop.chainId,
    label: hop.label,
    alarms,
    convergence,
    evidenceTrace,
  }
}

export function expandOptionsFor(
  model: EventEvolutionModel,
  focusChainId: string | null,
): { upstream: TopologyAssetOption[]; downstream: TopologyAssetOption[]; related: TopologyAssetOption[] } {
  const idx = focusChainId ? model.hops.findIndex((h) => h.chainId === focusChainId) : 0
  const safeIdx = idx < 0 ? 0 : idx
  const upstream = model.topologyCatalog.filter((_, i) => i < safeIdx).map((item) => ({ ...item, kind: "upstream" as const }))
  const downstream = model.topologyCatalog.filter((_, i) => i > safeIdx).map((item) => ({ ...item, kind: "downstream" as const }))
  const related = model.recommendations
  return { upstream, downstream, related }
}

export function lifecycleForChains(model: EventEvolutionModel, chainIds: string[]): LifecycleBar[] {
  const set = new Set(chainIds)
  return model.lifecycle.filter((bar) => set.has(bar.chainId))
}

export function twinFocusAtCursor(
  model: EventEvolutionModel,
  cursorSec: number,
  selectedId: string | null,
  chainIds: string[],
  alarmChainId?: string | null,
) {
  const activeSet = new Set(chainIds)
  if (alarmChainId && activeSet.has(alarmChainId)) {
    const idx = model.hops.findIndex((h) => h.chainId === alarmChainId)
    const active = new Set(
      model.hops.slice(Math.max(0, idx)).map((h) => h.chainId).filter((id) => activeSet.has(id)),
    )
    active.add(alarmChainId)
    return { selectedHop: alarmChainId, activeHops: active }
  }
  if (selectedId) {
    const node = [
      ...model.physical,
      ...model.convergence,
      ...model.reasoning,
      ...model.investigation,
    ].find((n) => n.id === selectedId)
    if (node?.chainId && activeSet.has(node.chainId)) {
      const idx = model.hops.findIndex((h) => h.chainId === node.chainId)
      const active = new Set(
        model.hops.slice(Math.max(0, idx)).map((h) => h.chainId).filter((id) => activeSet.has(id)),
      )
      active.add(node.chainId)
      return { selectedHop: node.chainId, activeHops: active }
    }
  }
  const reached = model.lifecycle.filter((bar) => activeSet.has(bar.chainId) && bar.startSec <= cursorSec)
  const current = reached[reached.length - 1]
  if (!current) return { selectedHop: null as string | null, activeHops: activeSet.size ? activeSet : null }
  const idx = model.hops.findIndex((h) => h.chainId === current.chainId)
  const active = new Set(model.hops.slice(0, idx + 1).map((h) => h.chainId).filter((id) => activeSet.has(id)))
  return { selectedHop: current.chainId, activeHops: active }
}

export function playbackStatus(model: EventEvolutionModel, cursorSec: number, chainIds: string[]) {
  const phys = model.physical.filter((n) => n.t0 <= cursorSec)
  const currentPhys = phys[phys.length - 1]
  const life = model.lifecycle.filter((b) => chainIds.includes(b.chainId) && b.startSec <= cursorSec)
  const devices = life.filter((b) => b.chainId !== model.hops[model.hops.length - 1]?.chainId).map((b) => b.label)
  const service = life.find((b) => b.chainId === model.hops[model.hops.length - 1]?.chainId)?.label
  return {
    stage: currentPhys?.titleZh ?? "—",
    stageEn: currentPhys?.title ?? "—",
    devices: devices.length ? devices : ["—"],
    service: service ?? "—",
  }
}
