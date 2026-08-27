"use client"

import { Clock } from "lucide-react"
import { priorityMeta } from "@/lib/incident-data"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { Panel, ModuleConclusion } from "@/components/primitives"

export function IncidentTimeline() {
  const { scenario } = useDemoScenario()
  const { incident, timeline } = scenario

  return (
    <Panel
      title="事故时间线"
      subtitle="Incident Timeline"
      description={`${incident.id} · ${scenario.domain} domain`}
      icon={<Clock className="size-4" />}
    >
      <ol className="relative">
        {timeline.events.map((ev, i) => {
          const meta = priorityMeta[ev.priority]
          const isLast = i === timeline.events.length - 1
          return (
            <li key={ev.time} className="relative flex gap-3 pb-4 last:pb-0">
              {!isLast ? (
                <span
                  className="absolute left-[7px] top-4 h-full w-px"
                  style={{ backgroundColor: "var(--border)" }}
                />
              ) : null}
              <span className="relative z-10 mt-1 shrink-0">
                <span
                  className="block size-3.5 rounded-full border-2"
                  style={{ borderColor: meta.color, backgroundColor: "var(--card)" }}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{ev.title}</span>
                  <span className="tabular text-[11px] text-muted-foreground">{ev.time}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ color: meta.color, backgroundColor: meta.bg }}
                  >
                    {ev.priority}
                  </span>
                  <span className="text-[12px] text-muted-foreground">{ev.zh}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/80">
                  {ev.detail}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
      <ModuleConclusion>{timeline.conclusion}</ModuleConclusion>
    </Panel>
  )
}
