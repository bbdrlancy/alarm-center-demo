"use client"

import { useEffect, useState } from "react"
import { GitBranch, ChevronRight } from "lucide-react"
import { pipelineSteps } from "@/lib/incident-data"
import { useDemoStory } from "@/hooks/use-demo-story"
import { Panel, ModuleConclusion } from "@/components/primitives"

const demoPipelineIndices = [0, 1, 2, 3, 4, 7]

export function CorrelationPipeline() {
  const [activeIdx, setActiveIdx] = useState(0)
  const { stage, playing, runId } = useDemoStory()

  useEffect(() => {
    if (stage === 3 && playing) return
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % pipelineSteps.length)
    }, 1400)
    return () => clearInterval(t)
  }, [stage, playing])

  useEffect(() => {
    if (stage !== 3 || !playing) return
    let i = 0
    setActiveIdx(demoPipelineIndices[0]!)
    const t = window.setInterval(() => {
      i += 1
      if (i < demoPipelineIndices.length) {
        setActiveIdx(demoPipelineIndices[i]!)
      }
    }, 900)
    return () => window.clearInterval(t)
  }, [stage, playing, runId])

  const current = pipelineSteps[activeIdx]

  return (
    <div id="correlation-pipeline">
    <Panel
      title="告警收敛过程"
      subtitle="Alarm Convergence Process"
      description="展示系统如何一步步将海量告警精简为可处理的少量事件"
      icon={<GitBranch className="size-4" />}
      action={
        <span className="rounded-md bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
          逐步精简
        </span>
      }
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {pipelineSteps.map((step, i) => {
          const isActive = i <= activeIdx
          const isCurrent = i === activeIdx
          const reduced = step.input - step.output
          return (
            <div key={step.key} className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => setActiveIdx(i)}
                className={[
                  "flex w-[168px] flex-col gap-2 rounded-lg border px-3 py-3 text-left transition-all duration-500",
                  isCurrent
                    ? "border-primary/60 bg-primary/12 shadow-[0_0_0_1px_var(--primary)]"
                    : isActive
                      ? "border-primary/30 bg-primary/6"
                      : "border-border bg-background/60",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={[
                      "grid size-6 place-items-center rounded-md text-[11px] font-bold tabular transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                    ].join(" ")}
                  >
                    {i + 1}
                  </span>
                  {reduced > 0 ? (
                    <span
                      className={[
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold tabular transition-opacity",
                        isActive ? "bg-[var(--p2)]/15 text-[var(--p2)] opacity-100" : "opacity-40",
                      ].join(" ")}
                    >
                      -{reduced.toLocaleString("en-US")}
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-foreground">{step.label}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{step.en}</div>
                </div>
                <p className="text-[10px] leading-snug text-muted-foreground">{step.desc}</p>
                <div className="mt-1 flex items-baseline gap-1.5 border-t border-border/60 pt-2">
                  <span
                    className="text-lg font-bold tabular"
                    style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}
                  >
                    {step.output.toLocaleString("en-US")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    / 由 {step.input.toLocaleString("en-US")} 条精简
                  </span>
                </div>
              </button>
              {i < pipelineSteps.length - 1 ? (
                <ChevronRight
                  className={[
                    "size-5 shrink-0 transition-colors duration-500",
                    i < activeIdx ? "text-primary" : "text-border",
                  ].join(" ")}
                />
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-background/60 px-3 py-2 text-[11px]">
        <span className="text-muted-foreground">
          当前阶段 · <span className="font-medium text-foreground">{current.label}</span>
        </span>
        <span className="tabular text-muted-foreground">
          告警由{" "}
          <span className="font-semibold text-foreground">{current.input.toLocaleString("en-US")}</span>
          {" 条精简至 "}
          <span className="font-semibold text-primary">{current.output.toLocaleString("en-US")}</span>
          {" 条"}
        </span>
      </div>
      <ModuleConclusion>
        告警从 1,248 条逐步精简至 1 条根因，运维不再被信息淹没，可专注真正需要处置的问题。
      </ModuleConclusion>
    </Panel>
    </div>
  )
}
