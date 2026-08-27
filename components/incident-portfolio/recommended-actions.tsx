"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, ClipboardList, Sparkles } from "lucide-react"
import {
  getRecommendedActions,
  incidentIdToScenarioKey,
  rcaHref,
} from "@/data/scenarios"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { PriorityBadge, Panel } from "@/components/primitives"
import { cn } from "@/lib/utils"

const actionStatusStyle: Record<
  "Suggested" | "In Progress" | "Completed",
  string
> = {
  Suggested: "bg-muted text-muted-foreground border-border",
  "In Progress": "bg-[var(--p2)]/15 text-[var(--p2)] border-[var(--p2)]/35",
  Completed: "bg-primary/12 text-primary border-primary/35",
}

export function RecommendedActions() {
  const router = useRouter()
  const { scenario, setScenarioKey } = useDemoScenario()
  const actions = getRecommendedActions()

  const openRca = (incidentId: string) => {
    setScenarioKey(incidentIdToScenarioKey(incidentId))
    router.push(rcaHref(incidentId))
  }

  return (
    <Panel
      title="Recommended Actions"
      subtitle="AI-generated prioritized actions to reduce business risk."
      description="Actionable operational guidance for active incidents"
      icon={<ClipboardList className="size-4" />}
      bodyClassName="p-0"
    >
      <div id="recommended-actions" className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-border bg-panel/60 text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Priority</th>
              <th className="px-4 py-2.5 font-semibold">Incident ID</th>
              <th className="px-4 py-2.5 font-semibold">Recommended Action</th>
              <th className="px-4 py-2.5 font-semibold">Owner Team</th>
              <th className="px-4 py-2.5 font-semibold">ETA</th>
              <th className="px-4 py-2.5 font-semibold">Expected Risk Reduction</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Confidence</th>
              <th className="px-4 py-2.5 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {actions.map((row) => {
              const isActive = row.incidentId === scenario.incident.id
              return (
                <tr
                  key={row.incidentId}
                  role="button"
                  tabIndex={0}
                  onClick={() => openRca(row.incidentId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      openRca(row.incidentId)
                    }
                  }}
                  className={cn(
                    "cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40",
                    isActive && "bg-primary/6 ring-1 ring-inset ring-primary/25",
                  )}
                >
                  <td className="px-4 py-3">
                    <PriorityBadge priority={row.priority} />
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-foreground">{row.incidentId}</td>
                  <td className="max-w-xs px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                        <ClipboardList className="size-3.5" />
                      </span>
                      <span className="font-medium leading-snug text-foreground">{row.action}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.ownerTeam}</td>
                  <td className="px-4 py-3 tabular text-foreground">{row.eta}</td>
                  <td className="px-4 py-3 font-semibold tabular text-[var(--p1)]">{row.riskReduction}%</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                        actionStatusStyle[row.status],
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/8 px-2 py-0.5 text-[10px] font-semibold tabular text-primary">
                      <Sparkles className="size-3" />
                      {row.confidence}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/8 px-2.5 py-1 text-[10px] font-semibold text-primary">
                      Open RCA
                      <ArrowRight className="size-3" />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
