"use client"

import { AlertCircle } from "lucide-react"
import { useActiveIncident } from "@/hooks/use-active-incident"
import { PriorityBadge } from "@/components/primitives"
import { priorityMeta } from "@/lib/incident-data"

export function RcaIncidentContextBanner() {
  const { incidentId, scenario } = useActiveIncident()
  const { incident } = scenario
  const tone = priorityMeta[incident.severity]

  return (
    <div
      id="rca-incident-context"
      className="rounded-lg border px-4 py-3 shadow-sm"
      style={{ borderColor: `${tone.color}59`, backgroundColor: `${tone.color}0d` }}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-card shadow-sm" style={{ color: tone.color }}>
          <AlertCircle className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12px] font-bold text-foreground">{incidentId}</span>
            <PriorityBadge priority={incident.severity} />
            <span className="rounded-md bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {scenario.domain} Domain
            </span>
            <span className="rounded-md bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {incident.status}
            </span>
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {incident.rootCause}{" "}
            <span className="font-normal text-muted-foreground">· {incident.rootCauseZh}</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {incident.executiveLine}
          </p>
          <p className="mt-1 text-[10px] text-primary">{incident.investigationFocus}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold tabular text-primary">{incident.confidence}%</div>
          <div className="text-[10px] text-muted-foreground">Confidence</div>
        </div>
      </div>
    </div>
  )
}
