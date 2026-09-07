"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ChevronRight, Filter } from "lucide-react"
import { useDemoScenario } from "@/components/scenario/scenario-provider"
import { Panel } from "@/components/primitives"
import { useDemoStory } from "@/hooks/use-demo-story"
import {
  applyConvergenceRule,
  CONVERGENCE_RULES,
  getRootCauseItem,
  getScenarioRawAlarms,
  toRawItems,
  type ConvergenceItem,
} from "@/lib/alarm-convergence"
import { cn } from "@/lib/utils"
import type { AlarmSeverity } from "@/lib/incident-data"

const severityTone: Record<AlarmSeverity, { color: string; bg: string }> = {
  Critical: { color: "#e53935", bg: "rgba(229,57,53,0.14)" },
  Major: { color: "#fb8c00", bg: "rgba(251,140,0,0.14)" },
  Minor: { color: "#c9a227", bg: "rgba(201,162,39,0.16)" },
  Warning: { color: "#0078d4", bg: "rgba(0,120,212,0.14)" },
}

function AlarmRow({ item }: { item: ConvergenceItem }) {
  const tone = severityTone[item.severity]
  return (
    <li
      className="rounded-md border border-border/80 bg-card px-2 py-1.5"
      style={{ borderLeftColor: tone.color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">{item.time}</span>
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
          style={{ color: tone.color, backgroundColor: tone.bg }}
        >
          {item.severity}
        </span>
      </div>
      <div className="mt-0.5 truncate text-[11px] font-semibold text-foreground">{item.device}</div>
      <div className="truncate font-mono text-[10px] text-muted-foreground">{item.title}</div>
      <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">{item.detail}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        {item.hint ? <span className="text-[9px] font-semibold text-primary">{item.hint}</span> : <span />}
        {item.merged && item.merged > 1 ? (
          <span className="text-[9px] font-semibold text-muted-foreground">归并 {item.merged} 条</span>
        ) : null}
      </div>
    </li>
  )
}

function Column({
  title,
  en,
  count,
  accent,
  children,
}: {
  title: string
  en: string
  count: number
  accent?: "raw" | "rule" | "root-p1" | "root-p2"
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        "flex min-h-[520px] min-w-0 flex-col rounded-lg border bg-muted/20",
        accent === "raw" && "border-primary/30 bg-primary/5",
        accent === "rule" && "border-border bg-card",
        accent === "root-p1" && "border-[#e53935]/45 bg-[#e53935]/6",
        accent === "root-p2" && "border-[#fb8c00]/45 bg-[#fb8c00]/6",
      )}
    >
      <header className="border-b border-border/70 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
          <span className="tabular text-[14px] font-bold text-foreground">{count}</span>
        </div>
        <div className="text-[10px] text-muted-foreground">{en}</div>
      </header>
      {children}
    </section>
  )
}

export function RcaFunnel() {
  const { scenario } = useDemoScenario()
  const { stage, playing, runId } = useDemoStory()
  const [ruleKey, setRuleKey] = useState(CONVERGENCE_RULES[0]!.key)

  useEffect(() => {
    setRuleKey(CONVERGENCE_RULES[0]!.key)
  }, [scenario.id])

  useEffect(() => {
    if (stage !== 3 || !playing) return
    let i = 0
    setRuleKey(CONVERGENCE_RULES[0]!.key)
    const timer = window.setInterval(() => {
      i += 1
      if (i < CONVERGENCE_RULES.length) setRuleKey(CONVERGENCE_RULES[i]!.key)
    }, 1100)
    return () => window.clearInterval(timer)
  }, [stage, playing, runId])

  const rawItems = useMemo(() => toRawItems(getScenarioRawAlarms(scenario)), [scenario])
  const rule = CONVERGENCE_RULES.find((item) => item.key === ruleKey) ?? CONVERGENCE_RULES[0]!
  const aggregated = useMemo(() => applyConvergenceRule(scenario, rule.key), [scenario, rule.key])
  const root = useMemo(() => getRootCauseItem(scenario), [scenario])
  const reduced = Math.max(0, rawItems.length - aggregated.length)
  const rootAccent = scenario.incident.severity === "P1" ? "root-p1" : "root-p2"
  const rootColor = scenario.incident.severity === "P1" ? "#e53935" : "#fb8c00"

  return (
    <Panel
      title="告警收敛漏斗"
      subtitle="Alarm Convergence Funnel"
      description={`${scenario.incident.id} · 左侧全量原始告警，中间按所选规则聚合，右侧最终根因`}
      icon={<Filter className="size-4" />}
    >
      <div className="mb-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <label className="text-[11px] font-semibold text-foreground" htmlFor="convergence-rule">
          自动分析规则
        </label>
        <div className="mt-1.5 flex flex-col gap-2 lg:flex-row lg:items-start">
          <select
            id="convergence-rule"
            value={rule.key}
            onChange={(event) => setRuleKey(event.target.value)}
            className="min-w-[240px] rounded-md border border-border bg-background px-2 py-1.5 text-[12px] font-semibold text-foreground"
          >
            {CONVERGENCE_RULES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.zh} · {item.en}
              </option>
            ))}
          </select>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] leading-snug text-muted-foreground">{rule.how}</p>
            <p className="mt-1 text-[11px] font-semibold tabular text-foreground">
              {rawItems.length} → {aggregated.length}
              {reduced > 0 ? <span className="ml-1 text-[#fb8c00]">−{reduced}</span> : null}
            </p>
          </div>
        </div>
      </div>

      <div id="correlation-pipeline" className="grid items-stretch gap-3 lg:grid-cols-[1.05fr_24px_1.2fr_24px_0.9fr]">
        <Column title="原始告警" en="Raw Alarms · Full set" count={rawItems.length} accent="raw">
          <ul className="flex max-h-[560px] flex-1 flex-col gap-1.5 overflow-y-auto p-2">
            {rawItems.map((item) => (
              <AlarmRow key={item.id} item={item} />
            ))}
          </ul>
        </Column>

        <div className="hidden flex-col items-center justify-center lg:flex">
          <ChevronRight className="size-5 text-primary" />
          <span className="mt-1 text-[9px] font-semibold text-muted-foreground">规则</span>
        </div>

        <Column title={rule.zh} en={rule.en} count={aggregated.length} accent="rule">
          <ul className="flex max-h-[560px] flex-1 flex-col gap-1.5 overflow-y-auto p-2">
            {aggregated.map((item) => (
              <AlarmRow key={item.id} item={item} />
            ))}
          </ul>
        </Column>

        <div className="hidden flex-col items-center justify-center lg:flex">
          <ChevronRight className="size-5" style={{ color: rootColor }} />
          <span className="mt-1 text-[9px] font-semibold text-muted-foreground">根因</span>
        </div>

        <Column title="最终根因" en="Root Cause" count={1} accent={rootAccent}>
          <div className="flex flex-1 flex-col gap-2 p-3">
            <div className="rounded-lg border bg-card p-3" style={{ borderColor: `${rootColor}66` }}>
              <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: rootColor }}>
                {scenario.incident.severity} · {scenario.incident.confidence}% 置信度
              </div>
              <div className="mt-1 text-[14px] font-bold text-foreground">{root.title}</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">{scenario.incident.rootCauseZh}</div>
              <div className="mt-2 font-mono text-[11px] text-foreground">{root.device}</div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{root.detail}</p>
            </div>
            <p className="text-[10px] leading-snug text-muted-foreground">
              根因不随中间规则切换改变：各规则只展示该规则对全量告警的聚合效果，最终结论由因果推理给出。
            </p>
          </div>
        </Column>
      </div>
    </Panel>
  )
}
