"use client"

import { useEffect, useMemo, useState } from "react"
import { Filter, ArrowDown } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { useCountUp } from "@/hooks/use-count-up"
import { useInView } from "@/hooks/use-in-view"
import { useSequentialStages } from "@/hooks/use-sequential-stages"
import { cn } from "@/lib/utils"

function deriveFunnelStages(raw: number, root: number) {
  const afterNoise = Math.round(raw * 0.25)
  const impactChain = Math.round(raw * 0.074)
  const temporal = Math.max(root + 16, Math.round(raw * 0.014))
  return [
    { label: "Raw Alarms", zh: "原始告警", value: raw, width: 100 },
    { label: "After Noise Filter", zh: "噪声过滤后", value: afterNoise, width: 82 },
    { label: "Impact Chain", zh: "影响链路", value: impactChain, width: 68 },
    { label: "Temporal Groups", zh: "时间关联", value: temporal, width: 48 },
    { label: "Root Cause", zh: "根因", value: root, width: 24 },
  ]
}

function StageNumber({ value, delay }: { value: number; delay?: number }) {
  const { ref, display } = useCountUp(value, { duration: 1000, delay: delay ?? 0, immediate: true })
  return (
    <span ref={ref} className="tabular">
      {display}
    </span>
  )
}

function RateNumber({ rate, delay }: { rate: number; delay?: number }) {
  const { ref, display } = useCountUp(rate, { duration: 1800, decimals: 2, delay: delay ?? 0, immediate: true })
  return (
    <span ref={ref} className="tabular">
      {display}
    </span>
  )
}

export function RcaFunnel() {
  const { scenario } = useDemoScenario()
  const { incident } = scenario
  const funnelStages = useMemo(
    () => deriveFunnelStages(incident.rawAlarms, incident.rootCauseCount),
    [incident.rawAlarms, incident.rootCauseCount],
  )
  const redundant = incident.rawAlarms - incident.rootCauseCount

  const { ref, inView } = useInView()
  const { isReached, isCurrent, isFlowing } = useSequentialStages(funnelStages.length, {
    enabled: inView,
    stepDelay: 800,
  })
  const summaryActive = isReached(funnelStages.length - 1)

  return (
    <Panel
      title="告警收敛漏斗"
      subtitle="Alarm Convergence Funnel"
      description={`${incident.id} · ${scenario.domain} domain alarm reduction`}
      icon={<Filter className="size-4" />}
    >
      <div ref={ref} className="grid gap-5 lg:grid-cols-[1fr_240px] lg:items-center">
        <div className="flex flex-col items-center gap-1.5 py-2">
          {funnelStages.map((s, i) => {
            const isRoot = i === funnelStages.length - 1
            const visible = isReached(i)
            return (
              <div
                key={s.label}
                className={cn("flex w-full flex-col items-center", visible ? "animate-funnel-enter" : "opacity-0")}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className={cn(
                    "flex items-center justify-between rounded-md px-4 py-3 transition-all duration-700",
                    isRoot
                      ? "glow-p1 border border-[var(--p1)]/50 bg-[var(--p1)]/18"
                      : "border border-primary/25 bg-primary/10",
                    isCurrent(i) && "scale-[1.02]",
                  )}
                  style={{
                    width: visible ? `${s.width}%` : "20%",
                    minWidth: 180,
                    transitionProperty: "width, transform, box-shadow",
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground">{s.zh}</div>
                    <div className="truncate text-[13px] font-semibold text-foreground">{s.label}</div>
                  </div>
                  <span
                    className="ml-3 text-2xl font-bold tabular leading-none"
                    style={{ color: isRoot ? "var(--p1)" : "var(--primary)" }}
                  >
                    {visible ? <StageNumber value={s.value} delay={100} /> : null}
                  </span>
                </div>
                {!isRoot ? (
                  <ArrowDown
                    className={cn(
                      "my-0.5 size-4 transition-colors duration-300",
                      isFlowing(i) ? "animate-pulse text-[var(--p1)]" : "text-primary/30",
                    )}
                  />
                ) : null}
              </div>
            )
          })}
        </div>

        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border border-primary/30 bg-primary/8 p-6 text-center transition-opacity duration-500",
            summaryActive ? "opacity-100" : "opacity-40",
          )}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Reduction · 收敛率
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-extrabold text-primary">
              {summaryActive ? <RateNumber rate={incident.reductionRate} delay={200} /> : incident.reductionRate}
            </span>
            <span className="text-2xl font-bold text-primary">%</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-md bg-card px-2.5 py-1 font-semibold tabular text-foreground">
              {summaryActive ? <StageNumber value={incident.rawAlarms} /> : incident.rawAlarms.toLocaleString()}
            </span>
            <ArrowDown className="size-4 -rotate-90 text-primary" />
            <span className="rounded-md bg-[var(--p1)]/15 px-2.5 py-1 font-bold tabular text-[var(--p1)]">
              {summaryActive ? <StageNumber value={incident.rootCauseCount} delay={400} /> : incident.rootCauseCount}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {redundant.toLocaleString()} 条冗余告警被自动收敛，运维仅需关注{" "}
            <span className="font-medium text-primary">{incident.rootCauseCount}</span> 个可执行根因。
          </p>
        </div>
      </div>
      <ModuleConclusion>
        {incident.alarmReduction} · {incident.rcaSummary}
      </ModuleConclusion>
    </Panel>
  )
}
