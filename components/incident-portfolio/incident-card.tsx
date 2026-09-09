"use client"

import { useState, type MouseEvent } from "react"
import { Check, ChevronDown, Info } from "lucide-react"
import { PriorityBadge } from "@/components/primitives"
import { LIFECYCLE_TONE, SLA_TONE, type CommandIncident } from "@/lib/incident-command"
import { SCORE_COMPOSITION_META } from "@/lib/incident-priority"
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
  const [reasonOpen, setReasonOpen] = useState(false)
  const impact = item.impact.slaRisk
  const rank = item.priorityRank || 1

  function toggleReason(event: MouseEvent) {
    event.stopPropagation()
    setReasonOpen((open) => !open)
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect(item)
        }
      }}
      className={cn(
        "cursor-pointer rounded-lg border bg-card p-3.5 text-left shadow-sm transition-all",
        selected ? "border-primary/50 ring-2 ring-primary/25" : "border-border hover:border-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-extrabold tracking-wide",
            rank === 1
              ? "border-[var(--p1)]/35 bg-[var(--p1)]/12 text-[var(--p1)]"
              : rank === 2
                ? "border-[var(--p2)]/40 bg-[var(--p2)]/12 text-[var(--p2)]"
                : "border-border bg-muted/60 text-muted-foreground",
          )}
        >
          Priority #{rank}
        </span>
        <PriorityBadge priority={item.severity} />
      </div>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[16px] font-extrabold leading-snug text-foreground">{item.shortTitle}</div>
          <p className="truncate text-[11px] text-muted-foreground">{item.titleZh}</p>
        </div>
        <ScoreChip score={item.priorityScore} composition={item.priorityComposition} />
      </div>

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

      <div className="mt-3 border-t border-border/70 pt-2">
        <div
          role="button"
          tabIndex={0}
          onClick={toggleReason}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              toggleReason(event as unknown as MouseEvent)
            }
          }}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="text-[10px] font-semibold text-foreground">
            Priority Reason
            <span className="ml-1 font-normal text-muted-foreground">排序原因</span>
          </span>
          <ChevronDown
            className={cn("size-3.5 text-muted-foreground transition-transform", reasonOpen && "rotate-180")}
          />
        </div>

        {reasonOpen ? (
          <ul className="mt-2 space-y-1.5" onClick={(event) => event.stopPropagation()}>
            {item.priorityReasons.map((reason) => (
              <li key={reason.id} className="flex items-start gap-1.5 text-[11px] leading-snug">
                <Check className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                <span>
                  <span className="font-medium text-foreground">{reason.en}</span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">{reason.zh}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 truncate text-[10px] text-muted-foreground">
            {item.priorityReasons[0]?.en ?? "View ranking factors"}
          </p>
        )}
      </div>
    </article>
  )
}

function ScoreChip({
  score,
  composition,
}: {
  score: number
  composition: CommandIncident["priorityComposition"]
}) {
  return (
    <div className="group relative shrink-0">
      <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1">
        <div className="text-right leading-none">
          <div className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Score</div>
          <div className="font-mono text-[18px] font-extrabold tabular text-foreground">{score}</div>
        </div>
        <Info className="size-3 text-muted-foreground" />
      </div>
      <div className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 hidden w-[200px] rounded-lg border border-border bg-card p-2.5 shadow-lg group-hover:block group-focus-within:block">
        <div className="mb-1.5 text-[10px] font-semibold text-foreground">
          Score Composition
          <span className="ml-1 font-normal text-muted-foreground">分值构成</span>
        </div>
        <ul className="space-y-1">
          {SCORE_COMPOSITION_META.map((meta) => (
            <li key={meta.key} className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-muted-foreground">
                {meta.en}
                <span className="ml-1 opacity-70">{meta.zh}</span>
              </span>
              <span className="font-mono font-bold tabular text-foreground">{composition[meta.key]}</span>
            </li>
          ))}
          <li className="mt-1 flex items-center justify-between border-t border-border/70 pt-1 text-[10px] font-semibold">
            <span className="text-foreground">Total</span>
            <span className="font-mono tabular text-foreground">{score}</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
