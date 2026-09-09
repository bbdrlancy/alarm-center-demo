"use client"

import { ShieldAlert } from "lucide-react"
import { Panel } from "@/components/primitives"
import { LIFECYCLE_TONE, SLA_TONE, TEAM_TAG, type CommandIncident } from "@/lib/incident-command"
import { cn } from "@/lib/utils"

export function IncidentSummary({ incident }: { incident: CommandIncident }) {
  const slaClass = SLA_TONE[incident.impact.slaRisk]

  return (
    <Panel
      title="事故摘要"
      subtitle="Incident Summary"
      icon={<ShieldAlert className="size-4" />}
      className="bg-card"
      bodyClassName="p-4"
    >
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Root Cause</div>
        <div className="mt-1 text-[16px] font-extrabold leading-snug text-foreground">{incident.rootCause}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{incident.rootCauseZh}</div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <SummaryKpi label="Confidence" value={`${incident.confidence}%`} />
        <div className="min-w-0">
          <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Status</dt>
          <dd className="mt-1">
            <span
              className={cn(
                "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                LIFECYCLE_TONE[incident.commandStatus] ?? "border-border bg-muted text-muted-foreground",
              )}
            >
              {incident.commandStatus}
            </span>
          </dd>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{incident.commandStatusZh}</p>
        </div>
        <SummaryKpi label="Duration" value={`Open ${incident.durationMins}m`} />
        <div className="min-w-0">
          <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Recovery</dt>
          <dd className="mt-1 text-[15px] font-extrabold tabular text-foreground">{incident.recoveryPercent}%</dd>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${incident.recoveryPercent}%` }} />
          </div>
        </div>
        <SummaryKpi label="开始时间" en="Start Time" value={incident.startTimeLabel} />
        <SummaryKpi label="更新时间" en="Update Time" value={incident.updateTimeLabel} />
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/70 pt-3 text-[11px] sm:grid-cols-4">
        <ImpactStat label="Services" value={incident.impact.services} />
        <ImpactStat label="Assets" value={incident.impact.devices} />
        <div className="min-w-0">
          <dt className="text-muted-foreground">Owner Team</dt>
          <dd className="mt-1">
            <span
              className={cn(
                "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                TEAM_TAG[incident.commander] ?? "border-border bg-muted text-foreground",
              )}
            >
              {incident.commander}
            </span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-foreground">SLA Risk</dt>
          <dd className={`font-semibold ${slaClass}`}>{incident.impact.slaRisk}</dd>
        </div>
      </div>
    </Panel>
  )
}

function SummaryKpi({
  label,
  value,
  en,
}: {
  label: string
  value: string
  en?: string
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {en ? <span className="ml-1 font-medium normal-case tracking-normal opacity-80">{en}</span> : null}
      </dt>
      <dd className="mt-1 truncate text-[15px] font-extrabold tabular text-foreground">{value}</dd>
    </div>
  )
}

function ImpactStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular text-foreground">{value}</dd>
    </div>
  )
}
