"use client"

import { ArrowRight, Zap } from "lucide-react"
import { Panel, ModuleConclusion } from "@/components/primitives"

const comparisons = [
  { key: "alarm", label: "告警研判 Alarm Triage", traditional: "4 小时", ai: "2 分钟" },
  { key: "rca", label: "根因定位 Root Cause", traditional: "2 小时", ai: "3 分钟" },
  { key: "impact", label: "影响评估 Impact Scope", traditional: "60 分钟", ai: "30 秒" },
  { key: "report", label: "事故报告 Incident Report", traditional: "30 分钟", ai: "自动生成" },
] as const

export function OperationalEfficiency() {
  return (
    <Panel
      title="运营效率"
      subtitle="Operational Efficiency"
      description="对比传统人工处置与 AI 智能处置在各环节的时间差异，直观感受效率提升"
      icon={<Zap className="size-4" />}
      action={
        <span className="rounded-md bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
          显著提效
        </span>
      }
    >
      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-border bg-panel px-4 py-3">
        <div className="text-center">
          <div className="text-xs font-semibold text-muted-foreground">传统人工处置</div>
          <div className="text-[10px] text-muted-foreground/80">Traditional Operation</div>
        </div>
        <span className="rounded-md bg-primary/12 px-2.5 py-1 text-[11px] font-bold text-primary">
          VS
        </span>
        <div className="text-center">
          <div className="text-xs font-semibold text-primary">AI 智能处置</div>
          <div className="text-[10px] text-muted-foreground/80">AI Operation</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {comparisons.map((item) => (
          <div
            key={item.key}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3.5 shadow-sm"
          >
            <div className="text-[11px] font-medium text-foreground">{item.label}</div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="rounded-md border border-border bg-panel px-2 py-2 text-center">
                <div className="text-[10px] text-muted-foreground">传统方式</div>
                <div className="mt-0.5 text-lg font-bold tabular text-muted-foreground">
                  {item.traditional}
                </div>
              </div>
              <ArrowRight className="size-4 shrink-0 text-primary" />
              <div className="rounded-md border border-primary/25 bg-primary/8 px-2 py-2 text-center">
                <div className="text-[10px] text-primary">AI 方式</div>
                <div className="mt-0.5 text-lg font-bold tabular text-primary">{item.ai}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ModuleConclusion>
        引入 AI 后，告警研判从 4 小时降至 2 分钟，事故报告自动生成，每月可节约 1,560 工时。
      </ModuleConclusion>
    </Panel>
  )
}
