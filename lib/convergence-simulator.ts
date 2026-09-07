import { scenarios, type ScenarioKey } from "@/data/scenarios"
import type { AlarmSeverity } from "@/lib/incident-data"
import { applyConvergenceRuleToAlarms, type TaggedAlarm } from "@/lib/alarm-convergence"
import { resolveInventoryAlarm, type InventoryEventRow } from "@/lib/manual-event-inventory"

export type PipelineBranch = "denoise" | "relation" | "scenario" | "rca"

export type PipelineMethodKey =
  | "duplicate"
  | "flap"
  | "temporal"
  | "spatial"
  | "topology"
  | "business"
  | "change"
  | "pattern"
  | "cluster"
  | "rca"

export type PipelineMethod = {
  key: PipelineMethodKey
  branch: PipelineBranch
  zh: string
  en: string
  hint: string
}

export const PIPELINE_BRANCHES: { key: PipelineBranch; zh: string; en: string; plain: string }[] = [
  { key: "denoise", zh: "降噪分析", en: "Denoise", plain: "先把干扰去掉" },
  { key: "relation", zh: "关系分析", en: "Relation", plain: "再按位置和依赖归并" },
  { key: "scenario", zh: "场景分析", en: "Scenario", plain: "再对照业务和历史模式" },
]

export const PIPELINE_METHODS: PipelineMethod[] = [
  { key: "duplicate", branch: "denoise", zh: "重复告警收敛", en: "Duplicate Collapse", hint: "同一设备反复报同一条" },
  { key: "flap", branch: "denoise", zh: "震荡告警收敛", en: "Flapping Collapse", hint: "闪一下就恢复的告警" },
  { key: "temporal", branch: "denoise", zh: "时间收敛分析", en: "Temporal Correlation", hint: "同一分钟里的告警并在一起" },
  { key: "spatial", branch: "relation", zh: "空间收敛分析", en: "Spatial Correlation", hint: "同一机房 / 区域的告警" },
  { key: "topology", branch: "relation", zh: "拓扑收敛分析", en: "Topology Correlation", hint: "上下游设备上的同源告警" },
  { key: "business", branch: "scenario", zh: "业务关联分析", en: "Business Correlation", hint: "训练任务等业务受影响" },
  { key: "change", branch: "scenario", zh: "变更关联分析", en: "Change Correlation", hint: "可能由变更引起的伴随告警" },
  { key: "pattern", branch: "scenario", zh: "模式识别分析", en: "Pattern Matching", hint: "和历史上同类故障长得像" },
  { key: "cluster", branch: "scenario", zh: "AI聚类分析", en: "AI Clustering", hint: "把同类风暴自动收成一组" },
  { key: "rca", branch: "rca", zh: "RCA根因分析", en: "Root Cause Analysis", hint: "从关联事件里找出真正源头" },
]

export const PIPELINE_ORDER: PipelineMethodKey[] = [
  "duplicate",
  "flap",
  "temporal",
  "spatial",
  "topology",
  "business",
  "change",
  "pattern",
  "cluster",
  "rca",
]

export const PIPELINE_PRESETS: { key: string; zh: string; en: string; methods: PipelineMethodKey[] }[] = [
  { key: "recommended", zh: "推荐路径", en: "Recommended", methods: ["flap", "duplicate", "topology", "pattern", "rca"] },
  { key: "full", zh: "完整管道", en: "Full Pipeline", methods: PIPELINE_ORDER },
  { key: "denoise", zh: "仅降噪", en: "Denoise Only", methods: ["duplicate", "flap", "temporal"] },
  { key: "relation", zh: "仅关系", en: "Relation Only", methods: ["spatial", "topology"] },
  { key: "scenario", zh: "仅场景", en: "Scenario Only", methods: ["business", "change", "pattern", "cluster"] },
]

export const DEFAULT_PIPELINE_METHODS: PipelineMethodKey[] = PIPELINE_PRESETS[0]!.methods

export type SimulatorStage = {
  key: string
  zh: string
  en: string
  count: number
  dropped: number
}

export type SimulatorGroup = {
  id: string
  title: string
  device: string
  detail: string
  merged: number
  members: TaggedAlarm[]
}

export type SimulatorContribution = {
  key: string
  zh: string
  en: string
  input: number
  output: number
  reduced: number
  groups: SimulatorGroup[]
}

export type SimulatorIncident = {
  id: string
  scenarioKey: ScenarioKey
  incidentId: string
  title: string
  titleZh: string
  device: string
  severity: AlarmSeverity
  merged: number
  confidence: number
  members: TaggedAlarm[]
  rules: { key: string; zh: string; en: string }[]
}

export type SimulatorResult = {
  methods: PipelineMethodKey[]
  inputCount: number
  incidentCount: number
  reduction: number
  reductionRate: number
  confidence: number
  correlatedCount: number
  stages: SimulatorStage[]
  contributions: SimulatorContribution[]
  incidents: SimulatorIncident[]
}

const SEVERITY_RANK: Record<string, number> = { Critical: 0, Major: 1, Minor: 2, Warning: 3 }
const HOP_ZH: Record<number, string> = {
  0: "源头设备",
  1: "一跳下游",
  2: "二跳下游",
  3: "三跳下游",
  4: "业务层",
}

function methodMeta(key: PipelineMethodKey) {
  return PIPELINE_METHODS.find((item) => item.key === key)!
}

function representative(list: TaggedAlarm[]): TaggedAlarm {
  return [...list].sort((a, b) => {
    const rank = (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9)
    return rank !== 0 ? rank : a.timestamp.localeCompare(b.timestamp)
  })[0]!
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): T[][] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }
  return [...groups.values()]
}

function toGroups(lists: TaggedAlarm[][], idOf: (list: TaggedAlarm[]) => SimulatorGroup): { kept: TaggedAlarm[]; groups: SimulatorGroup[] } {
  const groups = lists.map(idOf)
  return { kept: groups.map((group) => representative(group.members)), groups }
}

function collapseBy(alarms: TaggedAlarm[], keyOf: (alarm: TaggedAlarm) => string, titleOf: (list: TaggedAlarm[]) => SimulatorGroup) {
  return toGroups(
    groupBy(alarms, keyOf).sort((a, b) => a[0]!.timestamp.localeCompare(b[0]!.timestamp)),
    titleOf,
  )
}

function applyDuplicate(alarms: TaggedAlarm[]) {
  return collapseBy(alarms, (alarm) => `${alarm.device}::${alarm.code}`, (list) => {
    const head = representative(list)
    return {
      id: `dup-${head.device}-${head.code}`,
      title: head.code,
      device: head.device,
      detail: list.length > 1 ? `重复告警 ${list.length} 条` : "无重复",
      merged: list.length,
      members: list,
    }
  })
}

function applyFlap(alarms: TaggedAlarm[]) {
  const dropped = alarms.filter(
    (alarm) => alarm.role === "noise" || alarm.severity === "Warning",
  )
  const kept = alarms.filter((alarm) => !dropped.some((item) => item.id === alarm.id))
  return {
    kept,
    groups: dropped.length
      ? [
          {
            id: "flap-drop",
            title: "震荡 / 闪断",
            device: "—",
            detail: "不进入后续关系与场景分析",
            merged: dropped.length,
            members: dropped,
          },
        ]
      : [],
  }
}

function applyMinute(alarms: TaggedAlarm[]) {
  return collapseBy(alarms, (alarm) => alarm.timestamp.slice(0, 5), (list) => {
    const minute = list[0]!.timestamp.slice(0, 5)
    return {
      id: `tw-${minute}`,
      title: `${minute} 时间窗`,
      device: `${list.length} 条`,
      detail: `跳数 ${[...new Set(list.map((item) => item.hop))].sort().join("→")}`,
      merged: list.length,
      members: list,
    }
  })
}

function applyZone(alarms: TaggedAlarm[]) {
  return collapseBy(alarms, (alarm) => alarm.zone || "unknown", (list) => ({
    id: `zone-${list[0]!.zone}`,
    title: list[0]!.zone,
    device: list[0]!.zone,
    detail: `${[...new Set(list.map((item) => item.family))].join("、")} 同空间 ${list.length} 条`,
    merged: list.length,
    members: list,
  }))
}

function applyHop(alarms: TaggedAlarm[]) {
  const causal = alarms.filter((alarm) => alarm.role === "root-symptom" || alarm.role === "cascade")
  const leftover = alarms.filter((alarm) => alarm.role !== "root-symptom" && alarm.role !== "cascade")
  const grouped = collapseBy(causal, (alarm) => String(alarm.hop), (list) => {
    const hop = list[0]!.hop
    return {
      id: `hop-${hop}`,
      title: HOP_ZH[hop] ?? `Hop ${hop}`,
      device: [...new Set(list.map((item) => item.device))].slice(0, 3).join("、"),
      detail: `${[...new Set(list.map((item) => item.family))].join(" / ")} · ${list.length} 条`,
      merged: list.length,
      members: list,
    }
  })
  return {
    kept: grouped.kept,
    groups: [
      ...grouped.groups,
      ...(leftover.length
        ? [{ id: "hop-leftover", title: "非拓扑残留", device: "—", detail: "伴随现象不进跳数", merged: leftover.length, members: leftover }]
        : []),
    ],
  }
}

function applyBusiness(alarms: TaggedAlarm[]) {
  const business = alarms.filter((alarm) => alarm.hop >= 3 || /service|job|platform|gpu/i.test(`${alarm.family} ${alarm.device}`))
  const leftover = alarms.filter((alarm) => !business.some((item) => item.id === alarm.id))
  if (business.length === 0) return { kept: alarms, groups: [] }
  const group: SimulatorGroup = {
    id: "biz-impact",
    title: "业务影响簇",
    device: [...new Set(business.map((item) => item.family))].join(" → "),
    detail: "业务层 / 训练服务关联告警归并",
    merged: business.length,
    members: business,
  }
  return { kept: [representative(business), ...leftover], groups: [group] }
}

function applyChange(alarms: TaggedAlarm[]) {
  const change = alarms.filter((alarm) => alarm.role === "secondary")
  const leftover = alarms.filter((alarm) => alarm.role !== "secondary")
  if (change.length === 0) return { kept: alarms, groups: [] }
  return {
    kept: leftover.length ? leftover : [representative(change)],
    groups: [
      {
        id: "change-secondary",
        title: "变更 / 伴随残留",
        device: change.map((item) => item.device).slice(0, 3).join("、"),
        detail: "二次症状按变更伴随归并，不单独成事件",
        merged: change.length,
        members: change,
      },
    ],
  }
}

function applyPatternGroups(alarms: TaggedAlarm[]) {
  const root = alarms.filter((alarm) => alarm.role === "root-symptom")
  const cascade = alarms.filter((alarm) => alarm.role === "cascade")
  const leftover = alarms.filter((alarm) => alarm.role === "secondary" || alarm.role === "noise")
  const groups: SimulatorGroup[] = []
  if (root.length) {
    groups.push({
      id: "pattern-root",
      title: "源头故障指纹",
      device: root[0]!.device,
      detail: root.map((item) => item.code).join(" + "),
      merged: root.length,
      members: root,
    })
  }
  if (cascade.length) {
    groups.push({
      id: "pattern-cascade",
      title: "下游级联指纹",
      device: [...new Set(cascade.map((item) => item.family))].join(" → "),
      detail: "与源头时间顺序一致",
      merged: cascade.length,
      members: cascade,
    })
  }
  if (leftover.length) {
    groups.push({
      id: "pattern-other",
      title: "未匹配指纹",
      device: leftover[0]!.device,
      detail: "伴随现象",
      merged: leftover.length,
      members: leftover,
    })
  }
  return { kept: groups.map((group) => representative(group.members)), groups }
}

function applyStorm(alarms: TaggedAlarm[]) {
  return collapseBy(alarms, (alarm) => `${alarm.family}::${alarm.code}`, (list) => {
    const head = representative(list)
    const devices = [...new Set(list.map((item) => item.device))]
    return {
      id: `storm-${head.family}-${head.code}`,
      title: head.code,
      device: devices.length > 1 ? `${devices[0]} ~ ${devices[devices.length - 1]}` : head.device,
      detail: list.length > 1 ? `AI 聚类 ${list.length} 条` : "单条告警",
      merged: list.length,
      members: list,
    }
  })
}

function runMethod(key: Exclude<PipelineMethodKey, "rca">, alarms: TaggedAlarm[]) {
  switch (key) {
    case "duplicate":
      return applyDuplicate(alarms)
    case "flap":
      return applyFlap(alarms)
    case "temporal":
      return applyMinute(alarms)
    case "spatial":
      return applyZone(alarms)
    case "topology":
      return applyHop(alarms)
    case "business":
      return applyBusiness(alarms)
    case "change":
      return applyChange(alarms)
    case "pattern":
      return applyPatternGroups(alarms)
    case "cluster":
      return applyStorm(alarms)
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function pipelineConfidence(methods: PipelineMethodKey[], input: number, output: number, hasRoot: boolean) {
  const compact = input === 0 ? 0 : (input - output) / input
  const branches = new Set(methods.map((key) => methodMeta(key).branch)).size
  return clamp(Math.round(56 + methods.length * 2.4 + branches * 4 + (methods.includes("rca") ? 10 : 0) + compact * 8 + (hasRoot ? 3 : -4)), 48, 99)
}

function resolveByScenario(rows: InventoryEventRow[]) {
  const byScenario = new Map<ScenarioKey, TaggedAlarm[]>()
  for (const row of rows) {
    const alarm = resolveInventoryAlarm(row)
    if (!alarm) continue
    const list = byScenario.get(row.scenarioKey) ?? []
    if (!list.some((item) => item.id === alarm.id)) list.push(alarm)
    byScenario.set(row.scenarioKey, list)
  }
  return [...byScenario.entries()].map(([key, alarms]) => ({ key, scenario: scenarios[key], alarms }))
}

function runScenario(methods: PipelineMethodKey[], key: ScenarioKey, alarms: TaggedAlarm[]) {
  const selected = PIPELINE_ORDER.filter((item) => methods.includes(item))
  const preRca = selected.filter((item) => item !== "rca")
  const useRca = selected.includes("rca")
  const rules: { key: string; zh: string; en: string }[] = []
  const contributions: SimulatorContribution[] = []
  const stages: SimulatorStage[] = [{ key: "raw", zh: "原始告警事件", en: "Raw Events", count: alarms.length, dropped: 0 }]
  let current = alarms
  let lastGroups: SimulatorGroup[] = []

  for (const method of preRca) {
    const meta = methodMeta(method)
    const result = runMethod(method, current)
    const next = result.kept
    rules.push({ key: method, zh: meta.zh, en: meta.en })
    contributions.push({
      key: method,
      zh: meta.zh,
      en: meta.en,
      input: current.length,
      output: next.length,
      reduced: Math.max(0, current.length - next.length),
      groups: result.groups.filter((group) => group.merged > 1 || method === "flap"),
    })
    lastGroups = result.groups
    stages.push({
      key: method,
      zh: meta.zh,
      en: meta.en,
      count: next.length,
      dropped: Math.max(0, current.length - next.length),
    })
    current = next
  }

  const correlated: SimulatorStage = {
    key: "correlated",
    zh: "关联事件集",
    en: "Correlated Set",
    count: current.length,
    dropped: 0,
  }
  stages.push(correlated)

  if (useRca) {
    const scenario = scenarios[key]
    const items = applyConvergenceRuleToAlarms(current, "causal", scenario)
    const item = items[0]
    const meta = methodMeta("rca")
    rules.push({ key: "rca", zh: meta.zh, en: meta.en })
    contributions.push({
      key: "rca",
      zh: meta.zh,
      en: meta.en,
      input: current.length,
      output: 1,
      reduced: Math.max(0, current.length - 1),
      groups: [
        {
          id: `${key}-rca`,
          title: item?.title ?? scenario.incident.rootCause,
          device: item?.device ?? current[0]?.device ?? "—",
          detail: item?.detail ?? scenario.incident.rootCauseZh,
          merged: current.length,
          members: current,
        },
      ],
    })
    const incidents: SimulatorIncident[] = [
      {
        id: `${key}-rca`,
        scenarioKey: key,
        incidentId: scenario.incident.id,
        title: scenario.incident.rootCause,
        titleZh: scenario.incident.rootCauseZh,
        device: item?.device ?? current[0]?.device ?? scenario.incident.rootCause,
        severity: scenario.incident.severity === "P1" ? "Critical" : "Major",
        merged: alarms.length,
        confidence: pipelineConfidence(methods, alarms.length, 1, alarms.some((alarm) => alarm.role === "root-symptom")),
        members: alarms,
        rules,
      },
    ]
    stages.push({ key: "rca", zh: "根因事件", en: "Root Cause Event", count: 1, dropped: Math.max(0, current.length - 1) })
    return { stages, contributions, incidents, rules, correlatedCount: current.length }
  }

  const keptGroups = lastGroups.filter((group) => current.some((alarm) => group.members.some((member) => member.id === alarm.id)))
  const groups = keptGroups.length
    ? keptGroups
    : [
        {
          id: `${key}-open`,
          title: current[0]?.code ?? "Open Events",
          device: current[0]?.device ?? "—",
          detail: "未进入 RCA",
          merged: current.length,
          members: current,
        },
      ]
  const incidents: SimulatorIncident[] = groups.map((group, index) => ({
    id: `${key}-${group.id}-${index}`,
    scenarioKey: key,
    incidentId: scenarios[key].incident.id,
    title: group.title,
    titleZh: group.title,
    device: group.device,
    severity: representative(group.members).severity,
    merged: group.merged,
    confidence: pipelineConfidence(methods, alarms.length, Math.max(1, groups.length), group.members.some((alarm) => alarm.role === "root-symptom")),
    members: group.members,
    rules,
  }))
  return { stages, contributions, incidents, rules, correlatedCount: current.length }
}

function mergeStages(parts: { stages: SimulatorStage[] }[], inputCount: number): SimulatorStage[] {
  const keys: string[] = []
  for (const part of parts) {
    for (const stage of part.stages) {
      if (!keys.includes(stage.key)) keys.push(stage.key)
    }
  }
  return keys.map((key) => {
    const samples = parts.flatMap((part) => part.stages.filter((stage) => stage.key === key))
    const template = samples[0]!
    return {
      key,
      zh: template.zh,
      en: template.en,
      count: key === "raw" ? inputCount : samples.reduce((sum, stage) => sum + stage.count, 0),
      dropped: samples.reduce((sum, stage) => sum + stage.dropped, 0),
    }
  })
}

function mergeContributions(parts: { contributions: SimulatorContribution[] }[]) {
  const map = new Map<string, SimulatorContribution>()
  for (const part of parts) {
    for (const item of part.contributions) {
      const current = map.get(item.key)
      if (!current) {
        map.set(item.key, { ...item, groups: [...item.groups] })
        continue
      }
      current.input += item.input
      current.output += item.output
      current.reduced += item.reduced
      current.groups.push(...item.groups)
    }
  }
  return [...map.values()]
}

export function simulatePipeline(rows: InventoryEventRow[], methods: PipelineMethodKey[]): SimulatorResult {
  const selected = PIPELINE_ORDER.filter((item) => methods.includes(item))
  const buckets = resolveByScenario(rows)
  const parts = buckets.map((bucket) => runScenario(selected, bucket.key, bucket.alarms))
  const incidents = parts.flatMap((part) => part.incidents)
  const inputCount = rows.length
  const incidentCount = incidents.length
  const reduction = Math.max(0, inputCount - incidentCount)
  const confidence =
    incidents.length === 0
      ? 0
      : Math.round(incidents.reduce((sum, item) => sum + item.confidence, 0) / incidents.length)
  return {
    methods: selected,
    inputCount,
    incidentCount,
    reduction,
    reductionRate: inputCount === 0 ? 0 : Math.round((reduction / inputCount) * 100),
    confidence,
    correlatedCount: parts.reduce((sum, part) => sum + part.correlatedCount, 0),
    stages: mergeStages(parts, inputCount),
    contributions: mergeContributions(parts),
    incidents,
  }
}

export function sameMethods(left: PipelineMethodKey[], right: PipelineMethodKey[]) {
  return left.length === right.length && left.every((item) => right.includes(item))
}
