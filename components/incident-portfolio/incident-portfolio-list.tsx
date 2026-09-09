"use client"

import { ListFilter } from "lucide-react"
import { IncidentCard } from "@/components/incident-portfolio/incident-card"
import { Panel } from "@/components/primitives"
import type { CommandIncident, PortfolioFilter } from "@/lib/incident-command"
import { cn } from "@/lib/utils"

const FILTERS: { id: PortfolioFilter; zh: string; en: string }[] = [
  { id: "all", zh: "全部", en: "All" },
  { id: "critical", zh: "仅严重", en: "Critical Only" },
  { id: "open", zh: "进行中", en: "Open Incidents" },
  { id: "recovered", zh: "已恢复", en: "Recovered" },
]

export function IncidentPortfolioList({
  items,
  selectedKey,
  filter,
  onFilter,
  onSelect,
}: {
  items: CommandIncident[]
  selectedKey: CommandIncident["scenarioKey"] | null
  filter: PortfolioFilter
  onFilter: (filter: PortfolioFilter) => void
  onSelect: (incident: CommandIncident) => void
}) {
  return (
    <div id="incident-portfolio-list">
    <Panel
      title="事故组合"
      subtitle="L1 Incident Portfolio"
      icon={<ListFilter className="size-4" />}
      className="h-full"
      bodyClassName="flex flex-col gap-3 p-3"
    >
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((item) => {
          const active = filter === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilter(item.id)}
              className={cn(
                "rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors",
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {item.zh}
              <span className="ml-1 font-normal opacity-70">{item.en}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {items.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-md border border-dashed border-border px-3 py-8 text-center text-[11px] text-muted-foreground">
            当前筛选下没有事故
          </div>
        ) : (
          items.map((item) => (
            <IncidentCard
              key={item.incidentId}
              item={item}
              selected={item.scenarioKey === selectedKey}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </Panel>
    </div>
  )
}
