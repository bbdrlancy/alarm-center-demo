"use client"

import { useMemo, useState } from "react"
import { Boxes, Search, Download, ArrowUpDown, Filter } from "lucide-react"
import { rawAlarms, type AlarmSeverity, type AlarmStatus, type RawAlarm } from "@/lib/incident-data"
import { Panel, ModuleConclusion } from "@/components/primitives"

const severityStyle: Record<AlarmSeverity, { color: string; bg: string }> = {
  Critical: { color: "var(--p1)", bg: "rgba(229,57,53,0.14)" },
  Major: { color: "var(--p2)", bg: "rgba(251,140,0,0.14)" },
  Minor: { color: "var(--p3)", bg: "rgba(253,216,53,0.14)" },
  Warning: { color: "#4aa3ff", bg: "rgba(74,163,255,0.14)" },
}

const statusStyle: Record<AlarmStatus, { color: string; label: string }> = {
  Active: { color: "var(--p1)", label: "Active" },
  Correlated: { color: "var(--primary)", label: "Correlated" },
  Suppressed: { color: "var(--muted-foreground)", label: "Suppressed" },
  Cleared: { color: "var(--ok)", label: "Cleared" },
}

type SortKey = "timestamp" | "device" | "severity"
const severityRank: Record<AlarmSeverity, number> = { Critical: 0, Major: 1, Minor: 2, Warning: 3 }

export function RawAlarmExplorer() {
  const [query, setQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState<"all" | AlarmSeverity>("all")
  const [sortKey, setSortKey] = useState<SortKey>("timestamp")
  const [asc, setAsc] = useState(true)

  const rows = useMemo(() => {
    let list = [...rawAlarms]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (a) =>
          a.device.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q),
      )
    }
    if (severityFilter !== "all") list = list.filter((a) => a.severity === severityFilter)
    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === "severity") cmp = severityRank[a.severity] - severityRank[b.severity]
      else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]))
      return asc ? cmp : -cmp
    })
    return list
  }, [query, severityFilter, sortKey, asc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setAsc((v) => !v)
    else {
      setSortKey(key)
      setAsc(true)
    }
  }

  const exportCsv = () => {
    const header = ["ID", "Timestamp", "Device", "Alarm Code", "Message", "Severity", "Status", "Source"]
    const lines = rows.map((r) =>
      [r.id, r.timestamp, r.device, r.code, `"${r.message}"`, r.severity, r.status, r.source].join(","),
    )
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "raw-alarms-INC-2026-0814-001.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const filters: ("all" | AlarmSeverity)[] = ["all", "Critical", "Major", "Minor", "Warning"]

  return (
    <Panel
      title="原始告警浏览"
      subtitle="Raw Alarm Explorer"
      description="从海量告警中快速筛选与当前事件相关的关键信号"
      icon={<Boxes className="size-4" />}
      action={
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/50 hover:text-primary"
        >
          <Download className="size-3.5" />
          Export CSV
        </button>
      }
      bodyClassName="p-0"
    >
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索设备 / 告警码 / 描述…"
            className="w-44 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none sm:w-56"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="size-3.5 text-muted-foreground" />
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setSeverityFilter(f)}
              className={[
                "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                severityFilter === f
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              {f === "all" ? "全部" : f}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border text-[11px] text-muted-foreground">
              <SortableTh label="Timestamp" active={sortKey === "timestamp"} asc={asc} onClick={() => toggleSort("timestamp")} />
              <SortableTh label="Device" active={sortKey === "device"} asc={asc} onClick={() => toggleSort("device")} />
              <th className="px-4 py-2.5 font-medium">Alarm Code</th>
              <SortableTh label="Severity" active={sortKey === "severity"} asc={asc} onClick={() => toggleSort("severity")} />
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <AlarmRow key={a.id} alarm={a} />
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  无匹配告警
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <ModuleConclusion>
        当前事件关联 {rows.length} 条关键告警，UPS 电池类 Critical 告警为最高优先级排查入口。
      </ModuleConclusion>
    </Panel>
  )
}

function SortableTh({ label, active, asc, onClick }: { label: string; active: boolean; asc: boolean; onClick: () => void }) {
  return (
    <th className="px-4 py-2.5 font-medium">
      <button onClick={onClick} className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-primary" : ""}`}>
        {label}
        <ArrowUpDown className={`size-3 ${active ? "opacity-100" : "opacity-40"}`} />
        {active ? <span className="text-[9px]">{asc ? "↑" : "↓"}</span> : null}
      </button>
    </th>
  )
}

function AlarmRow({ alarm }: { alarm: RawAlarm }) {
  const sev = severityStyle[alarm.severity]
  const st = statusStyle[alarm.status]
  const isRoot = alarm.code === "UPS-BATT-CRIT-014"
  return (
    <tr
      className={[
        "border-b border-border/60 transition-colors hover:bg-secondary/50",
        isRoot ? "bg-[var(--p1)]/8" : "",
      ].join(" ")}
    >
      <td className="whitespace-nowrap px-4 py-2.5 tabular text-muted-foreground">{alarm.timestamp}</td>
      <td className="whitespace-nowrap px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          {isRoot ? <span className="size-1.5 rounded-full bg-[var(--p1)]" /> : null}
          <span className="font-medium text-foreground">{alarm.device}</span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <div className="font-mono text-[11px] text-foreground">{alarm.code}</div>
        <div className="max-w-[280px] truncate text-[11px] text-muted-foreground">{alarm.message}</div>
      </td>
      <td className="px-4 py-2.5">
        <span
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ color: sev.color, backgroundColor: sev.bg }}
        >
          <span className="size-1.5 rounded-full" style={{ backgroundColor: sev.color }} />
          {alarm.severity}
        </span>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-[11px] font-medium" style={{ color: st.color }}>
          {st.label}
        </span>
      </td>
    </tr>
  )
}
