"use client"

import { useMemo, useRef, useState, type DragEvent, type PointerEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ClipboardList, GripVertical } from "lucide-react"
import {
  getRecommendedActions,
  incidentIdToScenarioKey,
  rcaHref,
  type RecommendedActionRow,
  type ScenarioKey,
} from "@/data/scenarios"
import { getCommandIncident } from "@/lib/incident-command"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { PriorityBadge, Panel } from "@/components/primitives"
import { cn } from "@/lib/utils"

type ActionStatus = RecommendedActionRow["status"]

const STATUS_COLUMNS: {
  key: ActionStatus
  hint: string
}[] = [
  { key: "Suggested", hint: "待启动" },
  { key: "In Progress", hint: "执行中" },
  { key: "Completed", hint: "已完成" },
]

const actionStatusStyle: Record<ActionStatus, string> = {
  Suggested: "bg-muted text-muted-foreground border-border",
  "In Progress": "bg-[var(--p2)]/15 text-[var(--p2)] border-[var(--p2)]/35",
  Completed: "bg-primary/12 text-primary border-primary/35",
}

const columnAccent: Record<ActionStatus, string> = {
  Suggested: "border-border",
  "In Progress": "border-[var(--p2)]/40",
  Completed: "border-primary/35",
}

function statusFromPoint(clientX: number, clientY: number): ActionStatus | null {
  const el = document.elementFromPoint(clientX, clientY)
  const column = el?.closest("[data-status-column]")
  const status = column?.getAttribute("data-status-column")
  if (status === "Suggested" || status === "In Progress" || status === "Completed") return status
  return null
}

function completionOf(row: RecommendedActionRow) {
  if (row.status === "Completed") return 100
  if (row.status === "Suggested") return 0
  return getCommandIncident(row.scenarioKey).nextAction.completion
}

export function RecommendedActions({
  selectedIncidentId,
  actions: controlledActions,
  onActionsChange,
  onSelectIncident,
}: {
  selectedIncidentId?: string
  actions?: RecommendedActionRow[]
  onActionsChange?: (actions: RecommendedActionRow[]) => void
  onSelectIncident?: (incidentId: string, scenarioKey: ScenarioKey) => void
} = {}) {
  const router = useRouter()
  const { setScenarioKey } = useDemoScenario()
  const [internalActions, setInternalActions] = useState<RecommendedActionRow[]>(() => getRecommendedActions())
  const actions = controlledActions ?? internalActions
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overStatus, setOverStatus] = useState<ActionStatus | null>(null)
  const draggingIdRef = useRef<string | null>(null)

  const grouped = useMemo(() => {
    const map: Record<ActionStatus, RecommendedActionRow[]> = {
      Suggested: [],
      "In Progress": [],
      Completed: [],
    }
    for (const row of actions) {
      map[row.status].push(row)
    }
    return map
  }, [actions])

  const setStatus = (incidentId: string, status: ActionStatus) => {
    const next = actions.map((row) => (row.incidentId === incidentId ? { ...row, status } : row))
    if (onActionsChange) onActionsChange(next)
    else setInternalActions(next)
  }

  const openRca = (incidentId: string) => {
    setScenarioKey(incidentIdToScenarioKey(incidentId))
    router.push(rcaHref(incidentId))
  }

  const beginDrag = (incidentId: string) => {
    draggingIdRef.current = incidentId
    setDraggingId(incidentId)
  }

  const updateOverStatus = (clientX: number, clientY: number) => {
    const next = statusFromPoint(clientX, clientY)
    setOverStatus((prev) => (prev === next ? prev : next))
  }

  const finishDrag = (clientX: number, clientY: number) => {
    const incidentId = draggingIdRef.current
    const status = statusFromPoint(clientX, clientY)
    if (incidentId && status) setStatus(incidentId, status)
    draggingIdRef.current = null
    setDraggingId(null)
    setOverStatus(null)
  }

  const onDragStart = (event: DragEvent<HTMLElement>, incidentId: string) => {
    event.dataTransfer.setData("text/plain", incidentId)
    event.dataTransfer.effectAllowed = "move"
    beginDrag(incidentId)
  }

  const onDragOver = (event: DragEvent<HTMLElement>, status: ActionStatus) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    if (overStatus !== status) setOverStatus(status)
  }

  const onDrop = (event: DragEvent<HTMLElement>, status: ActionStatus) => {
    event.preventDefault()
    const incidentId = event.dataTransfer.getData("text/plain") || draggingIdRef.current
    if (incidentId) setStatus(incidentId, status)
    draggingIdRef.current = null
    setDraggingId(null)
    setOverStatus(null)
  }

  const onDragEnd = () => {
    draggingIdRef.current = null
    setDraggingId(null)
    setOverStatus(null)
  }

  const onHandlePointerDown = (event: PointerEvent<HTMLButtonElement>, incidentId: string) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    beginDrag(incidentId)
  }

  const onHandlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!draggingIdRef.current) return
    updateOverStatus(event.clientX, event.clientY)
  }

  const onHandlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!draggingIdRef.current) return
    finishDrag(event.clientX, event.clientY)
  }

  return (
    <Panel
      title="执行中心"
      subtitle="L4 Execution Center"
      icon={<ClipboardList className="size-4" />}
      bodyClassName="p-3"
    >
      <div id="recommended-actions" className="grid gap-3 lg:grid-cols-3">
        {STATUS_COLUMNS.map((column) => {
          const rows = grouped[column.key]
          const isOver = overStatus === column.key
          return (
            <section
              key={column.key}
              data-status-column={column.key}
              onDragOver={(event) => onDragOver(event, column.key)}
              onDrop={(event) => onDrop(event, column.key)}
              className={cn(
                "flex min-h-[220px] flex-col rounded-lg border bg-muted/30 p-2 transition-colors",
                columnAccent[column.key],
                isOver && "bg-primary/8 ring-2 ring-primary/40",
              )}
            >
              <header className="mb-2 flex items-center justify-between gap-2 px-1 py-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                      actionStatusStyle[column.key],
                    )}
                  >
                    {column.key}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{column.hint}</span>
                </div>
                <span className="tabular text-[11px] font-semibold text-muted-foreground">
                  {rows.length}
                </span>
              </header>

              <div className="flex flex-1 flex-col gap-2">
                {rows.length === 0 ? (
                  <div className="grid flex-1 place-items-center rounded-md border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
                    拖入卡片以更新为 {column.key}
                  </div>
                ) : (
                  rows.map((row) => {
                    const isDragging = draggingId === row.incidentId
                    const selected = selectedIncidentId === row.incidentId
                    const completion = completionOf(row)
                    return (
                      <article
                        key={row.incidentId}
                        id={`action-card-${row.incidentId}`}
                        draggable
                        onDragStart={(event) => onDragStart(event, row.incidentId)}
                        onDragEnd={onDragEnd}
                        onClick={() => onSelectIncident?.(row.incidentId, row.scenarioKey)}
                        className={cn(
                          "relative overflow-hidden rounded-lg border bg-card p-3 shadow-sm transition-all duration-300",
                          isDragging && "opacity-40",
                          selected && "border-primary/50 ring-2 ring-primary/20",
                          onSelectIncident && "cursor-pointer",
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            aria-label={`Move ${row.incidentId}`}
                            onPointerDown={(event) => onHandlePointerDown(event, row.incidentId)}
                            onPointerMove={onHandlePointerMove}
                            onPointerUp={onHandlePointerUp}
                            className="mt-0.5 cursor-grab rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
                          >
                            <GripVertical className="size-3.5" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <PriorityBadge priority={row.priority} />
                              <span className="font-mono text-[11px] font-semibold text-foreground">
                                {row.incidentId}
                              </span>
                            </div>
                            <p className="mt-1.5 text-[12px] font-medium leading-snug text-foreground">
                              {row.action}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                              <span>{row.ownerTeam}</span>
                              <span className="tabular">ETA {row.eta}</span>
                              <span className="font-semibold text-[var(--p1)]">
                                -{row.riskReduction}% risk
                              </span>
                              <span className="font-semibold text-foreground">Progress {completion}%</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${completion}%` }}
                              />
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <label className="sr-only" htmlFor={`action-status-${row.incidentId}`}>
                                Change status
                              </label>
                              <select
                                id={`action-status-${row.incidentId}`}
                                value={row.status}
                                onChange={(event) =>
                                  setStatus(row.incidentId, event.target.value as ActionStatus)
                                }
                                onClick={(event) => event.stopPropagation()}
                                className={cn(
                                  "rounded-md border bg-card px-2 py-1 text-[10px] font-semibold",
                                  actionStatusStyle[row.status],
                                )}
                              >
                                {STATUS_COLUMNS.map((option) => (
                                  <option key={option.key} value={option.key}>
                                    {option.key}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => openRca(row.incidentId)}
                                className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/8 px-2.5 py-1 text-[10px] font-semibold text-primary hover:bg-primary/15"
                              >
                                Open RCA
                                <ArrowRight className="size-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </section>
          )
        })}
      </div>
    </Panel>
  )
}
