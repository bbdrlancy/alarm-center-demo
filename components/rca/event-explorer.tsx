"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { ChevronDown, ChevronRight, Search } from "lucide-react"
import type { EventRow, TaggedAlarm } from "@/lib/alarm-convergence"
import type { AlarmSeverity } from "@/lib/incident-data"
import { eventInTimeRange, getInventoryMinutes, getInventoryTimeWindows } from "@/lib/manual-event-inventory"
import { cn } from "@/lib/utils"

const severityTone: Record<AlarmSeverity, { color: string; bg: string }> = {
  Critical: { color: "#e53935", bg: "rgba(229,57,53,0.14)" },
  Major: { color: "#fb8c00", bg: "rgba(251,140,0,0.14)" },
  Minor: { color: "#c9a227", bg: "rgba(201,162,39,0.16)" },
  Warning: { color: "#0078d4", bg: "rgba(0,120,212,0.14)" },
}

const PAGE_SIZE = 20
const ROW_H = 36
const META_H = 30
const MEMBER_H = 32
const VIEWPORT_H = 420

type SortKey = "timestamp" | "severity" | "device" | "summary" | "code" | "ruleApplied" | "aggregationGroup" | "category" | "status"

type FlatRow =
  | { id: string; kind: "event"; row: EventRow; height: number }
  | { id: string; kind: "meta"; row: EventRow; height: number }
  | { id: string; kind: "member"; row: EventRow; alarm: TaggedAlarm; height: number }

const SEVERITY_RANK: Record<string, number> = { Critical: 0, Major: 1, Minor: 2, Warning: 3 }

function SeverityBadge({ severity }: { severity: AlarmSeverity }) {
  const tone = severityTone[severity]
  return (
    <span
      className="inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
      style={{ color: tone.color, backgroundColor: tone.bg }}
    >
      {severity}
    </span>
  )
}

function Cell({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <div className={cn("flex h-full items-center truncate px-2 text-[11px] leading-none", className)} title={title}>
      {children}
    </div>
  )
}

const COLS = "36px 108px 80px 118px minmax(240px, 1.6fr) 150px 128px 128px 96px 80px"
const COLS_INCIDENT = "36px 108px 80px 118px 128px minmax(220px, 1.6fr) 150px 128px 128px 96px 80px"

export function EventExplorer({
  rows,
  stageLabel,
  highlightId,
  showIncident = false,
  selectedId,
  onSelectRow,
  enableTimeRange = false,
  selectable = false,
  checkedIds,
  onCheckedIdsChange,
}: {
  rows: EventRow[]
  stageKey: string
  stageLabel: string
  highlightId?: string
  showIncident?: boolean
  selectedId?: string
  onSelectRow?: (row: EventRow) => void
  enableTimeRange?: boolean
  selectable?: boolean
  checkedIds?: string[]
  onCheckedIdsChange?: (ids: string[]) => void
}) {
  const columns = selectable
    ? `32px ${showIncident ? COLS_INCIDENT : COLS}`
    : showIncident
      ? COLS_INCIDENT
      : COLS
  const [query, setQuery] = useState("")
  const [severity, setSeverity] = useState("all")
  const [category, setCategory] = useState("all")
  const [rule, setRule] = useState("all")
  const [group, setGroup] = useState("all")
  const [incident, setIncident] = useState("all")
  const [timePreset, setTimePreset] = useState("all")
  const [timeFrom, setTimeFrom] = useState("")
  const [timeTo, setTimeTo] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("timestamp")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<string[]>([])
  const [scrollTop, setScrollTop] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)
  const checked = checkedIds ?? []

  const categories = useMemo(() => [...new Set(rows.map((row) => row.category))].sort(), [rows])
  const rules = useMemo(() => [...new Set(rows.map((row) => row.ruleApplied))].sort(), [rows])
  const groups = useMemo(() => [...new Set(rows.map((row) => row.aggregationGroup))].sort(), [rows])
  const incidents = useMemo(
    () => [...new Set(rows.map((row) => row.incidentId).filter(Boolean) as string[])].sort(),
    [rows],
  )
  const timeWindows = useMemo(() => (enableTimeRange ? getInventoryTimeWindows(rows) : []), [enableTimeRange, rows])
  const minutes = useMemo(() => (enableTimeRange ? getInventoryMinutes(rows) : []), [enableTimeRange, rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((row) => {
        if (severity !== "all" && row.severity !== severity) return false
        if (category !== "all" && row.category !== category) return false
        if (rule !== "all" && row.ruleApplied !== rule) return false
        if (group !== "all" && row.aggregationGroup !== group) return false
        if (incident !== "all" && row.incidentId !== incident) return false
        if (enableTimeRange && !eventInTimeRange(row.timestamp, timeFrom || undefined, timeTo || undefined)) return false
        if (!q) return true
        const blob = [
          row.timestamp,
          row.severity,
          row.device,
          row.displayCode,
          row.summary,
          row.ruleApplied,
          row.aggregationGroup,
          row.category,
          row.status,
          row.incidentId ?? "",
          row.domain ?? "",
          row.incidentTitle ?? "",
          ...(row.members ?? []).flatMap((member) => [member.device, member.code, member.message, member.timestamp]),
        ]
          .join(" ")
          .toLowerCase()
        return blob.includes(q)
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1
        if (sortKey === "severity") {
          return ((SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9)) * dir
        }
        return String(a[sortKey]).localeCompare(String(b[sortKey])) * dir
      })
  }, [rows, query, severity, category, rule, group, incident, enableTimeRange, timeFrom, timeTo, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const flat = useMemo<FlatRow[]>(() => {
    const list: FlatRow[] = []
    for (const row of pageRows) {
      list.push({ id: row.id, kind: "event", row, height: ROW_H })
      if (row.expandable && expanded.includes(row.id)) {
        list.push({ id: `${row.id}-meta`, kind: "meta", row, height: META_H })
        for (const alarm of row.members ?? []) {
          list.push({ id: `${row.id}-${alarm.id}`, kind: "member", row, alarm, height: MEMBER_H })
        }
      }
    }
    return list
  }, [pageRows, expanded])

  const offsets = useMemo(() => {
    const starts: number[] = []
    let y = 0
    for (const item of flat) {
      starts.push(y)
      y += item.height
    }
    return { starts, total: y }
  }, [flat])

  const start = (() => {
    let i = 0
    while (i < flat.length && offsets.starts[i]! + flat[i]!.height < scrollTop) i += 1
    return Math.max(0, i - 2)
  })()
  const end = (() => {
    let i = start
    const limit = scrollTop + VIEWPORT_H
    while (i < flat.length && offsets.starts[i]! < limit) i += 1
    return Math.min(flat.length, i + 2)
  })()
  const visible = flat.slice(start, end)

  useEffect(() => {
    setPage(0)
    setExpanded([])
    setScrollTop(0)
    viewportRef.current?.scrollTo({ top: 0 })
  }, [rows, query, severity, category, rule, group, incident, timeFrom, timeTo, sortKey, sortDir])

  useEffect(() => {
    if (!highlightId) return
    const match = filtered.findIndex(
      (row) => row.alarmId === highlightId || row.members?.some((member) => member.id === highlightId),
    )
    if (match < 0) return
    setPage(Math.floor(match / PAGE_SIZE))
    const row = filtered[match]!
    if (row.expandable) {
      setExpanded((current) => (current.includes(row.id) ? current : [...current, row.id]))
    }
  }, [highlightId, filtered])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir(key === "timestamp" ? "asc" : "asc")
  }

  function toggleExpand(id: string) {
    setExpanded((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function applyTimePreset(id: string) {
    setTimePreset(id)
    if (id === "all") {
      setTimeFrom("")
      setTimeTo("")
      return
    }
    const window = timeWindows.find((item) => item.id === id)
    if (!window) return
    setTimeFrom(window.from)
    setTimeTo(window.to)
  }

  function toggleCheck(id: string) {
    if (!onCheckedIdsChange) return
    onCheckedIdsChange(checked.includes(id) ? checked.filter((item) => item !== id) : [...checked, id])
  }

  function toggleCheckAllFiltered() {
    if (!onCheckedIdsChange) return
    const ids = filtered.map((row) => row.id)
    const allOn = ids.length > 0 && ids.every((id) => checked.includes(id))
    onCheckedIdsChange(allOn ? checked.filter((id) => !ids.includes(id)) : [...new Set([...checked, ...ids])])
  }

  const filteredChecked = filtered.filter((row) => checked.includes(row.id)).length
  const allFilteredChecked = filtered.length > 0 && filteredChecked === filtered.length

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-[12px] font-semibold text-l3">事件浏览器</h3>
          <p className="text-[10px] text-l4">
            Event Explorer · {stageLabel} · {filtered.length} events
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2 top-2 size-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search timestamp / device / code / group"
            className="w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-2 text-[11px]"
          />
        </div>
        <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px]">
          <option value="all">Severity</option>
          <option value="Critical">Critical</option>
          <option value="Major">Major</option>
          <option value="Minor">Minor</option>
          <option value="Warning">Warning</option>
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px]">
          <option value="all">Category</option>
          {categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select value={rule} onChange={(event) => setRule(event.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px]">
          <option value="all">Rule</option>
          {rules.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select value={group} onChange={(event) => setGroup(event.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px]">
          <option value="all">Aggregation Group</option>
          {groups.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        {showIncident ? (
          <select value={incident} onChange={(event) => setIncident(event.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px]">
            <option value="all">全部事故 · All Incidents</option>
            {incidents.map((item) => (
              <option key={item} value={item}>
                {item === "UNLINKED" ? "UNLINKED · 未关联事故" : item}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {enableTimeRange ? (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-muted/20 px-2.5 py-2">
          <div className="mr-1 text-[10px] font-bold text-l3">
            时间范围
            <span className="ml-1 font-normal text-l4">Time Range</span>
          </div>
          <button
            type="button"
            onClick={() => applyTimePreset("all")}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px]",
              timePreset === "all" ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-l2",
            )}
          >
            全部时间
          </button>
          {timeWindows.map((window) => (
            <button
              key={window.id}
              type="button"
              onClick={() => applyTimePreset(window.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px]",
                timePreset === window.id ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-l2",
              )}
            >
              {window.zh}
            </button>
          ))}
          <label className="ml-1 flex items-center gap-1 text-[10px] text-l3">
            从
            <select
              value={timeFrom ? timeFrom.slice(0, 5) : ""}
              onChange={(event) => {
                const minute = event.target.value
                setTimePreset("custom")
                setTimeFrom(minute ? `${minute}:00.000` : "")
              }}
              className="rounded-md border border-border bg-background px-1.5 py-1 text-[11px] text-foreground"
            >
              <option value="">开始</option>
              {minutes.map((minute) => (
                <option key={`from-${minute}`} value={minute}>{minute}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1 text-[10px] text-l3">
            到
            <select
              value={timeTo ? timeTo.slice(0, 5) : ""}
              onChange={(event) => {
                const minute = event.target.value
                setTimePreset("custom")
                setTimeTo(minute ? `${minute}:59.999` : "")
              }}
              className="rounded-md border border-border bg-background px-1.5 py-1 text-[11px] text-foreground"
            >
              <option value="">结束</option>
              {minutes.map((minute) => (
                <option key={`to-${minute}`} value={minute}>{minute}</option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
        <div
          className="grid min-w-[1100px] border-b border-border bg-muted/50 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          style={{ gridTemplateColumns: columns }}
        >
          {selectable ? (
            <div className="flex items-center justify-center px-1">
              <input
                type="checkbox"
                checked={allFilteredChecked}
                ref={(el) => {
                  if (el) el.indeterminate = filteredChecked > 0 && !allFilteredChecked
                }}
                onChange={toggleCheckAllFiltered}
                aria-label="全选当前筛选"
                className="size-3.5 accent-primary"
              />
            </div>
          ) : null}
          <HeaderButton label="" />
          <HeaderButton label="Timestamp" active={sortKey === "timestamp"} dir={sortDir} onClick={() => toggleSort("timestamp")} />
          <HeaderButton label="Severity" active={sortKey === "severity"} dir={sortDir} onClick={() => toggleSort("severity")} />
          <HeaderButton label="Device" active={sortKey === "device"} dir={sortDir} onClick={() => toggleSort("device")} />
          {showIncident ? <HeaderButton label="Incident" /> : null}
          <HeaderButton label="说明" active={sortKey === "summary"} dir={sortDir} onClick={() => toggleSort("summary")} />
          <HeaderButton label="Alarm Code" active={sortKey === "code"} dir={sortDir} onClick={() => toggleSort("code")} />
          <HeaderButton label="Rule Applied" active={sortKey === "ruleApplied"} dir={sortDir} onClick={() => toggleSort("ruleApplied")} />
          <HeaderButton label="Aggregation Group" active={sortKey === "aggregationGroup"} dir={sortDir} onClick={() => toggleSort("aggregationGroup")} />
          <HeaderButton label="Category" active={sortKey === "category"} dir={sortDir} onClick={() => toggleSort("category")} />
          <HeaderButton label="Status" active={sortKey === "status"} dir={sortDir} onClick={() => toggleSort("status")} />
        </div>

        <div
          ref={viewportRef}
          className="relative overflow-auto bg-card"
          style={{ height: VIEWPORT_H }}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        >
          <div className="min-w-[1100px]" style={{ height: Math.max(offsets.total, VIEWPORT_H - 1), position: "relative" }}>
            {visible.map((item, index) => {
              const top = offsets.starts[start + index]!
              const highlighted =
                item.row.id === selectedId ||
                (highlightId != null &&
                  (item.row.alarmId === highlightId ||
                    (item.kind === "member" && item.alarm.id === highlightId) ||
                    item.row.members?.some((member) => member.id === highlightId)))
              return (
                <div
                  key={item.id}
                  className="absolute left-0 right-0"
                  style={{ top, height: item.height }}
                >
                  {item.kind === "event" ? (
                    <EventGridRow
                      row={item.row}
                      open={expanded.includes(item.row.id)}
                      highlighted={Boolean(highlighted)}
                      columns={columns}
                      showIncident={showIncident ?? false}
                      selectable={selectable}
                      checked={checked.includes(item.row.id)}
                      onCheck={() => toggleCheck(item.row.id)}
                      onToggle={() => {
                        onSelectRow?.(item.row)
                        if (item.row.expandable) toggleExpand(item.row.id)
                      }}
                    />
                  ) : null}
                  {item.kind === "meta" ? <GroupMetaRow row={item.row} /> : null}
                  {item.kind === "member" ? (
                    <MemberGridRow
                      alarm={item.alarm}
                      highlighted={item.alarm.id === highlightId}
                      columns={columns}
                      showIncident={showIncident ?? false}
                      selectable={selectable}
                      incidentLabel={item.row.incidentId}
                    />
                  ) : null}
                </div>
              )
            })}
            {flat.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
                No events in this stage filter.
              </div>
            ) : null}
          </div>
        </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground">
          <span>
            Showing {pageRows.length} of {filtered.length} · page {safePage + 1}/{pages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              className="rounded border border-border px-2 py-0.5 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={safePage >= pages - 1}
              onClick={() => setPage((value) => Math.min(pages - 1, value + 1))}
              className="rounded border border-border px-2 py-0.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function HeaderButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active?: boolean
  dir?: "asc" | "desc"
  onClick?: () => void
}) {
  if (!onClick) return <div className="truncate px-2 py-2">{label}</div>
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("truncate px-2 py-2 text-left hover:text-foreground", active && "text-foreground")}
    >
      {label}
      {active ? <span className="ml-1 font-mono">{dir === "asc" ? "↑" : "↓"}</span> : null}
    </button>
  )
}

function EventGridRow({
  row,
  open,
  highlighted,
  columns,
  showIncident,
  selectable,
  checked,
  onCheck,
  onToggle,
}: {
  row: EventRow
  open: boolean
  highlighted: boolean
  columns: string
  showIncident: boolean
  selectable: boolean
  checked: boolean
  onCheck: () => void
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full border-b border-border/60 text-left hover:bg-muted/40",
        highlighted && "bg-primary/10",
      )}
      style={{ borderLeft: `3px solid ${severityTone[row.severity].color}` }}
    >
      {selectable ? (
        <div className="flex w-8 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={onCheck}
            aria-label={`选择 ${row.device} ${row.displayCode}`}
            className="size-3.5 accent-primary"
          />
        </div>
      ) : null}
      <button
        type="button"
        onClick={onToggle}
        className="grid h-full min-w-0 flex-1"
        style={{ gridTemplateColumns: showIncident ? COLS_INCIDENT : COLS }}
      >
        <Cell>
          {row.expandable ? (
            open ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />
          ) : null}
        </Cell>
        <Cell className="font-mono text-muted-foreground">{row.timestamp}</Cell>
        <Cell><SeverityBadge severity={row.severity} /></Cell>
        <Cell className="font-semibold text-foreground">{row.device}</Cell>
        {showIncident ? (
          <Cell className="font-mono text-foreground" title={row.incidentTitle}>
            {row.incidentId ?? "—"}
          </Cell>
        ) : null}
        <Cell className="font-normal text-foreground" title={row.summary}>{row.summary}</Cell>
        <Cell className="font-mono font-semibold text-foreground">{row.displayCode}</Cell>
        <Cell>{row.ruleApplied}</Cell>
        <Cell className="font-mono">{row.aggregationGroup}</Cell>
        <Cell>{row.category}</Cell>
        <Cell>{row.status}</Cell>
      </button>
    </div>
  )
}

function GroupMetaRow({ row }: { row: EventRow }) {
  return (
    <div className="flex h-full items-center gap-4 border-b border-border/50 bg-muted/25 px-3 font-mono text-[10px] text-muted-foreground">
      <span><span className="font-sans font-semibold text-foreground">Merged By Rule</span> {row.mergedBy ?? "—"}</span>
      <span><span className="font-sans font-semibold text-foreground">Reason</span> {(row.reasons ?? []).join(" · ") || "—"}</span>
      <span><span className="font-sans font-semibold text-foreground">Time Window</span> {row.window ?? "—"}</span>
    </div>
  )
}

function MemberGridRow({
  alarm,
  highlighted,
  columns,
  showIncident,
  selectable = false,
  incidentLabel,
}: {
  alarm: TaggedAlarm
  highlighted: boolean
  columns: string
  showIncident: boolean
  selectable?: boolean
  incidentLabel?: string
}) {
  return (
    <div
      className={cn("flex h-full border-b border-border/40 bg-muted/15", highlighted && "bg-primary/10")}
    >
      {selectable ? <div className="w-8 shrink-0" /> : null}
      <div className="grid h-full min-w-0 flex-1" style={{ gridTemplateColumns: showIncident ? COLS_INCIDENT : COLS }}>
      <Cell className="text-muted-foreground">↳</Cell>
      <Cell className="font-mono text-muted-foreground">{alarm.timestamp}</Cell>
      <Cell><SeverityBadge severity={alarm.severity} /></Cell>
      <Cell className="font-semibold text-foreground">{alarm.device}</Cell>
      {showIncident ? <Cell className="font-mono text-muted-foreground">{incidentLabel ?? "—"}</Cell> : null}
      <Cell className="font-normal text-foreground" title={alarm.message}>{alarm.message}</Cell>
      <Cell className="font-mono">{alarm.code}</Cell>
      <Cell className="text-muted-foreground">member</Cell>
      <Cell className="font-mono text-muted-foreground">{alarm.code}</Cell>
      <Cell className="text-muted-foreground">{CATEGORY_EN[alarm.role]}</Cell>
      <Cell>{alarm.status}</Cell>
      </div>
    </div>
  )
}

const CATEGORY_EN: Record<TaggedAlarm["role"], string> = {
  "root-symptom": "Root Symptom",
  cascade: "Cascade",
  secondary: "Secondary",
  noise: "Noise",
}
