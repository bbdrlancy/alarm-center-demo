"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronDown, Trash2 } from "lucide-react"
import { Panel } from "@/components/primitives"
import {
  CHAIN_META,
  generateEventSet,
  groupEventsByDevice,
  keptEvents,
  rawAlarmLanesForDevice,
  reconstructionTimeSpan,
  setMemberKept,
  type EventSet,
  type ReconstructionGroup,
  type ReconstructedEvent,
  type RawAlarmLane,
} from "@/lib/event-reconstruction"
import { cn } from "@/lib/utils"

const SEVERITY_LINE: Record<string, string> = {
  Critical: "bg-[#e53935]",
  Major: "bg-[#fb8c00]",
  Minor: "bg-[#c9a227]",
  Warning: "bg-slate-400",
}

const LABEL_COL = "minmax(11rem,max-content)"

function formatAxisClock(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function buildTimeTicks(originSec: number, endSec: number) {
  const span = Math.max(endSec - originSec, 1)
  const count = span < 20 * 60 ? 3 : span < 3 * 3600 ? 4 : 5
  return Array.from({ length: count }, (_, i) => {
    const sec = originSec + (span * i) / (count - 1)
    return { sec, label: formatAxisClock(sec), pct: (i / (count - 1)) * 100 }
  })
}

function durationLabel(sec: number) {
  return sec >= 60 ? `${Math.round(sec / 60)}m` : `${Math.max(1, Math.round(sec))}s`
}

function LifecycleTrack({
  originSec,
  totalSpan,
  startSec,
  endSec,
  activeClass,
  title,
  markStart,
  tip,
}: {
  originSec: number
  totalSpan: number
  startSec: number
  endSec: number
  activeClass: string
  title?: string
  markStart?: boolean
  tip?: string
}) {
  const left = ((startSec - originSec) / totalSpan) * 100
  const width = Math.max(0.8, ((endSec - startSec) / totalSpan) * 100)
  return (
    <div className="relative h-4 w-full rounded-sm bg-muted/30" title={markStart ? undefined : title}>
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-muted-foreground/25" />
      <div
        className={cn("absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full", activeClass)}
        style={{ left: `${left}%`, width: `${width}%` }}
      />
      {markStart ? (
        <span
          title={tip ?? title}
          className={cn(
            "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-sm",
            activeClass,
          )}
          style={{ left: `${left}%` }}
        />
      ) : null}
    </div>
  )
}

export function EventReconstructionTimeline({
  events,
  groups,
  onEventsChange,
  eventSet,
  onGenerateEventSet,
}: {
  events: ReconstructedEvent[]
  groups: ReconstructionGroup[]
  onEventsChange: (events: ReconstructedEvent[]) => void
  onGroupsChange?: (groups: ReconstructionGroup[]) => void
  eventSet: EventSet | null
  onGenerateEventSet: (set: EventSet) => void
}) {
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const keptAlarmCount = useMemo(
    () => events.reduce((sum, event) => sum + event.members.filter((m) => m.kept).length, 0),
    [events],
  )
  const kept = useMemo(() => keptEvents(events), [events])
  const deviceGroups = useMemo(() => groupEventsByDevice(events), [events])
  const span = useMemo(() => reconstructionTimeSpan(events), [events])
  const originSec = span.originSec
  const totalSpan = Math.max(span.endSec - originSec, 1)
  const timeTicks = useMemo(() => buildTimeTicks(originSec, span.endSec), [originSec, span.endSec])

  useEffect(() => {
    if (deviceGroups.length === 0) {
      setExpandedDevice(null)
      setSelectedRowId(null)
      return
    }
    setExpandedDevice((prev) =>
      prev && deviceGroups.some((group) => group.device === prev) ? prev : deviceGroups[0]!.device,
    )
  }, [deviceGroups])

  if (events.length === 0) {
    return (
      <Panel
        id="event-reconstruction-timeline"
        title="事件重建时间线"
        subtitle="Event Reconstruction Timeline"
        description="勾选原始告警后，将自动构建事件传播时间线"
      >
        <p className="text-[12px] text-muted-foreground">
          请先在上方选择原始告警，系统将按设备分组重建 Event Lifecycle。
        </p>
      </Panel>
    )
  }

  function handleGenerate() {
    const set = generateEventSet(events, groups)
    if (set) onGenerateEventSet(set)
  }

  function selectAlarmLane(lane: RawAlarmLane, device: string) {
    setExpandedDevice(device)
    setSelectedRowId((prev) => (prev === lane.rowId ? null : lane.rowId))
  }

  function excludeSelected(lane: RawAlarmLane) {
    onEventsChange(setMemberKept(events, lane.rowId, false))
    setSelectedRowId(null)
  }

  function restoreAlarm(lane: RawAlarmLane) {
    onEventsChange(setMemberKept(events, lane.rowId, true))
  }

  return (
    <Panel
      id="event-reconstruction-timeline"
      title="事件重建时间线"
      subtitle="Event Reconstruction Timeline"
      description="设备生命线 · 展开为原始告警事件线"
      bodyClassName="p-0"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-[11px] text-muted-foreground">
          已重建 <span className="font-mono font-bold text-foreground">{events.length}</span> · 设备{" "}
          <span className="font-mono font-bold text-foreground">{deviceGroups.length}</span> · 告警保留{" "}
          <span className="font-mono font-bold text-foreground">{keptAlarmCount}</span>
        </span>
      </div>

      <div className="border-b border-border px-4 py-2.5">
        <div className="mb-1.5 text-[12px] font-semibold text-foreground">设备生命周期</div>

        <div
          className="mb-1 grid items-end gap-2 px-1"
          style={{ gridTemplateColumns: `${LABEL_COL} minmax(0,1fr) 2.5rem` }}
        >
          <div className="text-[9px] text-muted-foreground">时间</div>
          <div className="relative h-4">
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
            {timeTicks.map((tick) => (
              <div
                key={tick.label}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${tick.pct}%` }}
              >
                <span className="h-1.5 w-px bg-muted-foreground/50" />
                <span className="mt-0.5 font-mono text-[9px] tabular text-muted-foreground">{tick.label}</span>
              </div>
            ))}
          </div>
          <div />
        </div>

        <div className="space-y-0.5">
          {deviceGroups.map((group) => {
            const open = expandedDevice === group.device
            const deviceStart = Math.min(...group.events.map((e) => e.startSec))
            const deviceEnd = Math.max(...group.events.map((e) => e.endSec))
            const isRoot = group.hop === 0
            const alarmLanes = rawAlarmLanesForDevice(group.events)
            const keptLanes = alarmLanes.filter((lane) => lane.kept).length
            const deviceDur = durationLabel(deviceEnd - deviceStart)
            return (
              <div key={group.device} className="rounded-md border border-border/60 bg-card/30">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedDevice(open ? null : group.device)
                    if (open) setSelectedRowId(null)
                  }}
                  className="grid w-full items-center gap-2 px-1 py-1 text-left"
                  style={{ gridTemplateColumns: `${LABEL_COL} minmax(0,1fr) 2.5rem` }}
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <ChevronDown className={cn("size-3 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
                    <span className="text-[11px] font-semibold text-foreground">{group.device}</span>
                    <span className="font-mono text-[9px] tabular text-muted-foreground">
                      {keptLanes}/{alarmLanes.length} · {deviceDur}
                    </span>
                  </div>
                  <LifecycleTrack
                    originSec={originSec}
                    totalSpan={totalSpan}
                    startSec={deviceStart}
                    endSec={deviceEnd}
                    activeClass={isRoot ? "bg-[#e53935]" : "bg-[#0288d1]"}
                    title={`${group.device} · ${deviceDur}`}
                  />
                  <div className="text-right font-mono text-[10px] tabular text-muted-foreground">{deviceDur}</div>
                </button>

                {open ? (
                  <div className="pb-1 pl-3 pr-1">
                    {alarmLanes.map((lane) => {
                      const active = selectedRowId === lane.rowId
                      const tip = `${lane.code} · ${lane.time} · ${lane.severity}\n${lane.message}`
                      return (
                        <div
                          key={lane.rowId}
                          className={cn(
                            "grid w-full items-center gap-2 rounded px-1 py-0.5",
                            !lane.kept && "opacity-40",
                            active && "bg-primary/8",
                          )}
                          style={{ gridTemplateColumns: `${LABEL_COL} minmax(0,1fr) 2rem 1.75rem` }}
                        >
                          <button
                            type="button"
                            onClick={() => selectAlarmLane(lane, group.device)}
                            className="pl-4 whitespace-nowrap text-left font-mono text-[10px] font-semibold text-foreground"
                          >
                            {lane.code}
                          </button>
                          <button
                            type="button"
                            onClick={() => selectAlarmLane(lane, group.device)}
                            className="min-w-0"
                          >
                            <LifecycleTrack
                              originSec={originSec}
                              totalSpan={totalSpan}
                              startSec={lane.startSec}
                              endSec={lane.endSec}
                              activeClass={SEVERITY_LINE[lane.severity] ?? "bg-[#0288d1]"}
                              tip={tip}
                              markStart
                            />
                          </button>
                          <div className="text-right font-mono text-[10px] tabular text-muted-foreground">
                            {lane.clock}
                          </div>
                          <div className="flex justify-end">
                            {active && lane.kept ? (
                              <button
                                type="button"
                                title="排除此告警"
                                onClick={() => excludeSelected(lane)}
                                className="grid size-6 place-items-center rounded border border-border text-muted-foreground hover:border-[var(--p1)]/40 hover:text-[var(--p1)]"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            ) : null}
                            {!lane.kept ? (
                              <button
                                type="button"
                                title="恢复此告警"
                                onClick={() => restoreAlarm(lane)}
                                className="grid size-6 place-items-center rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                              >
                                <Check className="size-3" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={keptAlarmCount === 0 || kept.length === 0}
            className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground disabled:opacity-40"
          >
            Generate Event Set
            <span className="font-normal opacity-90">生成事件集</span>
          </button>
          {eventSet ? (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              已生成 · {eventSet.eventCount} events / {eventSet.alarmCount} alarms
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">可先排除无关告警，再生成事件集</span>
          )}
        </div>
      </div>
    </Panel>
  )
}

export function EventGroupPanel({
  events,
  groups,
  eventSet,
}: {
  events: ReconstructedEvent[]
  groups: ReconstructionGroup[]
  eventSet: EventSet | null
}) {
  const chains = (Object.keys(CHAIN_META) as (keyof typeof CHAIN_META)[]).map((chain) => {
    const meta = CHAIN_META[chain]
    const chainGroups = groups.filter((group) => group.chain === chain)
    const eventIds = new Set(chainGroups.flatMap((group) => group.eventIds))
    const chainEvents = events.filter((event) => eventIds.has(event.id) || event.scenarioKey === meta.scenarioKey)
    return { chain, meta, groups: chainGroups, events: chainEvents }
  })

  return (
    <Panel
      id="event-group-panel"
      title="事件组面板"
      subtitle="Event Group Panel"
      description="Power / Cooling / Storage / Network 故障链分组"
    >
      <div className="mb-3 text-[11px] text-muted-foreground">将保留的事件归入故障链，供收敛使用</div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {chains.map(({ chain, meta, groups: chainGroups, events: chainEvents }) => (
          <article key={chain} className="rounded-lg border border-border bg-muted/15 px-3 py-2.5">
            <div className="text-[12px] font-bold text-foreground">{meta.zh}</div>
            <div className="text-[10px] text-muted-foreground">{meta.en}</div>
            <div className="mt-2 font-mono text-[18px] font-extrabold tabular text-foreground">
              {keptEvents(chainEvents).length}
              <span className="ml-1 text-[11px] font-semibold text-muted-foreground">events</span>
            </div>
            <ul className="mt-2 space-y-1">
              {chainGroups.length === 0 ? (
                <li className="text-[10px] text-muted-foreground">暂无分组</li>
              ) : (
                chainGroups.map((group) => (
                  <li key={group.id} className="rounded border border-border/70 bg-card px-2 py-1">
                    <div className="text-[11px] font-semibold text-foreground">{group.nameZh}</div>
                    <div className="text-[9px] text-muted-foreground">
                      {group.name} · {group.eventIds.length} nodes
                      {group.auto ? " · auto" : ""}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </article>
        ))}
      </div>
      {eventSet ? (
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-[12px]">
          <div className="font-semibold text-primary">
            {eventSet.nameZh} · {eventSet.name}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {eventSet.eventCount} events · {eventSet.alarmCount} source alarms · {eventSet.scenarioKeys.join(", ")} ·{" "}
            {eventSet.generatedAt}
          </div>
        </div>
      ) : null}
    </Panel>
  )
}
