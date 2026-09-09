"use client"

import { ShieldAlert } from "lucide-react"
import type { CommandIncident, StageMark } from "@/lib/incident-command"
import { SLA_TONE } from "@/lib/incident-command"
import { priorityMeta } from "@/lib/incident-data"
import { cn } from "@/lib/utils"

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: string
}) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 truncate text-[15px] font-extrabold leading-tight tabular", accent ?? "text-foreground")}>
        {value}
      </div>
      {hint ? <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{hint}</div> : null}
    </div>
  )
}

function StageDot({ mark }: { mark: StageMark }) {
  if (mark === "done") {
    return <span className="size-2.5 rounded-full bg-primary" />
  }
  if (mark === "current") {
    return (
      <span
        className="size-2.5 rounded-full border-2 border-primary"
        style={{ background: "conic-gradient(var(--primary) 0 180deg, transparent 180deg)" }}
      />
    )
  }
  return <span className="size-2.5 rounded-full border-2 border-border bg-card" />
}

export function CommandSummary({ incident }: { incident: CommandIncident }) {
  const tone = priorityMeta[incident.severity]
  const slaClass = SLA_TONE[incident.impact.slaRisk]

  return (
    <div
      id="incident-command-summary"
      className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-2.5 shadow-sm backdrop-blur-md"
    >
      <section
        className="overflow-hidden rounded-xl border-2 bg-card shadow-card"
        style={{ borderColor: tone.color, minHeight: 180 }}
      >
        <div className="h-1.5" style={{ backgroundColor: tone.color }} />

        <div className="grid min-h-[172px] gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(168px,0.7fr)_minmax(220px,0.95fr)_minmax(188px,0.78fr)]">
          <div className="min-w-0 border-b border-border/70 px-4 py-3 lg:border-b-0 lg:border-r">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: tone.color, backgroundColor: tone.bg }}
              >
                <ShieldAlert className="size-3" />
                L0 Executive Summary
              </span>
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px] font-extrabold"
                style={{ color: tone.color, backgroundColor: tone.bg }}
              >
                {incident.severity}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {incident.incidentId} · {incident.domain}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2 min-w-0">
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Root Cause</div>
                <div className="mt-1 text-[16px] font-extrabold leading-snug text-foreground">{incident.rootCause}</div>
                <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{incident.rootCauseZh}</div>
              </div>
              <Kpi label="Confidence" value={`${incident.confidence}%`} accent="text-primary" />
              <Kpi label="Status" value={incident.commandStatus} hint={incident.commandStatusZh} />
              <Kpi label="Duration" value={incident.duration} />
            </div>
          </div>

          <div className="border-b border-border/70 px-4 py-3 lg:border-b-0 lg:border-r">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Impact Summary
            </div>
            <dl className="mt-2 space-y-1.5 text-[11px]">
              <ImpactRow label="Affected Services" value={incident.impact.services} />
              <ImpactRow label="Affected Business Domains" value={incident.impact.domains} />
              <ImpactRow label="Affected Devices" value={incident.impact.devices} />
              <ImpactRow label="Affected Customers" value={incident.impact.customers} />
              <div className="flex items-baseline justify-between gap-2 border-t border-border/60 pt-1.5">
                <dt className="text-muted-foreground">Potential SLA Risk</dt>
                <dd className={cn("text-[13px] font-extrabold", slaClass)}>{incident.impact.slaRisk}</dd>
              </div>
            </dl>
          </div>

          <div className="border-b border-border/70 px-4 py-3 lg:border-b-0 lg:border-r">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Recovery
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="font-mono text-[28px] font-extrabold leading-none tabular text-foreground">
                {incident.recoveryPercent}%
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${incident.recoveryPercent}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  ETA <span className="font-semibold tabular text-foreground">{incident.recoveryEta}</span>
                </div>
              </div>
            </div>

            <ol className="mt-3 flex items-start justify-between gap-1">
              {incident.stages.map((stage, index) => (
                <li key={stage.id} className="flex min-w-0 flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <span
                      className={cn(
                        "h-px flex-1",
                        index === 0 ? "bg-transparent" : stage.mark === "todo" ? "bg-border" : "bg-primary/50",
                      )}
                    />
                    <StageDot mark={stage.mark} />
                    <span
                      className={cn(
                        "h-px flex-1",
                        index === incident.stages.length - 1
                          ? "bg-transparent"
                          : incident.stages[index + 1]?.mark === "todo"
                            ? "bg-border"
                            : "bg-primary/50",
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "mt-1 max-w-full truncate text-[8px] font-semibold leading-tight",
                      stage.mark === "todo" && "text-muted-foreground",
                      stage.mark === "current" && "text-primary",
                      stage.mark === "done" && "text-foreground",
                    )}
                  >
                    {stage.short}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="px-4 py-3">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Owner Team</div>
            <div className="mt-1 text-[15px] font-extrabold text-foreground">{incident.commander}</div>
            <div className="mt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Current Action
            </div>
            <div className="mt-1 text-[14px] font-extrabold leading-snug text-foreground">
              {incident.nextAction.short}
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{incident.nextAction.actionZh}</p>
            <div className="mt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">ETA</div>
            <div className="mt-0.5 text-[15px] font-extrabold tabular text-foreground">{incident.nextAction.eta}</div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ImpactRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono text-[13px] font-extrabold tabular text-foreground">{value}</dd>
    </div>
  )
}
