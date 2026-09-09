"use client"

import { ArrowRight, ClipboardList, FileSearch } from "lucide-react"
import Link from "next/link"
import { rcaHref } from "@/data/scenarios"
import { IncidentSummary } from "@/components/incident-portfolio/incident-summary"
import { PriorityBadge } from "@/components/primitives"
import type { CommandIncident } from "@/lib/incident-command"
import { priorityMeta } from "@/lib/incident-data"
import { cn } from "@/lib/utils"

const actionStatusStyle: Record<CommandIncident["nextAction"]["runStatus"], string> = {
  Pending: "bg-muted text-muted-foreground border-border",
  Running: "bg-indigo-500/12 text-indigo-700 border-indigo-400/35",
  Completed: "bg-primary/12 text-primary border-primary/35",
}

export function IncidentDetailPane({ incident }: { incident: CommandIncident | null }) {
  if (!incident) {
    return (
      <section className="flex min-h-[420px] flex-col justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-8 text-center">
        <FileSearch className="mx-auto size-8 text-muted-foreground/70" />
        <h2 className="mt-3 text-sm font-semibold text-foreground">事故详情</h2>
        <p className="mt-1 text-[12px] text-muted-foreground">Incident Detail</p>
        <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
          先看左侧事故组合选择事故，再在右侧查看发生了什么、谁在负责、以及当前行动。
        </p>
      </section>
    )
  }

  const tone = priorityMeta[incident.severity]
  const workspaceHref = rcaHref(incident.incidentId)

  return (
    <section
      className="overflow-hidden rounded-xl border-2 bg-accent shadow-card"
      style={{ borderColor: tone.color }}
    >
      <div className="h-1.5" style={{ backgroundColor: tone.color }} />
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-primary/15 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">事故详情 · Incident Detail</div>
          <h2 className="mt-0.5 text-sm font-semibold text-foreground">
            {incident.shortTitle}
            <span className="ml-2 font-mono text-[11px] font-medium text-muted-foreground">
              {incident.incidentId}
            </span>
          </h2>
          <p className="text-[11px] text-muted-foreground">{incident.titleZh}</p>
        </div>
        <PriorityBadge priority={incident.severity} />
      </header>

      <div className="flex flex-col gap-3 p-3">
        <IncidentSummary incident={incident} />
        <RecommendedActionCard incident={incident} />
        <Link
          href={workspaceHref}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Open Workspace
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}

function RecommendedActionCard({ incident }: { incident: CommandIncident }) {
  const action = incident.nextAction

  return (
    <section className="rounded-lg border border-border bg-card shadow-card">
      <header className="flex items-start gap-2.5 border-b border-border px-4 py-3">
        <span className="mt-0.5 shrink-0 text-primary">
          <ClipboardList className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">当前行动</h3>
          <p className="text-[11px] text-muted-foreground">Current Action</p>
        </div>
      </header>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold",
              actionStatusStyle[action.runStatus],
            )}
          >
            Action {action.runStatus}
          </span>
          <span className="text-[11px] text-muted-foreground">{action.ownerTeam}</span>
        </div>
        <p className="mt-2 text-[14px] font-semibold leading-snug text-foreground">{action.short}</p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{action.actionZh}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span>
            ETA <span className="font-semibold tabular text-foreground">{action.etaShort}</span>
          </span>
          <span className="font-semibold text-[var(--p1)]">-{action.riskReduction}% risk</span>
        </div>
      </div>
    </section>
  )
}
