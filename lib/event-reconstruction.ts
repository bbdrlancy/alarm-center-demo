import { scenarios, type ScenarioKey } from "@/data/scenarios"
import type { AlarmSeverity } from "@/lib/incident-data"
import { resolveInventoryAlarm, type InventoryEventRow } from "@/lib/manual-event-inventory"

export type EventChainKind = "power" | "cooling" | "storage" | "network" | "custom"

export type ReconstructedAlarmSample = {
  id: string
  rowId: string
  time: string
  clock: string
  code: string
  message: string
  severity: AlarmSeverity
  status: string
  kept: boolean
}

export type ReconstructedEvent = {
  id: string
  time: string
  clock: string
  endTime: string
  endClock: string
  startSec: number
  endSec: number
  durationSec: number
  title: string
  titleZh: string
  device: string
  scenarioKey: ScenarioKey
  severity: AlarmSeverity
  hop: number
  sourceAlarmIds: string[]
  sourceRowIds: string[]
  members: ReconstructedAlarmSample[]
  summary: string
  summaryZh: string
  kept: boolean
  focused: boolean
  groupId: string | null
}

export type ReconstructionGroup = {
  id: string
  name: string
  nameZh: string
  chain: EventChainKind
  eventIds: string[]
  auto: boolean
}

export type EventSet = {
  id: string
  name: string
  nameZh: string
  eventIds: string[]
  groupIds: string[]
  scenarioKeys: ScenarioKey[]
  alarmCount: number
  eventCount: number
  generatedAt: string
}

export type ReconstructionModel = {
  events: ReconstructedEvent[]
  groups: ReconstructionGroup[]
}

export const CHAIN_META: Record<
  Exclude<EventChainKind, "custom">,
  { zh: string; en: string; scenarioKey: ScenarioKey }
> = {
  power: { zh: "供电链", en: "Power Chain", scenarioKey: "power" },
  cooling: { zh: "制冷链", en: "Cooling Chain", scenarioKey: "cooling" },
  storage: { zh: "存储链", en: "Storage Chain", scenarioKey: "storage" },
  network: { zh: "网络链", en: "Network Chain", scenarioKey: "network" },
}

const HOP_LABELS: Record<ScenarioKey, { title: string; titleZh: string }[]> = {
  power: [
    { title: "UPS Failure", titleZh: "UPS 故障" },
    { title: "PDU Input Loss", titleZh: "PDU 输入失电" },
    { title: "Rack Power Down", titleZh: "机架断电" },
    { title: "GPU Offline", titleZh: "GPU 离线" },
    { title: "Training Service Impact", titleZh: "训练服务影响" },
  ],
  cooling: [
    { title: "CRAC Failure", titleZh: "精密空调故障" },
    { title: "Cold Aisle Overheat", titleZh: "冷通道过热" },
    { title: "Rack Thermal Alert", titleZh: "机架热告警" },
    { title: "GPU Throttle", titleZh: "GPU 热降频" },
    { title: "Training Cluster Impact", titleZh: "训练集群影响" },
  ],
  storage: [
    { title: "Controller Failure", titleZh: "控制器故障" },
    { title: "SAN Retry Storm", titleZh: "SAN 重试风暴" },
    { title: "Volume Degraded", titleZh: "卷降级" },
    { title: "Job Checkpoint Fail", titleZh: "作业 Checkpoint 失败" },
    { title: "Dataset Service Impact", titleZh: "数据集服务影响" },
  ],
  network: [
    { title: "Core Switch Down", titleZh: "核心交换机离线" },
    { title: "BGP Flap", titleZh: "BGP 震荡" },
    { title: "Edge Isolation", titleZh: "接入隔离" },
    { title: "GPU Cluster Net Loss", titleZh: "GPU 集群断网" },
    { title: "AI Gateway Impact", titleZh: "AI 网关影响" },
  ],
}

function chainForScenario(key: ScenarioKey): Exclude<EventChainKind, "custom"> {
  return key
}

function clockLabel(timestamp: string) {
  const part = timestamp.includes(" ") ? timestamp.split(" ")[1]! : timestamp
  return part.slice(0, 5)
}

function fullTime(timestamp: string) {
  return timestamp.includes(" ") ? timestamp.split(" ")[1]! : timestamp
}

function parseClockToSec(timestamp: string): number {
  const part = timestamp.includes(" ") ? timestamp.split(" ")[1]! : timestamp
  const [h = "0", m = "0", s = "0"] = part.split(":")
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

function formatSecClock(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function hopLabel(scenarioKey: ScenarioKey, hop: number, fallback: string) {
  const labels = HOP_LABELS[scenarioKey]
  return labels[Math.min(hop, labels.length - 1)] ?? { title: fallback, titleZh: fallback }
}

/** Clear/resolve offset by hop — downstream events tend to clear later in the demo model. */
function resolveOffsetSec(hop: number, memberCount: number) {
  return 45 + hop * 28 + Math.min(90, memberCount * 12)
}

/** Cluster selected raw alarms into reconstructed propagation events. */
export function buildReconstructionFromAlarms(rows: InventoryEventRow[]): ReconstructionModel {
  if (rows.length === 0) return { events: [], groups: [] }

  type Bucket = {
    key: string
    scenarioKey: ScenarioKey
    hop: number
    device: string
    rows: InventoryEventRow[]
  }

  const buckets = new Map<string, Bucket>()
  for (const row of rows) {
    const alarm = resolveInventoryAlarm(row)
    const hop = alarm?.hop ?? 0
    const device = alarm?.device ?? row.device
    const key = `${row.scenarioKey}|${hop}|${device}`
    const bucket = buckets.get(key)
    if (bucket) bucket.rows.push(row)
    else {
      buckets.set(key, {
        key,
        scenarioKey: row.scenarioKey,
        hop,
        device,
        rows: [row],
      })
    }
  }

  const events: ReconstructedEvent[] = [...buckets.values()]
    .map((bucket, index) => {
      const sorted = [...bucket.rows].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      const first = sorted[0]!
      const last = sorted[sorted.length - 1]!
      const alarm = resolveInventoryAlarm(first)
      const label = hopLabel(bucket.scenarioKey, bucket.hop, first.summary || first.code)
      const startSec = parseClockToSec(first.timestamp)
      const lastSec = parseClockToSec(last.timestamp)
      const endSec = Math.max(lastSec + 20, startSec + resolveOffsetSec(bucket.hop, sorted.length))
      const members: ReconstructedAlarmSample[] = sorted.map((row) => {
        const item = resolveInventoryAlarm(row)
        return {
          id: row.id,
          rowId: row.id,
          time: fullTime(row.timestamp),
          clock: clockLabel(row.timestamp),
          code: row.displayCode || row.code,
          message: item?.message ?? row.summary,
          severity: (item?.severity ?? row.severity) as AlarmSeverity,
          status: row.status,
          kept: true,
        }
      })
      return {
        id: `evt-${bucket.scenarioKey}-${bucket.hop}-${index}-${bucket.device.replace(/\s+/g, "")}`,
        time: fullTime(first.timestamp),
        clock: clockLabel(first.timestamp),
        endTime: formatSecClock(endSec),
        endClock: formatSecClock(endSec).slice(0, 5),
        startSec,
        endSec,
        durationSec: Math.max(30, endSec - startSec),
        title: label.title,
        titleZh: label.titleZh,
        device: bucket.device,
        scenarioKey: bucket.scenarioKey,
        severity: (alarm?.severity ?? first.severity) as AlarmSeverity,
        hop: bucket.hop,
        sourceAlarmIds: members.map((item) => item.id),
        sourceRowIds: sorted.map((row) => row.id),
        members,
        summary: alarm?.message ?? first.summary,
        summaryZh: `${label.titleZh} · ${sorted.length} 条原始告警`,
        kept: true,
        focused: false,
        groupId: null,
      }
    })
    .sort((a, b) => a.startSec - b.startSec || a.hop - b.hop)

  const groups: ReconstructionGroup[] = []
  const byScenario = new Map<ScenarioKey, string[]>()
  for (const event of events) {
    const list = byScenario.get(event.scenarioKey) ?? []
    list.push(event.id)
    byScenario.set(event.scenarioKey, list)
  }
  for (const [scenarioKey, eventIds] of byScenario) {
    if (eventIds.length < 2) continue
    const chain = chainForScenario(scenarioKey)
    const meta = CHAIN_META[chain]
    const groupId = `grp-auto-${chain}`
    groups.push({
      id: groupId,
      name: `${meta.en.replace(" Chain", "")} Failure Chain`,
      nameZh: `${meta.zh.replace("链", "")}故障链`,
      chain,
      eventIds,
      auto: true,
    })
    for (const event of events) {
      if (eventIds.includes(event.id)) event.groupId = groupId
    }
  }

  return { events, groups }
}

export function reconstructionTimeSpan(events: ReconstructedEvent[]) {
  if (events.length === 0) return { originSec: 0, endSec: 60 }
  const originSec = Math.min(...events.map((event) => event.startSec))
  const endSec = Math.max(...events.map((event) => event.endSec))
  return { originSec, endSec: Math.max(endSec, originSec + 60) }
}

export function groupEventsByDevice(events: ReconstructedEvent[]) {
  const map = new Map<string, ReconstructedEvent[]>()
  for (const event of events) {
    const list = map.get(event.device) ?? []
    list.push(event)
    map.set(event.device, list)
  }
  return [...map.entries()]
    .map(([device, list]) => ({
      device,
      scenarioKey: list[0]!.scenarioKey,
      hop: Math.min(...list.map((item) => item.hop)),
      events: [...list].sort((a, b) => a.startSec - b.startSec || a.hop - b.hop),
      keptCount: list.filter((item) => item.kept).length,
    }))
    .sort((a, b) => a.hop - b.hop || a.events[0]!.startSec - b.events[0]!.startSec)
}

export type AlarmCodeLane = {
  code: string
  severity: AlarmSeverity
  startSec: number
  endSec: number
  durationSec: number
  count: number
  eventIds: string[]
  sampleMessage: string
  clock: string
  endClock: string
}

/** Aggregate member alarms under a device into one lifecycle lane per alarm code. */
export function alarmCodeLanesForDevice(events: ReconstructedEvent[]): AlarmCodeLane[] {
  type Acc = {
    code: string
    severity: AlarmSeverity
    startSec: number
    endSec: number
    count: number
    eventIds: Set<string>
    sampleMessage: string
  }
  const map = new Map<string, Acc>()
  for (const event of events) {
    for (const member of event.members) {
      const startSec = parseClockToSec(member.time)
      const endSec = Math.max(startSec + 25, event.endSec)
      const prev = map.get(member.code)
      if (!prev) {
        map.set(member.code, {
          code: member.code,
          severity: member.severity,
          startSec,
          endSec,
          count: 1,
          eventIds: new Set([event.id]),
          sampleMessage: member.message,
        })
      } else {
        prev.startSec = Math.min(prev.startSec, startSec)
        prev.endSec = Math.max(prev.endSec, endSec)
        prev.count += 1
        prev.eventIds.add(event.id)
        const rank = (s: AlarmSeverity) =>
          s === "Critical" ? 0 : s === "Major" ? 1 : s === "Minor" ? 2 : 3
        if (rank(member.severity) < rank(prev.severity)) prev.severity = member.severity
      }
    }
  }
  return [...map.values()]
    .map((item) => ({
      code: item.code,
      severity: item.severity,
      startSec: item.startSec,
      endSec: item.endSec,
      durationSec: Math.max(20, item.endSec - item.startSec),
      count: item.count,
      eventIds: [...item.eventIds],
      sampleMessage: item.sampleMessage,
      clock: formatSecClock(item.startSec).slice(0, 5),
      endClock: formatSecClock(item.endSec).slice(0, 5),
    }))
    .sort((a, b) => a.startSec - b.startSec || a.code.localeCompare(b.code))
}

/** One lifecycle lane per raw alarm sample under a device (not clustered). */
export type RawAlarmLane = {
  id: string
  eventId: string
  rowId: string
  code: string
  message: string
  severity: AlarmSeverity
  startSec: number
  endSec: number
  clock: string
  time: string
  kept: boolean
}

export function rawAlarmLanesForDevice(events: ReconstructedEvent[]): RawAlarmLane[] {
  const lanes: RawAlarmLane[] = []
  for (const event of events) {
    for (const member of event.members) {
      const startSec = parseClockToSec(member.time)
      lanes.push({
        id: member.id,
        eventId: event.id,
        rowId: member.rowId,
        code: member.code,
        message: member.message,
        severity: member.severity,
        startSec,
        endSec: startSec + 25,
        clock: member.clock.slice(0, 5),
        time: member.time,
        kept: member.kept,
      })
    }
  }
  return lanes.sort((a, b) => a.startSec - b.startSec || a.code.localeCompare(b.code))
}

/** Exclude or restore a single raw alarm by inventory row id (unique per occurrence). */
export function setMemberKept(
  events: ReconstructedEvent[],
  rowId: string,
  kept: boolean,
): ReconstructedEvent[] {
  return events.map((event) => {
    if (!event.members.some((member) => member.rowId === rowId)) return event
    const members = event.members.map((member) =>
      member.rowId === rowId ? { ...member, kept } : member,
    )
    const anyKept = members.some((member) => member.kept)
    return {
      ...event,
      members,
      kept: anyKept,
      sourceAlarmIds: members.filter((member) => member.kept).map((member) => member.id),
      sourceRowIds: members.filter((member) => member.kept).map((member) => member.rowId),
    }
  })
}

export function keptEvents(events: ReconstructedEvent[]) {
  return events.filter((event) => event.kept)
}

export function generateEventSet(
  events: ReconstructedEvent[],
  groups: ReconstructionGroup[],
  nameZh = "探索事件集",
  name = "Exploration Event Set",
): EventSet | null {
  const kept = keptEvents(events)
  if (kept.length === 0) return null
  const keptIds = new Set(kept.map((event) => event.id))
  const activeGroups = groups.filter((group) => group.eventIds.some((id) => keptIds.has(id)))
  const scenarioKeys = [...new Set(kept.map((event) => event.scenarioKey))]
  const alarmCount = kept.reduce(
    (sum, event) => sum + event.members.filter((member) => member.kept).length,
    0,
  )
  if (alarmCount === 0) return null
  const stamp = new Date().toLocaleTimeString("zh-CN", { hour12: false })
  return {
    id: `eset-${Date.now()}`,
    name,
    nameZh,
    eventIds: kept.map((event) => event.id),
    groupIds: activeGroups.map((group) => group.id),
    scenarioKeys,
    alarmCount,
    eventCount: kept.length,
    generatedAt: stamp,
  }
}

/** Expand an event set back to inventory rows for convergence simulation. */
export function eventSetToInventoryRows(
  eventSet: EventSet,
  events: ReconstructedEvent[],
  allRows: InventoryEventRow[],
): InventoryEventRow[] {
  const byId = new Map(allRows.map((row) => [row.id, row]))
  const kept = events.filter((event) => eventSet.eventIds.includes(event.id) && event.kept)
  const rows: InventoryEventRow[] = []
  const seen = new Set<string>()
  for (const event of kept) {
    for (const member of event.members) {
      if (!member.kept) continue
      if (seen.has(member.rowId)) continue
      const row = byId.get(member.rowId)
      if (!row) continue
      seen.add(member.rowId)
      rows.push(row)
    }
  }
  return rows
}

export function mergeEvents(events: ReconstructedEvent[], ids: string[]): ReconstructedEvent[] {
  const selected = events.filter((event) => ids.includes(event.id) && event.kept)
  if (selected.length < 2) return events
  const sorted = [...selected].sort((a, b) => a.startSec - b.startSec || a.hop - b.hop)
  const primary = sorted[0]!
  const startSec = Math.min(...sorted.map((event) => event.startSec))
  const endSec = Math.max(...sorted.map((event) => event.endSec))
  const members = sorted.flatMap((event) => event.members)
  const merged: ReconstructedEvent = {
    ...primary,
    id: `evt-merged-${Date.now()}`,
    time: primary.time,
    clock: formatSecClock(startSec).slice(0, 5),
    endTime: formatSecClock(endSec),
    endClock: formatSecClock(endSec).slice(0, 5),
    startSec,
    endSec,
    durationSec: Math.max(30, endSec - startSec),
    title: `${primary.title} (+${sorted.length - 1})`,
    titleZh: `${primary.titleZh}（合并 ${sorted.length}）`,
    sourceAlarmIds: sorted.flatMap((event) => event.sourceAlarmIds),
    sourceRowIds: sorted.flatMap((event) => event.sourceRowIds),
    members,
    summary: sorted.map((event) => event.summary).join(" · "),
    summaryZh: `合并自：${sorted.map((event) => event.titleZh).join("、")}`,
    focused: true,
    groupId: primary.groupId,
  }
  const drop = new Set(ids)
  return [...events.filter((event) => !drop.has(event.id)), merged].sort(
    (a, b) => a.startSec - b.startSec || a.hop - b.hop,
  )
}

export function splitEvent(events: ReconstructedEvent[], eventId: string): ReconstructedEvent[] {
  const target = events.find((event) => event.id === eventId)
  if (!target || target.members.length < 2) return events
  const pieces: ReconstructedEvent[] = target.members.map((member, index) => {
    const startSec = parseClockToSec(member.time)
    const endSec = startSec + 40
    return {
      ...target,
      id: `${target.id}-split-${index}`,
      time: member.time,
      clock: member.clock,
      endTime: formatSecClock(endSec),
      endClock: formatSecClock(endSec).slice(0, 5),
      startSec,
      endSec,
      durationSec: 40,
      title: `${target.title} #${index + 1}`,
      titleZh: `${target.titleZh} #${index + 1}`,
      sourceAlarmIds: [member.id],
      sourceRowIds: [member.rowId],
      members: [member],
      summary: member.message,
      summaryZh: `从合并事件拆分 · ${member.code}`,
      focused: index === 0,
      kept: true,
    }
  })
  return [...events.filter((event) => event.id !== eventId), ...pieces].sort(
    (a, b) => a.startSec - b.startSec || a.hop - b.hop,
  )
}

export function createCustomGroup(
  events: ReconstructedEvent[],
  groups: ReconstructionGroup[],
  eventIds: string[],
  nameZh: string,
  name: string,
): { events: ReconstructedEvent[]; groups: ReconstructionGroup[] } {
  const ids = eventIds.filter((id) => events.some((event) => event.id === id && event.kept))
  if (ids.length === 0) return { events, groups }
  const scenarioKey = events.find((event) => event.id === ids[0])?.scenarioKey ?? "power"
  const groupId = `grp-custom-${Date.now()}`
  const group: ReconstructionGroup = {
    id: groupId,
    name,
    nameZh,
    chain: chainForScenario(scenarioKey),
    eventIds: ids,
    auto: false,
  }
  return {
    events: events.map((event) => (ids.includes(event.id) ? { ...event, groupId } : event)),
    groups: [...groups, group],
  }
}

export function scenarioTitle(key: ScenarioKey) {
  return scenarios[key].incident.titleZh
}
