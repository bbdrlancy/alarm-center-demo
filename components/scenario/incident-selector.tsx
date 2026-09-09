"use client"

import { useMemo } from "react"
import { PriorityBadge } from "@/components/primitives"
import { getCommandPortfolio } from "@/lib/incident-command"
import { cn } from "@/lib/utils"
import type { ScenarioKey } from "@/data/scenarios"

export function LayerRail({ zh, en }: { zh: string; en: string }) {
  return (
    <div className="flex w-full shrink-0 items-baseline gap-1.5 border-b border-border/60 px-3 py-2 sm:w-[120px] sm:flex-col sm:items-start sm:justify-center sm:gap-0.5 sm:border-b-0 sm:border-r sm:py-2.5">
      <span className="text-[12px] font-semibold text-foreground">{zh}</span>
      <span className="text-[10px] text-muted-foreground">{en}</span>
    </div>
  )
}

export function IncidentSelectorChips({
  selectedKey,
  onSelect,
}: {
  selectedKey: ScenarioKey
  onSelect: (key: ScenarioKey) => void
}) {
  const items = useMemo(() => getCommandPortfolio(), [])

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2 px-3 py-2">
      {items.map((item) => {
        const active = item.scenarioKey === selectedKey
        return (
          <button
            key={item.scenarioKey}
            type="button"
            onClick={() => onSelect(item.scenarioKey)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-left shadow-sm transition-colors",
              active
                ? "border-primary/50 bg-primary/10"
                : "border-border bg-background hover:border-primary/30 hover:bg-accent/40",
            )}
          >
            <PriorityBadge priority={item.severity} />
            <span className="text-[12px] font-semibold text-foreground">{item.titleZh}</span>
            <span className="hidden text-[10px] text-muted-foreground sm:inline">{item.shortTitle}</span>
          </button>
        )
      })}
    </div>
  )
}

export function IncidentSelectorBar({
  selectedKey,
  onSelect,
  className,
}: {
  selectedKey: ScenarioKey
  onSelect: (key: ScenarioKey) => void
  className?: string
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row", className)}>
      <LayerRail zh="事故" en="Incident" />
      <IncidentSelectorChips selectedKey={selectedKey} onSelect={onSelect} />
    </div>
  )
}
