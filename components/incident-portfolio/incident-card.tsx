"use client"

import { PriorityBadge } from "@/components/primitives"
import { LIFECYCLE_TONE, SLA_TONE, type CommandIncident } from "@/lib/incident-command"
import { cn } from "@/lib/utils"

export function IncidentCard({
  item,
  selected,
  onSelect,
}: {
  item: CommandIncident
  selected: boolean
  onSelect: (incident: CommandIncident) => void
}) {
  const impact = item.impact.slaRisk

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "rounded-lg border bg-card p-3.5 text-left shadow-sm transition-all",
        selected ? "border-primary/50 ring-2 ring-primary/25" : "border-border hover:border-primary/30",
      )}
    >
      <PriorityBadge priority={item.severity} />

      <div className="mt-2 text-[16px] font-extrabold leading-snug text-foreground">{item.shortTitle}</div>
      <p className="truncate text-[11px] text-muted-foreground">{item.titleZh}</p>

      <span
        className={cn(
          "mt-2 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold",
          LIFECYCLE_TONE[item.commandStatus] ?? "border-border bg-muted text-muted-foreground",
        )}
      >
        {item.commandStatus}
      </span>

      <div className="mt-3 flex items-baseline justify-between gap-2 text-[11px] text-muted-foreground">
        <span>
          Recovery <span className="font-semibold tabular text-foreground">{item.recoveryPercent}%</span>
        </span>
        <span>
          Impact <span className={cn("font-semibold", SLA_TONE[impact])}>{impact}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${item.recoveryPercent}%` }} />
      </div>
    </button>
  )
}
