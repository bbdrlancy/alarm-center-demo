"use client"

import { ArrowRight } from "lucide-react"
import { convergenceStages, reductionRate } from "@/lib/incident-data"
import { useCountUp } from "@/hooks/use-count-up"
import { useInView } from "@/hooks/use-in-view"
import { useSequentialStages } from "@/hooks/use-sequential-stages"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { Radar } from "lucide-react"
import { cn } from "@/lib/utils"

function StageNumber({ value, delay }: { value: number; delay?: number }) {
  const { ref, display } = useCountUp(value, { duration: 1000, delay: delay ?? 0 })
  return (
    <span ref={ref} className="tabular">
      {display}
    </span>
  )
}

function RateNumber({ delay }: { delay?: number }) {
  const { ref, display } = useCountUp(reductionRate, {
    duration: 1800,
    decimals: 2,
    delay: delay ?? 0,
  })
  return (
    <span ref={ref} className="tabular">
      {display}
    </span>
  )
}

function SummaryNumber({ value, delay }: { value: number; delay?: number }) {
  const { ref, display } = useCountUp(value, { duration: 1200, delay: delay ?? 0 })
  return (
    <span ref={ref} className="tabular">
      {display}
    </span>
  )
}

export function ConvergenceFunnel() {
  const max = convergenceStages[0].value
  const { ref, inView } = useInView()
  const { isReached, isCurrent, isFlowing } = useSequentialStages(convergenceStages.length, {
    enabled: inView,
    stepDelay: 800,
  })
  const summaryActive = isReached(convergenceStages.length - 1)

  return (
    <Panel
      title="告警收敛价值"
      subtitle="Alarm Convergence"
      description="将海量告警自动压缩为唯一可执行根因，显著缩短研判时间"
      icon={<Radar className="size-4" />}
      action={
        <span className="rounded-md bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
          收敛率 99.92%
        </span>
      }
      bodyClassName="p-4 md:p-5"
    >
      <div ref={ref} className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-2.5">
          {convergenceStages.map((s, i) => {
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
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{s.label}</span>
                    <span className="text-muted-foreground">{s.en}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">{s.hint}</span>
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
                {i < convergenceStages.length - 1 ? (
                  <div
                    className={cn(
                      "ml-6 mt-1.5 flex items-center gap-1 transition-colors duration-300",
                      isFlowing(i) ? "text-[var(--p1)]" : "text-muted-foreground/40",
                    )}
                  >
                    <ArrowRight
                      className={cn("size-3 -rotate-90", isFlowing(i) && "animate-pulse")}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <div
          className={cn(
            "flex flex-col justify-center gap-4 rounded-lg border border-primary/25 bg-primary/8 p-5 text-center transition-opacity duration-500",
            summaryActive ? "opacity-100" : "opacity-40",
          )}
        >
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            最终收敛率 · Reduction
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-extrabold text-primary">
              {summaryActive ? <RateNumber delay={200} /> : "0.00"}
            </span>
            <span className="text-2xl font-bold text-primary">%</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="rounded-md bg-card px-2.5 py-1 font-semibold text-foreground tabular">
              {summaryActive ? <SummaryNumber value={1248} /> : "0"}
            </span>
            <ArrowRight className="size-4 text-primary" />
            <span className="rounded-md bg-[var(--p1)]/15 px-2.5 py-1 font-bold text-[var(--p1)] tabular">
              {summaryActive ? <SummaryNumber value={1} delay={400} /> : "0"}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            传统人工分析需 <span className="font-medium text-foreground">4 小时以上</span>，AI 引擎在
            <span className="font-medium text-primary"> 6 秒</span> 内完成收敛与根因定位。
          </p>
        </div>
      </div>
      <ModuleConclusion>
        1,248 条原始告警收敛为 1 条根因事件，运维只需聚焦唯一处置入口，研判效率提升 99.92%。
      </ModuleConclusion>
    </Panel>
  )
}
