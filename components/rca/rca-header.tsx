"use client"

import { Radar, Fingerprint, Gauge, Timer, TrendingDown } from "lucide-react"
import { useActiveIncident } from "@/hooks/use-active-incident"
import { useCountUp } from "@/hooks/use-count-up"
import { SectionHeader } from "@/components/primitives"

function ConfidenceValue({ confidence }: { confidence: number }) {
  const { ref, display } = useCountUp(confidence, { duration: 1500, delay: 200, immediate: true })
  return (
    <span ref={ref} className="tabular">
      {display}%
    </span>
  )
}

export function RcaHeader() {
  const { incidentId, scenario } = useActiveIncident()
  const { incident } = scenario

  const stats = [
    {
      icon: Fingerprint,
      label: "事件编号 Incident ID",
      value: incidentId,
      accent: "text-foreground",
      animated: false as const,
    },
    {
      icon: Radar,
      label: "根因结论 Root Cause",
      value: incident.rootCause,
      accent: "text-[var(--p1)]",
      animated: false as const,
    },
    {
      icon: Gauge,
      label: "置信度 Confidence",
      accent: "text-primary",
      animated: true as const,
    },
    {
      icon: Timer,
      label: "分析用时 Analysis Time",
      value: incident.analysisTime,
      accent: "text-foreground",
      animated: false as const,
    },
    {
      icon: TrendingDown,
      label: "告警精简 Alarm Reduction",
      value: incident.alarmReduction,
      accent: "text-primary",
      animated: false as const,
    },
  ]

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <SectionHeader
        title="根因调查概览"
        subtitle="RCA Investigation Overview"
        description={`${scenario.domain} domain investigation · ${incident.businessImpact}`}
        icon={
          <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
            <Radar className="size-5" />
          </span>
        }
        action={
          <span className="hidden items-center gap-1.5 rounded-md border border-primary/30 bg-accent px-2.5 py-1 text-[11px] font-medium text-primary md:inline-flex">
            <span className="size-1.5 rounded-full bg-primary" />
            {incident.status}
          </span>
        }
        className="border-b border-border"
      />
      <div className="grid grid-cols-2 divide-border sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
        {stats.map((s) => (
          <div key={s.label} className="flex items-start gap-3 border-t border-border px-4 py-3.5 lg:border-t-0">
            <s.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </div>
              <div className={`truncate text-sm font-semibold tabular ${s.accent}`}>
                {s.animated ? <ConfidenceValue confidence={incident.confidence} /> : s.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
