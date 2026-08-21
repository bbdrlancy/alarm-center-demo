"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { demoMetrics } from "@/lib/incident-data"
import { useDemoStory } from "@/hooks/use-demo-story"
import { ModuleConclusion } from "@/components/primitives"
import { cn } from "@/lib/utils"

const basicSteps = [
  {
    step: 1,
    title: "Digital Twin",
    subtitle: "数字孪生",
    explanation: "AI 通过数字孪生回答：故障影响在哪里？从数据中心到业务服务的空间与拓扑范围一目了然。",
    conclusion:
      "UPS-A01 位于 Power Zone A，故障沿供电链传播至 Rack、GPU Server 与 AI Training Service。",
  },
  {
    step: 2,
    title: "Knowledge Graph",
    subtitle: "知识图谱",
    explanation: "AI 通过知识图谱回答：它知道了什么？将 UPS、告警、故障与业务服务关联为可查询的实体网络。",
    conclusion:
      "UPS-A01 与 UPS-BAT-001、INC-20260820、AI Training Service 形成完整实例关系链。",
  },
  {
    step: 3,
    title: "GraphRAG",
    subtitle: "图谱增强推理",
    explanation: "AI 通过 GraphRAG 回答：如何推理？在图谱上下文上检索路径、对齐时间与历史模式。",
    conclusion: `从 ${demoMetrics.rawAlarms.toLocaleString("en-US")} 条告警中收敛至唯一根因，分析用时 ${demoMetrics.analysisMinutes} 分钟。`,
  },
  {
    step: 4,
    title: "Final RCA",
    subtitle: "最终根因",
    explanation: "AI 最终输出可执行根因结论，并说明为何不是 PDU 或 GPU。",
    conclusion: `${demoMetrics.rootCause} · 置信度 ${demoMetrics.confidence}%`,
    final: true,
  },
] as const

function BasicStepCard({
  step,
  title,
  subtitle,
  explanation,
  conclusion,
  final,
  demoActive,
}: (typeof basicSteps)[number] & { demoActive?: boolean }) {
  return (
    <div
      id={`basic-step-${step}`}
      className={cn(
        final
          ? "rounded-lg border border-[var(--p1)]/40 bg-[var(--p1)]/6 shadow-sm"
          : "rounded-lg border border-border bg-card shadow-sm",
        demoActive && "demo-story-highlight",
      )}
    >
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              final
                ? "rounded-md bg-[var(--p1)] px-2 py-0.5 text-[10px] font-bold text-white"
                : "rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground"
            }
          >
            Step {step}
          </span>
          <span className="text-[13px] font-semibold text-foreground">{title}</span>
          <span className="text-[10px] text-muted-foreground">{subtitle}</span>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{explanation}</p>
      </div>
      <div className="px-4 py-3">
        <ModuleConclusion>{conclusion}</ModuleConclusion>
      </div>
    </div>
  )
}

export function BasicExplainabilityFlow() {
  const { stage, playing, runId } = useDemoStory()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (stage !== 5 || !playing) return
    let i = 0
    setActiveStep(0)
    const t = window.setInterval(() => {
      i += 1
      if (i < basicSteps.length) setActiveStep(i)
    }, 1100)
    return () => window.clearInterval(t)
  }, [stage, playing, runId])

  return (
    <div id="basic-explainability-flow" className="flex flex-col items-center gap-2">
      {basicSteps.map((step, i) => (
        <div key={step.step} className="flex w-full flex-col items-center gap-2">
          <BasicStepCard {...step} demoActive={stage === 5 && playing && activeStep === i} />
          {i < basicSteps.length - 1 ? (
            <ChevronDown className="size-5 text-primary" aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  )
}
