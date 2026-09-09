"use client"

import { useMemo } from "react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { getIncidentOverview } from "@/lib/incident-overview"
import { cn } from "@/lib/utils"

const ACTION_STATUS_STYLE = {
  Suggested: "bg-muted text-l3 border-border",
  "In Progress": "bg-[var(--p2)]/15 text-[var(--p2)] border-[var(--p2)]/35",
  Completed: "bg-primary/12 text-primary border-primary/35",
} as const

export function IncidentOverview() {
  const { scenario } = useDemoScenario()
  const overview = useMemo(() => getIncidentOverview(scenario), [scenario])
  const action = overview.recommendedAction

  return (
    <section id="incident-overview" className="space-y-4">
      <article className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
          <div>
            <div className="text-[11px] font-semibold text-l3">建议行动</div>
            <div className="text-[10px] text-l4">Recommended Actions</div>
            <div className="mt-0.5 text-[12px] text-l4">{action.ownerTeam}</div>
          </div>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-bold",
              ACTION_STATUS_STYLE[action.status],
            )}
          >
            {action.status}
          </span>
        </div>
        <div className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)] lg:items-center">
          <div>
            <h3 className="text-[16px] font-bold leading-snug text-l1">{action.actionZh}</h3>
            <p className="mt-1 text-[12px] text-l4">{action.action}</p>
          </div>
          <div className="flex gap-2">
            <Kpi zh="预计完成" en="ETA" value={action.eta} />
            <Kpi zh="风险下降" en="Risk ↓" value={`${action.riskReduction}%`} />
          </div>
          <ol className="space-y-1">
            {action.steps.map((step, index) => (
              <li key={step.zh} className="flex items-baseline gap-2">
                <span className="font-mono text-[11px] font-bold text-l4">{index + 1}</span>
                <span className="text-[12px] font-semibold text-l2">{step.zh}</span>
              </li>
            ))}
          </ol>
        </div>
      </article>
    </section>
  )
}

function Kpi({ zh, en, value }: { zh: string; en: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <div className="text-[10px] font-bold text-l3">{zh}</div>
      <div className="text-[9px] text-l4">{en}</div>
      <div className="mt-1 text-[16px] font-extrabold leading-snug text-l2">{value}</div>
    </div>
  )
}
