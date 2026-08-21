"use client"

import { ArrowDown, Clock, Sparkles, Target } from "lucide-react"
import { useCountUp } from "@/hooks/use-count-up"
import { demoMetrics } from "@/lib/incident-data"
import { ModuleConclusion } from "@/components/primitives"

function Metric({
  label,
  value,
  suffix,
  decimals = 0,
  delay = 0,
}: {
  label: string
  value: number
  suffix?: string
  decimals?: number
  delay?: number
}) {
  const { ref, display } = useCountUp(value, { duration: 1200, decimals, delay, immediate: true })
  return (
    <div className="flex flex-col items-center gap-1 px-2 text-center">
      <span ref={ref} className="text-xl font-bold tabular text-primary sm:text-2xl">
        {display}
        {suffix}
      </span>
      <span className="text-[10px] leading-snug text-muted-foreground">{label}</span>
    </div>
  )
}

export function AiValueSummary() {
  return (
    <section
      id="ai-incident-summary"
      className="overflow-hidden rounded-lg border border-border bg-card shadow-card"
    >
      <div className="h-1 bg-primary" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI 事故摘要</h2>
            <p className="text-[11px] text-muted-foreground">AI Incident Summary</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 bg-background/50 px-4 py-5 sm:flex-row sm:justify-center sm:gap-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold tabular text-muted-foreground sm:text-4xl">1,248</span>
          <span className="text-[11px] font-medium text-muted-foreground">条告警 Alarms</span>
        </div>
        <ArrowDown className="size-6 shrink-0 text-primary sm:rotate-[-90deg]" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold tabular text-[var(--p1)] sm:text-4xl">1</span>
          <span className="text-[11px] font-medium text-muted-foreground">个根因 Root Cause</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-2">
        <div className="flex items-center justify-center gap-2 bg-card px-3 py-4">
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <Metric label="分析时间 Analysis Time" value={2} suffix=" Min" />
        </div>
        <div className="flex items-center justify-center gap-2 bg-card px-3 py-4">
          <Target className="size-4 shrink-0 text-primary" />
          <Metric label="RCA 准确率 RCA Accuracy" value={demoMetrics.confidence} suffix="%" delay={200} />
        </div>
      </div>

      <div className="border-t border-border bg-primary/5 px-4 py-3">
        <p className="text-center text-[12px] font-medium leading-relaxed text-foreground">
          AI 已从 1,248 条告警中定位唯一根因并生成处置建议。
        </p>
      </div>

      <div className="px-4 pb-4 pt-2">
        <ModuleConclusion>
          实时事故处置工作台：聚焦当前事故、影响范围与下一步处置动作。
        </ModuleConclusion>
      </div>
    </section>
  )
}
