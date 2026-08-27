"use client"

import { ArrowRight, Clock, Sparkles, TrendingDown } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { useCountUp } from "@/hooks/use-count-up"
import { Panel } from "@/components/primitives"

function HeroMetric({
  value,
  prefix,
  suffix,
  label,
  sublabel,
  accent = "text-primary",
  decimals = 0,
}: {
  value: number
  prefix?: string
  suffix?: string
  label: string
  sublabel: string
  accent?: string
  decimals?: number
}) {
  const { ref, display } = useCountUp(value, { duration: 1400, decimals, immediate: true })
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border/80 bg-card/90 px-3 py-4 text-center shadow-sm">
      <span className={`text-2xl font-extrabold tabular sm:text-3xl ${accent}`}>
        {prefix}
        <span ref={ref}>{display}</span>
        {suffix}
      </span>
      <span className="text-[11px] font-semibold text-foreground">{label}</span>
      <span className="text-[10px] text-muted-foreground">{sublabel}</span>
    </div>
  )
}

/** Current-scenario ROI — updates when scenario switches */
export function ScenarioValueSection() {
  const { scenario } = useDemoScenario()
  const { incident, businessValue } = scenario

  return (
    <section
      id="scenario-value-section"
      className="relative overflow-hidden rounded-xl border border-border bg-card shadow-card"
      style={{ borderColor: `${scenario.color}40` }}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: scenario.color }} />
      <div className="border-b border-border px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Scenario Value · 当前场景价值
            </div>
            <h3 className="text-lg font-bold text-foreground">{scenario.name}</h3>
            <p className="text-[11px] text-muted-foreground">
              {incident.id} · {incident.rootCause} · {incident.businessImpact}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold"
            style={{ borderColor: `${scenario.color}55`, color: scenario.color, backgroundColor: `${scenario.color}10` }}
          >
            <Sparkles className="size-3" />
            {scenario.domain}
          </span>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-6">
        <HeroMetric
          value={businessValue.reductionRate}
          suffix="%"
          label="Alarm Reduction"
          sublabel="本场景告警收敛"
          accent="text-[var(--p1)]"
          decimals={2}
        />
        <HeroMetric
          value={businessValue.efficiencyGain}
          suffix="×"
          label="RCA Speedup"
          sublabel="本场景分析提速"
        />
        <HeroMetric
          value={businessValue.businessRisk}
          prefix="¥"
          suffix="M"
          label="Risk Avoided"
          sublabel="本场景风险规避"
          decimals={1}
          accent="text-[var(--p1)]"
        />
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/6 px-3 py-4">
          <Clock className="size-5 text-primary" />
          <div className="text-[10px] font-semibold text-muted-foreground">MTTR · 本场景</div>
          <div className="flex items-center gap-2 tabular text-lg font-extrabold">
            <span className="text-muted-foreground">{businessValue.mttrBefore}</span>
            <ArrowRight className="size-4 text-primary" />
            <span className="text-primary">{businessValue.mttrAfter}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-5 py-3 text-[11px] text-muted-foreground md:px-6">
        <TrendingDown className="mr-1 inline size-3.5 text-[var(--p1)]" />
        {incident.rawAlarms.toLocaleString()} alarms → {incident.rootCauseCount} root cause · {businessValue.tagline}
      </div>
    </section>
  )
}
