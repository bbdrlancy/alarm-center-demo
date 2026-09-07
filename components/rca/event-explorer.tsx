"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { ChevronDown, ChevronRight, Search } from "lucide-react"
import type { EventRow, TaggedAlarm } from "@/lib/alarm-convergence"
import type { AlarmSeverity } from "@/lib/incident-data"
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

function Cell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-full items-center truncate px-2 text-[11px] leading-none", className)}>
      {children}
    </div>
  )
}

const COLS = "36px 108px 80px 118px minmax(240px, 1.6fr) 150px 128px 128px 96px 80px"

const STAGE_PLAIN: Record<string, string> = {
  raw: "下面每一行是一条原始告警。「说明」用白话写出设备出了什么事，不必先看告警码。",
  noise: "闪断和提示类噪声已去掉。下面是仍需关注的告警，「说明」解释现场发生了什么。",
  cluster: "同一问题在多台设备上同时出现时会合并成一行。括号里的数字是被合并的设备数，「说明」解释合并后代表什么。",
  topology: "每一行是一条候选原因，按依赖层级归并。「说明」解释这一层发生了什么。",
  causal: "最终只留下 1 条根因。「说明」用白话解释为什么认定它是源头。",
}

export function EventExplorer({
  rows,
  stageKey,
  stageLabel,
  highlightId,
}: {
  rows: EventRow[]
  stageKey: string
  stageLabel: string
  highlightId?: string
}) {
  const [query, setQuery] = useState("")
  const [severity, setSeverity] = useState("all")
  const [category, setCategory] = useState("all")
  const [rule, setRule] = useState("all")
  const [group, setGroup] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("timestamp")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState<string[]>([])
  const [scrollTop, setScrollTop] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)

  const categories = useMemo(() => [...new Set(rows.map((row) => row.category))].sort(), [rows])
  const rules = useMemo(() => [...new Set(rows.map((row) => row.ruleApplied))].sort(), [rows])
  const groups = useMemo(() => [...new Set(rows.map((row) => row.aggregationGroup))].sort(), [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((row) => {
        if (severity !== "all" && row.severity !== severity) return false
        if (category !== "all" && row.category !== category) return false
        if (rule !== "all" && row.ruleApplied !== rule) return false
        if (group !== "all" && row.aggregationGroup !== group) return false
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
  }, [rows, query, severity, category, rule, group, sortKey, sortDir])

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
  }, [rows, query, severity, category, rule, group, sortKey, sortDir])

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

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-[12px] font-semibold text-foreground">Selected Stage Event Explorer</h3>
          <p className="text-[10px] text-muted-foreground">
            {stageLabel} · {filtered.length} events · one alarm = one row
          </p>
          <p className="mt-1 text-[12px] leading-snug text-foreground">
            {STAGE_PLAIN[stageKey] ?? "「说明」列用白话解释这条告警在现场意味着什么。"}
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
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
        <div
          className="grid min-w-[1100px] border-b border-border bg-muted/50 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          style={{ gridTemplateColumns: COLS }}
        >
          <HeaderButton label="" />
          <HeaderButton label="Timestamp" active={sortKey === "timestamp"} dir={sortDir} onClick={() => toggleSort("timestamp")} />
          <HeaderButton label="Severity" active={sortKey === "severity"} dir={sortDir} onClick={() => toggleSort("severity")} />
          <HeaderButton label="Device" active={sortKey === "device"} dir={sortDir} onClick={() => toggleSort("device")} />
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
                highlightId != null &&
                (item.row.alarmId === highlightId ||
                  (item.kind === "member" && item.alarm.id === highlightId) ||
                  item.row.members?.some((member) => member.id === highlightId))
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
                      highlighted={highlighted}
                      onToggle={() => item.row.expandable && toggleExpand(item.row.id)}
                    />
                  ) : null}
                  {item.kind === "meta" ? <GroupMetaRow row={item.row} /> : null}
                  {item.kind === "member" ? (
                    <MemberGridRow alarm={item.alarm} highlighted={item.alarm.id === highlightId} />
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
  if (!onClick) return <div className="px-2 py-2" />
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
  onToggle,
}: {
  row: EventRow
  open: boolean
  highlighted: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "grid h-full w-full border-b border-border/60 text-left",
        highlighted && "bg-primary/10",
        row.expandable && "hover:bg-muted/40",
      )}
      style={{
        gridTemplateColumns: COLS,
        borderLeft: `3px solid ${severityTone[row.severity].color}`,
      }}
    >
      <Cell>
        {row.expandable ? (
          open ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />
        ) : null}
      </Cell>
      <Cell className="font-mono text-muted-foreground">{row.timestamp}</Cell>
      <Cell><SeverityBadge severity={row.severity} /></Cell>
      <Cell className="font-semibold text-foreground">{row.device}</Cell>
      <Cell className="font-normal text-foreground" title={row.summary}>{row.summary}</Cell>
      <Cell className="font-mono font-semibold text-foreground">{row.displayCode}</Cell>
      <Cell>{row.ruleApplied}</Cell>
      <Cell className="font-mono">{row.aggregationGroup}</Cell>
      <Cell>{row.category}</Cell>
      <Cell>{row.status}</Cell>
    </button>
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

function MemberGridRow({ alarm, highlighted }: { alarm: TaggedAlarm; highlighted: boolean }) {
  return (
    <div
      className={cn("grid h-full border-b border-border/40 bg-muted/15", highlighted && "bg-primary/10")}
      style={{ gridTemplateColumns: COLS }}
    >
      <Cell className="text-muted-foreground">↳</Cell>
      <Cell className="font-mono text-muted-foreground">{alarm.timestamp}</Cell>
      <Cell><SeverityBadge severity={alarm.severity} /></Cell>
      <Cell className="font-semibold text-foreground">{alarm.device}</Cell>
      <Cell className="font-normal text-foreground" title={alarm.message}>{alarm.message}</Cell>
      <Cell className="font-mono">{alarm.code}</Cell>
      <Cell className="text-muted-foreground">member</Cell>
      <Cell className="font-mono text-muted-foreground">{alarm.code}</Cell>
      <Cell className="text-muted-foreground">{CATEGORY_EN[alarm.role]}</Cell>
      <Cell>{alarm.status}</Cell>
    </div>
  )
}

const CATEGORY_EN: Record<TaggedAlarm["role"], string> = {
  "root-symptom": "Root Symptom",
  cascade: "Cascade",
  secondary: "Secondary",
  noise: "Noise",
}
