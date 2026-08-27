"use client"

import { Bot, Clock, GitBranch, LineChart, TrendingUp } from "lucide-react"
import { platformValue } from "@/data/scenarios"
import { useCountUp } from "@/hooks/use-count-up"
import { Panel, ModuleConclusion } from "@/components/primitives"

function PlatformStat({
  value,
  suffix,
  label,
  decimals = 0,
}: {
  value: number
  suffix?: string
  label: string
  decimals?: number
}) {
  const { ref, display } = useCountUp(value, { duration: 1200, decimals, immediate: true })
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card px-3 py-4 text-center">
      <span ref={ref} className="text-2xl font-bold tabular text-primary">
        {display.toLocaleString()}
        {suffix}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

/** Platform-wide ROI — stable across scenario switches */
export function PlatformValueSection() {
  const pv = platformValue

  return (
    <section id="platform-value-section">
      <Panel
        title="平台价值"
        subtitle="Platform Value"
        description="AIOps 平台整体投资回报 — 跨场景、跨领域累计价值（不随当前场景切换而变化）"
        icon={<TrendingUp className="size-4" />}
        bodyClassName="space-y-4"
      >
        <div className="rounded-lg border border-primary/25 bg-primary/6 px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            Platform ROI · 平台年投资回报
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-extrabold tabular text-success">¥{pv.annualRoi}M</span>
            <span className="text-[11px] text-muted-foreground">/ year · 覆盖 {pv.domainsCovered} 个基础设施领域</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-3 py-4 text-center">
            <Clock className="size-5 text-primary" />
            <div className="text-[10px] text-muted-foreground">Platform MTTR</div>
            <div className="flex items-center gap-2 text-sm font-bold tabular">
              <span className="text-muted-foreground">{pv.mttrBefore}</span>
              <span className="text-primary">→</span>
              <span className="text-primary">{pv.mttrAfter}</span>
            </div>
          </div>
          <PlatformStat value={pv.efficiencyGain} suffix="×" label="效率提升 Efficiency Gain" />
          <PlatformStat value={pv.automationRate} suffix="%" label="自动化率 Automation Rate" />
          <PlatformStat value={pv.hoursSavedPerMonth} suffix="h" label="月节约工时 Hours Saved / Mo" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-panel/50 px-3 py-3">
            <GitBranch className="size-4 shrink-0 text-primary" />
            <div>
              <div className="text-lg font-bold tabular text-foreground">{pv.autoCorrelated.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">月自动关联告警</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-panel/50 px-3 py-3">
            <Bot className="size-4 shrink-0 text-primary" />
            <div>
              <div className="text-lg font-bold tabular text-foreground">{pv.autoHandled.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">月自动处置告警</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-panel/50 px-3 py-3">
            <LineChart className="size-4 shrink-0 text-primary" />
            <div>
              <div className="text-lg font-bold tabular text-foreground">{pv.monthlyAlarms.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">月告警总量</div>
            </div>
          </div>
        </div>

        <ModuleConclusion>{pv.tagline}</ModuleConclusion>
      </Panel>
    </section>
  )
}
