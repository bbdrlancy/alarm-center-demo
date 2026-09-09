"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { ConvergenceSimulator } from "@/components/rca/convergence-simulator"
import { EventExplorer } from "@/components/rca/event-explorer"
import {
  EventGroupPanel,
  EventReconstructionTimeline,
} from "@/components/rca/event-reconstruction-timeline"
import { InvestigationChatDialog } from "@/components/rca/investigation-chat-dialog"
import { Panel } from "@/components/primitives"
import { scenarios, type ScenarioKey } from "@/data/scenarios"
import type { SimulatorIncident } from "@/lib/convergence-simulator"
import {
  buildReconstructionFromAlarms,
  eventSetToInventoryRows,
  type EventSet,
  type ReconstructionGroup,
  type ReconstructedEvent,
} from "@/lib/event-reconstruction"
import { locateAlarmOnTwin } from "@/lib/impact-twin"
import {
  getInventoryRulePreview,
  resolveInventoryAlarm,
  scenarioFromEventRow,
  type InventoryEventRow,
} from "@/lib/manual-event-inventory"
import { cn } from "@/lib/utils"

const DISCOVERY_STEPS = [
  { zh: "原始告警", en: "Raw Alarm" },
  { zh: "事件重建", en: "Event Reconstruction" },
  { zh: "事件集", en: "Event Set" },
  { zh: "收敛模拟", en: "Convergence" },
  { zh: "候选事故", en: "Candidate Incident" },
  { zh: "创建事故", en: "Create Manual Incident" },
] as const

export function EventExplorationWorkspace() {
  const [focusKey, setFocusKey] = useState<ScenarioKey>("power")
  const [chatOpen, setChatOpen] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<InventoryEventRow | null>(null)
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [events, setEvents] = useState<ReconstructedEvent[]>([])
  const [groups, setGroups] = useState<ReconstructionGroup[]>([])
  const [eventSet, setEventSet] = useState<EventSet | null>(null)
  const [candidate, setCandidate] = useState<SimulatorIncident | null>(null)
  const [createdIncident, setCreatedIncident] = useState<{
    id: string
    titleZh: string
    title: string
  } | null>(null)

  const rawPreview = useMemo(() => getInventoryRulePreview("raw"), [])
  const location = useMemo(() => {
    if (!selectedEvent) return null
    return locateAlarmOnTwin(scenarios[scenarioFromEventRow(selectedEvent)], resolveInventoryAlarm(selectedEvent))
  }, [selectedEvent])

  const selectedRows = useMemo(
    () => rawPreview.rows.filter((row) => checkedIds.includes(row.id)),
    [rawPreview.rows, checkedIds],
  )

  const selectionKey = useMemo(() => [...checkedIds].sort().join("|"), [checkedIds])

  useEffect(() => {
    const model = buildReconstructionFromAlarms(selectedRows)
    setEvents(model.events)
    setGroups(model.groups)
    setEventSet(null)
    setCandidate(null)
    setCreatedIncident(null)
  }, [selectionKey]) // eslint-disable-line react-hooks/exhaustive-deps -- rebuild only when selection identity changes

  const simulatorRows = useMemo(() => {
    if (!eventSet) return []
    return eventSetToInventoryRows(eventSet, events, rawPreview.rows)
  }, [eventSet, events, rawPreview.rows])

  const activeStep = !selectedRows.length
    ? 0
    : !eventSet
      ? events.length
        ? 1
        : 0
      : !candidate
        ? 3
        : createdIncident
          ? 5
          : 4

  return (
    <div
      id="event-exploration-workspace"
      className={cn(
        "grid items-start gap-4 transition-[grid-template-columns] duration-300",
        chatOpen ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "lg:grid-cols-[minmax(0,1fr)_44px]",
      )}
    >
      <div className="min-w-0 space-y-4">
        <div className="rounded-lg border border-border bg-card px-4 py-2.5 shadow-card">
          <div className="text-[11px] font-bold text-l3">事件探索</div>
          <div className="text-[13px] font-semibold text-l1">Event Discovery · 事件发现工作台</div>
          <div className="text-[10px] text-l4">
            Alarm → Event → Incident · 在收敛前完成事件重建、传播验证与筛选
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {DISCOVERY_STEPS.map((step, index) => (
              <div key={step.en} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "rounded-md border px-2 py-1",
                    index <= activeStep
                      ? "border-primary/35 bg-primary/10 text-primary"
                      : "border-border bg-muted/20 text-muted-foreground",
                  )}
                >
                  <div className="text-[11px] font-semibold">{step.zh}</div>
                  <div className="text-[9px] opacity-80">{step.en}</div>
                </div>
                {index < DISCOVERY_STEPS.length - 1 ? (
                  <ArrowRight className="size-3 text-muted-foreground/50" />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <Panel
          id="raw-alarm-selection"
          title="原始告警"
          subtitle="Raw Alarm"
          description="批量选择原始告警，作为事件重建的输入"
          bodyClassName="p-0"
        >
          <div className="px-4 py-3">
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <div className="min-w-[140px]">
                <div className="text-[10px] font-bold text-l3">告警选择</div>
                <div className="text-[9px] text-l4">Raw Alarm Selection</div>
              </div>
              <div className="text-[12px] text-l2">
                已选 <span className="font-mono text-[14px] font-extrabold text-l1">{selectedRows.length}</span> 条
              </div>
              <button
                type="button"
                disabled={checkedIds.length === 0}
                onClick={() => setCheckedIds([])}
                className="rounded-md border border-border px-2.5 py-1 text-[11px] text-l2 disabled:opacity-40"
              >
                清除选择
              </button>
            </div>

            <EventExplorer
              rows={rawPreview.rows}
              stageKey="raw"
              stageLabel={`全量原始告警 · ${rawPreview.rows.length}`}
              showIncident
              enableTimeRange
              selectable
              checkedIds={checkedIds}
              onCheckedIdsChange={setCheckedIds}
              selectedId={selectedEvent?.id}
              onSelectRow={(row) => {
                const event = row as InventoryEventRow
                setSelectedEvent(event)
                setFocusKey(scenarioFromEventRow(event))
              }}
            />
          </div>
        </Panel>

        {selectedRows.length > 0 ? (
          <>
            <EventReconstructionTimeline
              events={events}
              groups={groups}
              onEventsChange={setEvents}
              onGroupsChange={setGroups}
              eventSet={eventSet}
              onGenerateEventSet={(set) => {
                setEventSet(set)
                setCandidate(null)
                setCreatedIncident(null)
              }}
            />

            <EventGroupPanel
              events={events}
              groups={groups}
              eventSet={eventSet}
            />
          </>
        ) : (
          <Panel title="事件重建时间线" subtitle="Event Reconstruction Timeline">
            <p className="text-[12px] text-muted-foreground">
              勾选原始告警后，将自动构建传播时间线（如 UPS → PDU → Rack → GPU → Service）。
            </p>
          </Panel>
        )}

        {eventSet ? (
          <div id="event-set-stage" className="scroll-mt-[88px] space-y-3">
            <Panel title="事件集" subtitle="Event Set" description="收敛模拟器的输入对象">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[14px] font-bold text-foreground">{eventSet.nameZh}</div>
                  <div className="text-[11px] text-muted-foreground">{eventSet.name}</div>
                  <div className="mt-1 font-mono text-[12px] text-l2">
                    {eventSet.eventCount} events · {eventSet.alarmCount} source alarms ·{" "}
                    {eventSet.scenarioKeys.join(" / ")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEventSet(null)
                    setCandidate(null)
                    setCreatedIncident(null)
                  }}
                  className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
                >
                  重置 Event Set
                </button>
              </div>
            </Panel>

            <ConvergenceSimulator
              selectedRows={simulatorRows}
              inputLabel={`Event Set · ${eventSet.eventCount} events → ${simulatorRows.length} alarms`}
              selectedIncidentId={candidate?.id ?? null}
              onSelectIncident={setCandidate}
              onLocate={(row) => {
                setSelectedEvent(row)
                setFocusKey(scenarioFromEventRow(row))
              }}
            />
          </div>
        ) : selectedRows.length > 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-3 text-[12px] text-muted-foreground">
            在事件重建时间线中筛选并 <span className="font-semibold text-foreground">Generate Event Set</span>{" "}
            后，将启动基于 Event Sets 的收敛模拟器。
          </p>
        ) : null}

        {candidate ? (
          <CreateManualIncident
            candidate={candidate}
            created={createdIncident}
            onCreate={() => {
              setCreatedIncident({
                id: `MANUAL-${candidate.incidentId}-${Date.now().toString().slice(-4)}`,
                titleZh: candidate.titleZh,
                title: candidate.title,
              })
            }}
          />
        ) : null}
      </div>

      <InvestigationChatDialog
        focusKey={focusKey}
        ruleKey="raw"
        selectedEvent={selectedEvent}
        locationDevice={location?.device}
        locationPath={location?.sentence}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  )
}

function CreateManualIncident({
  candidate,
  created,
  onCreate,
}: {
  candidate: SimulatorIncident
  created: { id: string; titleZh: string; title: string } | null
  onCreate: () => void
}) {
  return (
    <Panel
      id="create-manual-incident"
      title="创建人工事故"
      subtitle="Create Manual Incident"
      description="将候选事故提升为可调查的人工事故记录"
    >
      {created ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <CheckCircle2 className="mt-0.5 size-5 text-primary" />
          <div>
            <div className="text-[14px] font-bold text-foreground">已创建人工事故</div>
            <div className="mt-1 font-mono text-[12px] text-l2">{created.id}</div>
            <div className="mt-1 text-[13px] font-semibold text-l1">{created.titleZh}</div>
            <div className="text-[11px] text-muted-foreground">{created.title}</div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              可前往事故调查页继续证据重建与核验（演示环境本地创建）。
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/15 px-3 py-2.5">
            <div className="text-[10px] font-semibold text-muted-foreground">候选事故 · Candidate</div>
            <div className="mt-1 text-[15px] font-bold text-foreground">{candidate.titleZh}</div>
            <div className="text-[11px] text-muted-foreground">{candidate.title}</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <MiniStat zh="事故编号" value={candidate.incidentId} />
              <MiniStat zh="置信度" value={`${candidate.confidence}%`} />
              <MiniStat zh="归并告警" value={String(candidate.merged)} />
            </div>
          </div>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground"
          >
            Create Manual Incident
            <span className="font-normal opacity-90">创建人工事故</span>
          </button>
        </div>
      )}
    </Panel>
  )
}

function MiniStat({ zh, value }: { zh: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-card px-2.5 py-1.5">
      <div className="text-[9px] text-muted-foreground">{zh}</div>
      <div className="font-mono text-[13px] font-bold text-foreground">{value}</div>
    </div>
  )
}
