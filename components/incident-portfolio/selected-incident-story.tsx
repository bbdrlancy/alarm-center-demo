"use client"

import { BookOpen, ScanSearch } from "lucide-react"
import { Panel } from "@/components/primitives"
import type { CommandIncident } from "@/lib/incident-command"
import { cn } from "@/lib/utils"

export function SelectedIncidentStory({
  incident,
  className,
  layout = "split",
}: {
  incident: CommandIncident
  className?: string
  layout?: "split" | "stack"
}) {
  return (
    <div className={cn(layout === "stack" ? "flex flex-col gap-3" : "grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]", className)}>
      <Panel
        title="事故故事"
        subtitle="Incident Story"
        icon={<BookOpen className="size-4" />}
        className="bg-card"
        bodyClassName="p-4"
      >
        <p className="mb-3 text-[11px] text-muted-foreground">
          {incident.incidentId} · {incident.shortTitle}
        </p>
        <ol className="space-y-2">
          {incident.whatHappened.map((line, index) => (
            <li key={line} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-foreground">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">
                {index + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel
        title="证据摘要"
        subtitle="Evidence Summary"
        icon={<ScanSearch className="size-4" />}
        className="bg-card"
        bodyClassName="p-3"
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
          {incident.evidence.map((card) => (
            <article
              key={card.en}
              className="rounded-lg border border-border bg-muted/30 px-3 py-2.5"
            >
              <div className="text-[10px] font-semibold text-foreground">{card.zh}</div>
              <div className="text-[9px] text-muted-foreground">{card.en}</div>
              <div className="mt-1.5 font-mono text-[15px] font-extrabold tabular leading-none text-foreground">
                {card.value}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
