"use client"

import type { ReactNode } from "react"
import { AlertTriangle, ArrowRight, Clock, Server, Target, TrendingDown, Zap } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { useCountUp } from "@/hooks/use-count-up"
import { priorityMeta } from "@/lib/incident-data"

function ConfidenceValue({ confidence }: { confidence: number }) {
  const { ref, display } = useCountUp(confidence, { duration: 1200, immediate: true })
  return (
    <span ref={ref} className="tabular">
      {display}%
    </span>
  )
}

function HeroField({
  icon: Icon,
  label,
  children,
  accent = "text-foreground",
}: {
  icon: typeof Target
  label: string
  children: ReactNode
  accent?: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border border-border/80 bg-card/80 px-4 py-3.5 backdrop-blur-sm">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--p1)]/12 text-[var(--p1)]">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={`mt-0.5 text-sm font-semibold leading-snug ${accent}`}>{children}</div>
      </div>
    </div>
  )
}

export function IncidentHeroCard() {
  const { scenario } = useDemoScenario()
  const { incident } = scenario
  const tone = priorityMeta[incident.severity]

  return (
    <section
      id="incident-hero-card"
      className="relative w-full overflow-hidden rounded-xl border bg-card shadow-card"
      style={{ borderColor: `${tone.color}59`, backgroundImage: `linear-gradient(to bottom right, ${tone.color}1a, var(--card), var(--accent))` }}
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: tone.color }} />
      <div className="absolute -right-20 -top-20 size-52 rounded-full blur-3xl" style={{ backgroundColor: `${tone.color}14` }} />

      <div className="relative px-4 py-4 sm:px-5 sm:py-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm"
            style={{ borderColor: `${tone.color}80`, backgroundColor: tone.color }}
          >
            <AlertTriangle className="size-3.5" />
            {tone.label} Incident
          </span>
          <span className="text-[11px] text-muted-foreground">
            {incident.id} · {scenario.domain}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <HeroField icon={Target} label="根因 · Root Cause">
            <span style={{ color: tone.color }}>{incident.rootCause}</span>
          </HeroField>

          <HeroField icon={Zap} label="受影响服务 · Affected Service">
            {incident.businessImpact}
          </HeroField>

          <HeroField icon={Server} label="受影响资产 · Affected Assets">
            <span className="block">{incident.affectedAssets}</span>
            {incident.affectedGpu > 0 ? (
              <span className="block text-[13px] font-medium text-muted-foreground">
                {incident.affectedGpu} GPUs · {incident.affectedServer} Servers
              </span>
            ) : null}
          </HeroField>

          <HeroField icon={Target} label="置信度 · Confidence" accent="text-primary">
            <ConfidenceValue confidence={incident.confidence} />
          </HeroField>

          <HeroField icon={Clock} label="分析用时 · Analysis Time">
            {incident.analysisTime}
          </HeroField>

          <HeroField icon={TrendingDown} label="告警收敛 · Alarm Reduction">
            <span className="inline-flex flex-wrap items-center gap-2 tabular">
              <span>{incident.rawAlarms.toLocaleString()}</span>
              <ArrowRight className="size-3.5 shrink-0" style={{ color: tone.color }} />
              <span style={{ color: tone.color }}>{incident.rootCauseCount}</span>
            </span>
          </HeroField>
        </div>
      </div>
    </section>
  )
}
