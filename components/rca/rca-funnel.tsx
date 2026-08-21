"use client"

import { Filter, ArrowDown } from "lucide-react"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { useCountUp } from "@/hooks/use-count-up"
import { useInView } from "@/hooks/use-in-view"
import { useSequentialStages } from "@/hooks/use-sequential-stages"
import { cn } from "@/lib/utils"

const funnelStages = [
  { label: "Raw Alarms", zh: "原始告警", value: 1248, width: 100 },
  { label: "After Noise Filter", zh: "噪声过滤后", value: 312, width: 82 },
  { label: "Impact Chain", zh: "影响链路", value: 92, width: 68 },
  { label: "Temporal Groups", zh: "时间关联", value: 17, width: 48 },
  { label: "Root Cause", zh: "根因", value: 1, width: 24 },
]

function StageNumber({ value, delay }: { value: number; delay?: number }) {
  const { ref, display } = useCountUp(value, { duration: 1000, delay: delay ?? 0, immediate: true })
  return (
    <span ref={ref} className="tabular">
      {display}
    </span>
  )
}

function RateNumber({ delay }: { delay?: number }) {
  const { ref, display } = useCountUp(99.92, { duration: 1800, decimals: 2, delay: delay ?? 0, immediate: true })
  return (
    <span ref={ref} className="tabular">
      {display}
    </span>
  )
}

export function RcaFunnel() {
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
      description="可视化展示告警从噪声到根因的收敛价值"
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
                    background: isRoot
                      ? "linear-gradient(90deg, rgba(229,57,53,0.22), rgba(229,57,53,0.10))"
                      : "linear-gradient(90deg, rgba(61,205,88,0.16), rgba(61,205,88,0.06))",
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
              {summaryActive ? <RateNumber delay={200} /> : "99.92"}
            </span>
            <span className="text-2xl font-bold text-primary">%</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-md bg-card px-2.5 py-1 font-semibold tabular text-foreground">
              {summaryActive ? <StageNumber value={1248} /> : "1,248"}
            </span>
            <ArrowDown className="size-4 -rotate-90 text-primary" />
            <span className="rounded-md bg-[var(--p1)]/15 px-2.5 py-1 font-bold tabular text-[var(--p1)]">
              {summaryActive ? <StageNumber value={1} delay={400} /> : "1"}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            1247 条冗余告警被自动收敛，运维仅需关注 <span className="font-medium text-primary">1</span> 个可执行根因。
          </p>
        </div>
      </div>
      <ModuleConclusion>
        1247 条冗余告警被自动收敛，运维仅需关注 1 个可执行根因，聚焦处置而非分拣。
      </ModuleConclusion>
    </Panel>
  )
}
