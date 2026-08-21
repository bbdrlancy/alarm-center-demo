"use client"

import { Brain, ChevronDown } from "lucide-react"
import { graphragSteps } from "@/lib/knowledge-center-data"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { cn } from "@/lib/utils"

export function GraphragReasoning() {
  return (
    <Panel
      title="GraphRAG 推理过程"
      subtitle="GraphRAG Reasoning"
      description="AI 如何推理？ · 基于知识图谱完成从告警到根因的可解释推理"
      icon={<Brain className="size-4" />}
      bodyClassName="p-4 md:p-5"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {graphragSteps.map((step, i) => (
          <div key={step.step} className="relative flex flex-col">
            <div
              className={cn(
                "flex flex-1 flex-col gap-1.5 rounded-lg border px-3 py-3",
                step.step === 8
                  ? "border-[var(--p1)]/40 bg-[var(--p1)]/8"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-bold",
                    step.step === 8
                      ? "bg-[var(--p1)] text-white"
                      : "bg-primary/12 text-primary",
                  )}
                >
                  {step.step}
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-foreground">{step.title}</div>
                  <div className="truncate text-[9px] text-muted-foreground">{step.en}</div>
                </div>
              </div>
              {step.value ? (
                <div
                  className={cn(
                    "text-lg font-bold tabular",
                    step.step === 8 ? "text-[var(--p1)]" : "text-primary",
                  )}
                >
                  {step.value}
                </div>
              ) : null}
              <p className="text-[10px] leading-snug text-muted-foreground">{step.detail}</p>
              {step.confidence ? (
                <span className="mt-auto inline-flex w-fit rounded bg-primary/12 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  置信度 {step.confidence}
                </span>
              ) : null}
            </div>
            {i < graphragSteps.length - 1 && i % 4 === 3 ? (
              <div className="col-span-full flex justify-center py-1 lg:hidden">
                <ChevronDown className="size-4 text-border" />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 hidden items-center justify-center gap-1 lg:flex">
        {graphragSteps.slice(0, -1).map((s) => (
          <div key={s.step} className="flex items-center gap-1">
            <span className="rounded bg-primary/12 px-1.5 py-0.5 text-[9px] font-medium text-primary">
              {s.step}
            </span>
            <span className="text-border">→</span>
          </div>
        ))}
        <span className="rounded bg-[var(--p1)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--p1)]">
          8 · UPS-A01 Battery Failure
        </span>
      </div>

      <ModuleConclusion>
        GraphRAG 结合知识图谱、拓扑、时空与历史事件，在 2 分钟内输出置信度 98% 的根因结论。
      </ModuleConclusion>
    </Panel>
  )
}
