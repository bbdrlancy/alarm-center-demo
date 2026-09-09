"use client"

import { LayoutGrid, Sparkles } from "lucide-react"
import { portfolioSummary } from "@/lib/incident-portfolio-data"
import { useCountUp } from "@/hooks/use-count-up"

function KpiCard({
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
  const { ref, display } = useCountUp(value, { duration: 1200, decimals, immediate: true })
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

export function PortfolioHero() {
  return (
    <section
      id="portfolio-hero"
      className="relative w-full overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/30 shadow-card"
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-primary" />
      <div className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative px-5 py-6 md:px-8 md:py-7">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <LayoutGrid className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-foreground md:text-2xl">
                Smart Incident Command Center
              </h2>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted-foreground md:text-sm">
                Monitor, prioritize and investigate all incidents across Power, Cooling, Network and
                Storage domains.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
            <Sparkles className="size-3.5" />
            全局事故视图 · Incident Overview
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <KpiCard
            value={portfolioSummary.openIncidents}
            label="进行中事故"
            sublabel="Open Incidents"
          />
          <KpiCard
            value={portfolioSummary.p1Critical}
            label="严重事故"
            sublabel="P1 Critical"
            accent="text-[var(--p1)]"
          />
          <KpiCard
            value={portfolioSummary.p2Major}
            label="重大事故"
            sublabel="P2 Major"
            accent="text-[var(--p2)]"
          />
          <KpiCard
            value={portfolioSummary.p3Minor}
            label="一般事故"
            sublabel="P3 Minor"
            accent="text-[var(--p3)]"
          />
          <KpiCard
            value={portfolioSummary.affectedAssets}
            label="受影响资产"
            sublabel="Affected Assets"
          />
          <KpiCard
            value={portfolioSummary.protectedServices}
            label="受保护服务"
            sublabel="Protected Services"
            accent="text-success"
          />
          <KpiCard
            value={portfolioSummary.estimatedBusinessRisk}
            prefix="¥"
            suffix="M"
            label="预估业务风险"
            sublabel="Business Risk"
            decimals={1}
            accent="text-[var(--p1)]"
          />
        </div>
      </div>
    </section>
  )
}
