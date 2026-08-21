"use client"

import { ArrowDown, Sparkles, TrendingUp } from "lucide-react"
import { demoMetrics } from "@/lib/incident-data"
import { useCountUp } from "@/hooks/use-count-up"

function HeroStat({
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
  sublabel?: string
  accent?: string
  decimals?: number
}) {
  const { ref, display } = useCountUp(value, { duration: 1400, decimals, immediate: true })
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border/80 bg-card/90 px-4 py-4 text-center shadow-sm backdrop-blur-sm">
      <span className={`text-3xl font-extrabold tabular sm:text-4xl ${accent}`}>
        {prefix ? <span>{prefix}</span> : null}
        <span ref={ref}>{display}</span>
        {suffix}
      </span>
      <span className="text-[12px] font-semibold text-foreground">{label}</span>
      {sublabel ? <span className="text-[10px] text-muted-foreground">{sublabel}</span> : null}
    </div>
  )
}

function FlowPair({
  from,
  fromLabel,
  to,
  toLabel,
  vertical = false,
}: {
  from: string
  fromLabel: string
  to: string
  toLabel: string
  vertical?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-center gap-3 rounded-xl border border-primary/25 bg-primary/6 px-5 py-4 ${
        vertical ? "flex-col" : "flex-col sm:flex-row"
      }`}
    >
      <div className="text-center">
        <div className="text-2xl font-extrabold tabular text-foreground sm:text-3xl">{from}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{fromLabel}</div>
      </div>
      <ArrowDown
        className={`size-6 shrink-0 text-primary ${vertical ? "" : "sm:rotate-[-90deg]"}`}
      />
      <div className="text-center">
        <div className="text-2xl font-extrabold tabular text-primary sm:text-3xl">{to}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{toLabel}</div>
      </div>
    </div>
  )
}

export function HeroRoiSummary() {
  return (
    <section
      id="hero-roi-summary"
      className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/12 via-card to-accent/40 shadow-card"
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-primary" />
      <div className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-12 size-56 rounded-full bg-primary/8 blur-3xl" />

      <div className="relative px-5 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <TrendingUp className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-foreground md:text-2xl">AI 运维价值总览</h2>
              <p className="text-[12px] font-medium text-primary md:text-sm">
                AI Operations Value Snapshot
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
            <Sparkles className="size-3.5" />
            Hero ROI · 销售演示首屏
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.1fr]">
          <FlowPair
            from={demoMetrics.rawAlarms.toLocaleString("en-US")}
            fromLabel="原始告警 Raw Alarms"
            to={String(demoMetrics.rootCauseCount)}
            toLabel="根因事件 Root Cause"
          />
          <FlowPair
            from="4 Hours"
            fromLabel="人工分析 Manual Analysis"
            to="2 Minutes"
            toLabel="AI 分析 AI Analysis"
          />
          <div className="grid grid-cols-3 gap-3">
            <HeroStat value={120} suffix="×" label="效率提升" sublabel="Efficiency Gain" />
            <HeroStat value={85} suffix="%" label="自动化率" sublabel="Automation Rate" />
            <HeroStat
              value={8.6}
              prefix="¥"
              suffix="M"
              label="年价值"
              sublabel="Annual Value"
              decimals={1}
              accent="text-success"
            />
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-primary/20 bg-card/80 px-5 py-4 text-center backdrop-blur-sm">
          <p className="text-[14px] font-semibold leading-relaxed text-foreground md:text-base">
            AI 将故障分析时间从{" "}
            <span className="text-muted-foreground">4 小时</span>
            {" 压缩至 "}
            <span className="text-primary">2 分钟</span>
            ，每年创造约{" "}
            <span className="text-success">860 万元</span>
            业务价值。
          </p>
        </div>
      </div>
    </section>
  )
}
