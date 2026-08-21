"use client"

import { ArrowRight, TrendingDown } from "lucide-react"
import { useCountUp } from "@/hooks/use-count-up"
import { useInView } from "@/hooks/use-in-view"
import { useSequentialStages } from "@/hooks/use-sequential-stages"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { cn } from "@/lib/utils"

const journeyStages = [
  { key: "raw", label: "原始告警 Raw Alarms", value: 1248 },
  { key: "patterns", label: "告警模式 Alarm Patterns", value: 92 },
  { key: "clusters", label: "告警聚类 Alarm Clusters", value: 17 },
  { key: "incidents", label: "故障事件 Incidents", value: 3 },
  { key: "rootcause", label: "唯一根因 Root Cause", value: 1 },
] as const

const reductionRate = 99.92

function StageNumber({ value, delay }: { value: number; delay?: number }) {
  const { ref, display } = useCountUp(value, { duration: 1000, delay: delay ?? 0 })
  return (
    <span ref={ref} className="tabular">
      {display}
    </span>
  )
}

function RateNumber({ delay }: { delay?: number }) {
  const { ref, display } = useCountUp(reductionRate, { duration: 1800, decimals: 2, delay: delay ?? 0 })
  return (
    <span ref={ref} className="tabular">
      {display}
    </span>
  )
}

export function AlarmReductionJourney() {
  const max = journeyStages[0].value
  const { ref, inView } = useInView()
  const { isReached, isCurrent, isFlowing } = useSequentialStages(journeyStages.length, {
    enabled: inView,
    stepDelay: 800,
  })
  const summaryActive = isReached(journeyStages.length - 1)

  return (
    <Panel
      title="告警精简历程"
      subtitle="Alarm Reduction Journey"
      description="从 1,248 条原始告警到 1 条根因，展示系统如何帮运维「去噪」"
      icon={<TrendingDown className="size-4" />}
      action={
        <span className="rounded-md bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
          收敛率 99.92%
        </span>
      }
      bodyClassName="p-4 md:p-5"
    >
      <div ref={ref} className="flex flex-col gap-2.5">
        {journeyStages.map((s, i) => {
          const widthPct = 22 + (Math.log10(s.value + 1) / Math.log10(max + 1)) * 78
          const isRoot = s.key === "rootcause"
          const visible = isReached(i)
          return (
            <div
              key={s.key}
              className={cn("group", visible ? "animate-funnel-enter" : "opacity-0")}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium text-foreground">{s.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "relative flex h-11 items-center rounded-md px-3 transition-all duration-700",
                    isRoot
                      ? "glow-p1 border border-[var(--p1)]/50 bg-[var(--p1)]/18"
                      : "border border-primary/25 bg-primary/12",
                    isCurrent(i) && "scale-[1.02]",
                  )}
                  style={{
                    width: visible ? `${widthPct}%` : "22%",
                    transitionProperty: "width, transform, box-shadow",
                  }}
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-md opacity-25"
                    style={{
                      width: "100%",
                      background: isRoot
                        ? "linear-gradient(90deg,var(--p1),transparent)"
                        : "linear-gradient(90deg,var(--primary),transparent)",
                    }}
                  />
                  <span
                    className="relative text-2xl font-bold leading-none"
                    style={{ color: isRoot ? "var(--p1)" : "var(--primary)" }}
                  >
                    {visible ? <StageNumber value={s.value} delay={100} /> : null}
                  </span>
                </div>
              </div>
              {i < journeyStages.length - 1 ? (
                <div
                  className={cn(
                    "ml-6 mt-1.5 flex items-center gap-1 transition-colors duration-300",
                    isFlowing(i) ? "text-[var(--p1)]" : "text-muted-foreground/40",
                  )}
                >
                  <ArrowRight className={cn("size-3 -rotate-90", isFlowing(i) && "animate-pulse")} />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div
        className={cn(
          "relative mt-5 overflow-hidden rounded-lg border border-primary/30 bg-gradient-to-r from-primary/16 via-primary/10 to-primary/4 p-5 text-center glow-primary transition-opacity duration-500",
          summaryActive ? "opacity-100" : "opacity-40",
        )}
      >
        <span
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: "linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%)",
          }}
        />
        <div className="relative flex flex-col items-center gap-1">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-extrabold text-primary">
              {summaryActive ? <RateNumber delay={200} /> : "0.00"}
            </span>
            <span className="text-2xl font-bold text-primary">%</span>
          </div>
          <div className="text-sm font-semibold tracking-wide text-foreground">Reduction</div>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm">
            <span className="rounded-md bg-card px-2.5 py-1 font-semibold text-foreground tabular">
              {summaryActive ? <StageNumber value={1248} /> : "0"}
            </span>
            <ArrowRight className="size-4 text-primary" />
            <span className="rounded-md bg-[var(--p1)]/15 px-2.5 py-1 font-bold text-[var(--p1)] tabular">
              {summaryActive ? <StageNumber value={1} delay={400} /> : "0"}
            </span>
          </div>
        </div>
      </div>
      <ModuleConclusion>
        1,248 条告警精简为 1 条根因，运维不再被信息淹没，可专注真正需要处置的问题。
      </ModuleConclusion>
    </Panel>
  )
}
