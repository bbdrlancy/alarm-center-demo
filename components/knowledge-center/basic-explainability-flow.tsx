"use client"

import { useEffect, useState } from "react"
import { Building2, CircleDot, Server, Target, Zap } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { ScenarioImpactChain } from "@/components/scenario/scenario-impact-chain"
import { useDemoStory } from "@/hooks/use-demo-story"
import { ModuleConclusion, Panel } from "@/components/primitives"
import { cn } from "@/lib/utils"

const basicSections = [
  { step: 1, id: "impact-path", title: "故障传播路径", subtitle: "Impact Path" },
  { step: 2, id: "root-cause", title: "根因结论", subtitle: "Root Cause" },
  { step: 3, id: "business-impact", title: "业务影响", subtitle: "Business Impact" },
  { step: 4, id: "explanation", title: "结论说明", subtitle: "Explanation" },
] as const

function ImpactPathSection() {
  const { scenario } = useDemoScenario()
  const { incident } = scenario
  return (
    <Panel
      title="故障传播路径"
      subtitle="Impact Path"
      description={`${scenario.domain} · ${scenario.name}`}
      icon={<CircleDot className="size-4" />}
      bodyClassName="p-4"
    >
      <ScenarioImpactChain />
      <ModuleConclusion>
        {scenario.domain} 域故障起始于 {incident.rootCause}，沿传播链影响 {incident.businessImpact}。
      </ModuleConclusion>
    </Panel>
  )
}

function RootCauseSection() {
  const { scenario } = useDemoScenario()
  const { incident } = scenario
  return (
    <Panel
      title="根因结论"
      subtitle="Root Cause"
      description="AI 判定本次事故的唯一源头"
      icon={<Target className="size-4" />}
      bodyClassName="p-4"
    >
      <div className="rounded-lg border border-[var(--p1)]/40 bg-[var(--p1)]/6 px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              已确认根因 · Identified Root Cause
            </div>
            <div className="mt-1 text-lg font-bold text-[var(--p1)]">{incident.rootCause}</div>
            <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted-foreground">
              {incident.investigationFocus}
            </p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/8 px-4 py-3 text-center">
            <div className="text-2xl font-extrabold tabular text-primary">{incident.confidence}%</div>
            <div className="text-[10px] text-muted-foreground">置信度 · Confidence</div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function BusinessImpactSection() {
  const { scenario } = useDemoScenario()
  const { incident } = scenario
  const items = [
    { icon: Zap, label: "受影响服务 · Affected Service", value: incident.businessImpact },
    { icon: Server, label: "受影响资产 · Affected Assets", value: incident.affectedAssets },
    { icon: Building2, label: "领域 · Domain", value: scenario.domain },
    { icon: Building2, label: "事件编号 · Incident", value: incident.id },
  ]

  return (
    <Panel
      title="业务影响"
      subtitle="Business Impact"
      description="本次故障对业务运营造成的直接影响"
      icon={<Zap className="size-4" />}
      bodyClassName="p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-lg border border-border bg-panel px-4 py-3"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--p2)]/12 text-[var(--p2)]">
              <item.icon className="size-4" />
            </span>
            <div>
              <div className="text-[10px] text-muted-foreground">{item.label}</div>
              <div className="text-sm font-semibold text-foreground">{item.value}</div>
            </div>
          </div>
        ))}
      </div>
      <ModuleConclusion>
        {incident.businessImpact} 受到 {scenario.name} 影响，{incident.affectedAssets}，优先级 {incident.severity}。
      </ModuleConclusion>
    </Panel>
  )
}

function ExplanationSection() {
  const { scenario } = useDemoScenario()
  const { incident } = scenario
  const points = [
    { title: `${scenario.domain} 域故障源头`, detail: incident.executiveLine },
    {
      title: "传播路径已验证",
      detail: `影响链：${scenario.impactChain.map((n) => n.label).join(" → ")}`,
    },
    {
      title: "业务中断时间吻合",
      detail: `${incident.businessImpact} 告警时间与根因事件 ${incident.id} 完全对齐。`,
    },
    { title: "AI 调查结论", detail: incident.rcaSummary },
  ]

  return (
    <Panel
      title="结论说明"
      subtitle="Explanation"
      description="用业务语言说明根因判定依据与传播路径"
      icon={<Target className="size-4" />}
      bodyClassName="p-4"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {points.map((p) => (
          <div key={p.title} className="rounded-lg border border-border bg-card px-3 py-3">
            <div className="text-[12px] font-semibold text-foreground">{p.title}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{p.detail}</p>
          </div>
        ))}
      </div>
      <ModuleConclusion>
        综合传播路径、时间对齐与 {scenario.domain} 域证据，AI 以 {incident.confidence}% 置信度确认{" "}
        {incident.rootCause} 为根因；{incident.rawAlarms.toLocaleString("en-US")} 条告警收敛为{" "}
        {incident.rootCauseCount} 条，分析用时 {incident.analysisTime}。
      </ModuleConclusion>
    </Panel>
  )
}

const sectionComponents = [
  ImpactPathSection,
  RootCauseSection,
  BusinessImpactSection,
  ExplanationSection,
] as const

export function BasicExplainabilityFlow() {
  const { stage, playing, runId } = useDemoStory()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (stage !== 5 || !playing) return
    let i = 0
    setActiveStep(0)
    const t = window.setInterval(() => {
      i += 1
      if (i < basicSections.length) setActiveStep(i)
    }, 1100)
    return () => window.clearInterval(t)
  }, [stage, playing, runId])

  return (
    <div id="basic-explainability-flow" className="flex flex-col gap-4">
      {basicSections.map((section, i) => {
        const Section = sectionComponents[i]
        return (
          <div
            key={section.id}
            id={`basic-step-${section.step}`}
            className={cn(stage === 5 && playing && activeStep === i && "demo-story-highlight rounded-lg")}
          >
            <Section />
          </div>
        )
      })}
    </div>
  )
}
