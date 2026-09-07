"use client"

import { ArrowRight, Bot, Clock, Sparkles, TrendingDown, TrendingUp, Zap } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { useCountUp } from "@/hooks/use-count-up"

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
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border/80 bg-card/90 px-3 py-4 text-center shadow-sm backdrop-blur-sm">
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

export function ExecutiveSummaryHero() {
  const { scenario } = useDemoScenario()
  const { incident, businessValue } = scenario

  return (
    <section
      id="executive-summary-hero"
      className="relative w-full overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/12 via-card to-accent/40 shadow-card"
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: scenario.color }} />
      <div className="absolute -right-16 -top-16 size-48 rounded-full blur-3xl" style={{ backgroundColor: `${scenario.color}18` }} />

      <div className="relative px-5 py-6 md:px-8 md:py-7">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <TrendingUp className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-foreground md:text-2xl">已交付业务价值</h2>
              <p className="mt-1 text-[12px] font-medium text-primary md:text-sm">
                Business Value Delivered
              </p>
              <p className="text-[12px] font-medium text-primary md:text-sm">
                {scenario.name} · {incident.id}
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold"
            style={{
              borderColor: `${scenario.color}55`,
              backgroundColor: `${scenario.color}14`,
              color: scenario.color,
            }}
          >
            <Sparkles className="size-3.5" />
            {scenario.domain} · {scenario.themeName}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <HeroMetric
            value={businessValue.reductionRate}
            suffix="%"
            label="告警收敛率"
            sublabel="Alarm Reduction"
            accent="text-[var(--p1)]"
            decimals={2}
          />
          <HeroMetric
            value={businessValue.automationRate}
            suffix="%"
            label="自动化处置率"
            sublabel="Automated Handling"
          />
          <HeroMetric
            value={businessValue.efficiencyGain}
            suffix="×"
            label="根因分析提速"
            sublabel="Faster RCA"
          />
          <HeroMetric
            value={businessValue.annualRoi}
            prefix="¥"
            suffix="M"
            label="年投资回报"
            sublabel="Annual ROI"
            decimals={1}
            accent="text-success"
          />
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/6 px-3 py-4 sm:col-span-2 lg:col-span-1">
            <Clock className="size-5 text-primary" />
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              MTTR 降低 · MTTR Reduced
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 tabular">
              <span className="text-xl font-extrabold text-muted-foreground sm:text-2xl">{businessValue.mttrBefore}</span>
              <ArrowRight className="size-4 shrink-0 text-primary" />
              <span className="text-xl font-extrabold text-primary sm:text-2xl">
                {businessValue.mttrAfter}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-border/70 bg-card/80 px-4 py-3 text-[12px] leading-relaxed text-foreground">
          {businessValue.tagline}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/80 px-3 py-2.5 text-[11px] text-muted-foreground">
            <TrendingDown className="size-3.5 shrink-0 text-[var(--p1)]" />
            {incident.rawAlarms.toLocaleString("en-US")} alarms → {incident.rootCauseCount} root cause
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/80 px-3 py-2.5 text-[11px] text-muted-foreground">
            <Bot className="size-3.5 shrink-0 text-primary" />
            {businessValue.automationRate}% automated handling · {incident.businessImpact}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/80 px-3 py-2.5 text-[11px] text-muted-foreground">
            <Zap className="size-3.5 shrink-0 text-success" />
            ¥{businessValue.annualRoi}M ROI · {incident.rootCause}
          </div>
        </div>
      </div>
    </section>
  )
}
