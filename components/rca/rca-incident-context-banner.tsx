"use client"

import { AlertCircle } from "lucide-react"
import { useActiveIncident } from "@/hooks/use-active-incident"
import { cn } from "@/lib/utils"

export function RcaIncidentContextBanner() {
  const { incidentId, scenario } = useActiveIncident()
  const { incident } = scenario

  return (
    <div
      id="rca-incident-context"
      className={cn(
        "rounded-lg border px-4 py-3 shadow-sm",
        scenario.domain === "Power" && "border-[var(--p1)]/35 bg-[var(--p1)]/5",
        scenario.domain === "Cooling" && "border-[var(--p2)]/35 bg-[var(--p2)]/5",
        scenario.domain === "Storage" && "border-[var(--info)]/35 bg-[var(--info)]/5",
        scenario.domain === "Network" && "border-primary/35 bg-primary/5",
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-card text-primary shadow-sm">
          <AlertCircle className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12px] font-bold text-foreground">{incidentId}</span>
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
