"use client"

import { LayoutGrid } from "lucide-react"
import type { PortfolioSummary } from "@/lib/incident-command"
import { cn } from "@/lib/utils"

const KPIS: {
  key: keyof PortfolioSummary
  zh: string
  en: string
  accent?: string
  suffix?: string
}[] = [
  { key: "openIncidents", zh: "当前事故", en: "Open Incidents" },
  { key: "p1Critical", zh: "P1 严重", en: "P1 Critical", accent: "text-[var(--p1)]" },
  { key: "p2Major", zh: "P2 重要", en: "P2 Major", accent: "text-[var(--p2)]" },
  { key: "affectedServices", zh: "受影响服务", en: "Affected Services" },
  { key: "affectedAssets", zh: "受影响资产", en: "Affected Assets" },
  { key: "teamsWorking", zh: "处置团队", en: "Teams Working" },
  { key: "averageRecovery", zh: "平均恢复进度", en: "Average Recovery", suffix: "%" },
]

export function PortfolioSummaryBar({ summary }: { summary: PortfolioSummary }) {
  return (
    <section
      id="portfolio-summary"
      className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
    >
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5">
        <LayoutGrid className="size-4 text-primary" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">事故态势</h2>
          <p className="text-[11px] text-muted-foreground">L0 Portfolio Summary · 不绑定单一事故</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border/70 sm:grid-cols-4 xl:grid-cols-7">
        {KPIS.map((kpi) => (
          <div key={kpi.key} className="bg-card px-4 py-3">
            <div className="text-[10px] font-semibold text-foreground">{kpi.zh}</div>
            <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{kpi.en}</div>
            <div className={cn("mt-1.5 font-mono text-[22px] font-extrabold tabular leading-none", kpi.accent ?? "text-foreground")}>
              {summary[kpi.key]}
              {kpi.suffix ?? ""}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
