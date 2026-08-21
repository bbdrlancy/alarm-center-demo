"use client"

import { BatteryWarning, MapPin, Boxes, Cpu, Sparkles } from "lucide-react"
import { rootCause } from "@/lib/incident-data"
import { Panel, PriorityBadge, ModuleConclusion } from "@/components/primitives"
import { useCountUp } from "@/hooks/use-count-up"
import { cn } from "@/lib/utils"

function ConfidenceGauge({ value }: { value: number }) {
  const { ref, display, value: animated } = useCountUp(value, { duration: 1800, delay: 300, immediate: true })
  const r = 52
  const c = 2 * Math.PI * r
  const arc = 0.75
  const dash = c * arc
  const progress = dash * (animated / 100)
  const done = animated >= value - 0.5

  return (
    <div ref={ref} className={cn("relative grid size-[132px] place-items-center", done && "animate-gauge-pulse")}>
      <svg viewBox="0 0 140 140" className="size-full -rotate-[135deg]">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${c}`}
          style={{ transition: "stroke-dasharray 80ms linear" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold text-success tabular">{display}%</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">置信度</span>
      </div>
    </div>
  )
}

export function RootCauseCard() {
  const facts = [
    { icon: MapPin, label: "影响区域", value: rootCause.zone },
    { icon: Boxes, label: "根因设备", value: rootCause.device },
    { icon: Cpu, label: "影响业务", value: rootCause.service },
  ]
  return (
    <Panel
      title="根因分析摘要"
      subtitle="Root Cause Analysis"
      description="快速明确故障源头，为处置决策提供可靠依据"
      icon={<Sparkles className="size-4" />}
      action={<PriorityBadge priority={rootCause.priority} />}
      className="glow-p1"
    >
      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-[var(--p1)]/15 text-[var(--p1)]">
              <BatteryWarning className="size-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{rootCause.title}</div>
              <div className="text-sm text-muted-foreground">{rootCause.titleZh}</div>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {rootCause.summary}
          </p>

          <div className="grid grid-cols-3 gap-2">
            {facts.map((f) => (
              <div key={f.label} className="rounded-md border border-border bg-panel p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <f.icon className="size-3.5 text-primary" />
                  {f.label}
                </div>
                <div className="text-[13px] font-semibold text-foreground">{f.value}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-md bg-primary/8 px-3 py-2 text-[11px] text-muted-foreground">
            <Sparkles className="size-3.5 shrink-0 text-primary" />
            <span>
              事件 {rootCause.id} · 检测于 {rootCause.detectedAt} · 收敛方法：
              <span className="text-foreground"> {rootCause.method}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-1">
          <ConfidenceGauge value={rootCause.confidence} />
          <span className="text-[11px] text-muted-foreground">RCA Confidence</span>
        </div>
      </div>
      <ModuleConclusion>
        根因定位为 UPS-A01 电池组故障，置信度 98%，建议优先执行供电隔离与旁路切换处置。
      </ModuleConclusion>
    </Panel>
  )
}
