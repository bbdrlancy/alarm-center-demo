"use client"

import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { getPortfolioIncidents, rcaHref } from "@/data/scenarios"
import { incidentIdToScenarioKey } from "@/data/scenarios"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { PriorityBadge, Panel } from "@/components/primitives"
import { cn } from "@/lib/utils"

const statusStyle: Record<string, string> = {
  Open: "bg-[var(--p2)]/12 text-[var(--p2)]",
  "In Progress": "bg-[var(--p1)]/12 text-[var(--p1)]",
  Investigating: "bg-[var(--info)]/12 text-[var(--info)]",
  Resolved: "bg-primary/12 text-primary",
}

export function ActiveIncidentTable() {
  const router = useRouter()
  const { scenario, setScenarioKey } = useDemoScenario()

  const openIncident = (id: string) => {
    setScenarioKey(incidentIdToScenarioKey(id))
    router.push(rcaHref(id))
  }

  return (
    <Panel
      title="Active Incidents"
      subtitle="进行中事故列表"
      description="Click any incident to open Root Cause Investigation with incident context"
      bodyClassName="p-0"
    >
      <div id="active-incident-table" className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-border bg-panel/60 text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Severity</th>
              <th className="px-4 py-2.5 font-semibold">Incident ID</th>
              <th className="px-4 py-2.5 font-semibold">Root Cause</th>
              <th className="px-4 py-2.5 font-semibold">Domain</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Confidence</th>
              <th className="px-4 py-2.5 font-semibold">Affected Assets</th>
              <th className="px-4 py-2.5 font-semibold">Business Impact</th>
              <th className="px-4 py-2.5 font-semibold">Start Time</th>
              <th className="px-4 py-2.5 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {getPortfolioIncidents().map((row) => {
              const isActive = row.id === scenario.incident.id
              return (
                <tr
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openIncident(row.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      openIncident(row.id)
                    }
                  }}
                  className={cn(
                    "cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40",
                    isActive && "bg-primary/6 ring-1 ring-inset ring-primary/25",
                  )}
                >
                  <td className="px-4 py-3">
                    <PriorityBadge priority={row.severity} />
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-foreground">{row.id}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.rootCause}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.domain}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                        statusStyle[row.status],
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular text-primary">{row.confidence}%</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.affectedAssets}</td>
                  <td className="px-4 py-3 text-foreground">{row.businessImpact}</td>
                  <td className="px-4 py-3 tabular text-muted-foreground">{row.startTime}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/8 px-2.5 py-1 text-[10px] font-semibold text-primary">
                      Investigate
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
