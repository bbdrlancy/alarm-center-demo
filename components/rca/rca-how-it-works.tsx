"use client"

import { ArrowDown, Lightbulb, Sparkles } from "lucide-react"
import { ModuleConclusion } from "@/components/primitives"

const steps = [
  { n: 1, zh: "接入 1,248 条原始告警", en: "Ingest 1,248 raw alarms" },
  { n: 2, zh: "过滤重复与噪声", en: "Filter noise & duplicates" },
  { n: 3, zh: "按设备依赖关系归并", en: "Group by impact chain" },
  { n: 4, zh: "时间序列对齐级联事件", en: "Align cascade timeline" },
  { n: 5, zh: "匹配历史故障模式", en: "Match known fault patterns" },
  { n: 6, zh: "定位唯一根因", en: "Identify single root cause" },
]

export function RcaHowItWorks() {
  return (
    <section
      id="rca-how-it-works"
      className="overflow-hidden rounded-lg border border-primary/25 bg-accent/40 shadow-sm"
    >
      <div className="flex items-start gap-3 border-b border-border/60 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Lightbulb className="size-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">AI 如何定位根因？</h2>
          <p className="text-[11px] text-muted-foreground">How AI Finds the Root Cause</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            系统如何从 <strong className="text-foreground">1,248</strong> 条告警分析出{" "}
            <strong className="text-[var(--p1)]">UPS-A01 Battery Failure</strong>
          </p>
        </div>
      </div>

      <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col gap-2">
          {steps.slice(0, 3).map((s) => (
            <div key={s.n} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/12 text-[11px] font-bold text-primary">
                {s.n}
              </span>
              <div>
                <div className="text-[12px] font-medium text-foreground">{s.zh}</div>
                <div className="text-[10px] text-muted-foreground">{s.en}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden flex-col items-center justify-center gap-1 lg:flex">
          <ArrowDown className="size-5 text-primary" />
          <Sparkles className="size-6 text-primary" />
          <ArrowDown className="size-5 text-primary" />
        </div>

        <div className="flex flex-col gap-2">
          {steps.slice(3).map((s) => (
            <div key={s.n} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/12 text-[11px] font-bold text-primary">
                {s.n}
              </span>
              <div>
                <div className="text-[12px] font-medium text-foreground">{s.zh}</div>
                <div className="text-[10px] text-muted-foreground">{s.en}</div>
              </div>
            </div>
          ))}
          <div className="mt-1 rounded-md border border-[var(--p1)]/30 bg-[var(--p1)]/8 px-3 py-2.5 text-center">
            <div className="text-[10px] text-muted-foreground">最终根因 · Final Root Cause</div>
            <div className="text-sm font-bold text-[var(--p1)]">UPS-A01 Battery Failure</div>
            <div className="text-[10px] text-muted-foreground">置信度 98% · 分析用时 2 分钟</div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <ModuleConclusion>
          AI 在 2 分钟内完成人工需 4 小时的告警分拣与根因推理，将 1,248 条告警收敛为 1 条可执行结论。
        </ModuleConclusion>
      </div>
    </section>
  )
}
