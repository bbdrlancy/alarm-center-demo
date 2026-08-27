"use client"

import { Brain, ChevronDown } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { cn } from "@/lib/utils"

export function GraphragReasoning() {
  const { scenario } = useDemoScenario()
  const { incident, graph } = scenario
  const { graphrag } = graph

  const steps = [
    { step: 1, title: "检索告警实例", en: "Retrieve alarm instances", detail: `从 ${incident.rawAlarms.toLocaleString("en-US")} 条原始告警中提取与 ${scenario.domain} 域相关的实例对象。` },
    { step: 2, title: "构建子图", en: "Build subgraph", detail: `基于 ${graph.nodes.length} 个图谱节点与 ${graph.edges.length} 条关系构建局部推理子图。` },
    { step: 3, title: "空间关系验证", en: "Spatial validation", detail: graphrag.factors[0]?.detail ?? "验证空间与拓扑关系。" },
    { step: 4, title: "传播链对齐", en: "Propagation alignment", detail: graphrag.factors[1]?.detail ?? "对齐影响传播链路与时间序列。" },
    { step: 5, title: "业务影响关联", en: "Business correlation", detail: graphrag.factors[2]?.detail ?? `关联业务服务 ${incident.businessImpact}。` },
    { step: 6, title: "历史模式匹配", en: "Historical pattern", detail: graphrag.factors[3]?.detail ?? "匹配历史故障模式库。" },
    { step: 7, title: "置信度评分", en: "Confidence scoring", value: `${graphrag.confidence}%`, detail: "综合多源证据计算根因置信度。" },
    {
      step: 8,
      title: "输出最终根因",
      en: "Final Root Cause",
      value: incident.rootCause,
      confidence: `${graphrag.confidence}%`,
      detail: incident.rcaSummary,
    },
  ]

  return (
    <Panel
      title="GraphRAG 推理过程"
      subtitle="GraphRAG Reasoning"
      description="AI 如何推理？ · 基于知识图谱完成从告警到根因的可解释推理"
      icon={<Brain className="size-4" />}
      bodyClassName="p-4 md:p-5"
    >
      <div className="mb-3 text-[11px] font-semibold text-foreground">{graphrag.title}</div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
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
            {i < steps.length - 1 && i % 4 === 3 ? (
              <div className="col-span-full flex justify-center py-1 lg:hidden">
                <ChevronDown className="size-4 text-border" />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 hidden items-center justify-center gap-1 lg:flex">
        {steps.slice(0, -1).map((s) => (
          <div key={s.step} className="flex items-center gap-1">
            <span className="rounded bg-primary/12 px-1.5 py-0.5 text-[9px] font-medium text-primary">
              {s.step}
            </span>
            <span className="text-border">→</span>
          </div>
        ))}
        <span className="rounded bg-[var(--p1)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--p1)]">
          8 · {incident.rootCause}
        </span>
      </div>

      <ModuleConclusion>
        GraphRAG 结合知识图谱、拓扑、时空与历史事件，在 {incident.analysisTime} 内输出置信度 {graphrag.confidence}% 的根因结论。
        {graph.conclusion}
      </ModuleConclusion>
    </Panel>
  )
}
