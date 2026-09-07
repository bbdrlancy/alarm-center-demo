"use client"

import { Sparkles } from "lucide-react"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { cn } from "@/lib/utils"

const capabilities = [
  { key: "monitoring", label: "监控 · Monitoring", level: 95, status: "成熟" },
  { key: "alert", label: "告警管理 · Alert Management", level: 92, status: "成熟" },
  { key: "correlation", label: "告警关联 · Alarm Correlation", level: 88, status: "成熟" },
  { key: "rca", label: "根因分析 · Root Cause Analysis", level: 85, status: "成熟" },
  { key: "predictive", label: "预测性运维 · Predictive AIOps", level: 62, status: "发展中" },
  { key: "autonomous", label: "自主运维 · Autonomous Operations", level: 45, status: "探索中" },
] as const

function levelColor(level: number) {
  if (level >= 80) return "bg-primary"
  if (level >= 60) return "bg-[var(--p2)]"
  return "bg-muted-foreground/40"
}

function statusBadge(status: string) {
  if (status === "成熟") return "bg-primary/12 text-primary"
  if (status === "发展中") return "bg-[var(--p2)]/12 text-[var(--p2)]"
  return "bg-muted text-muted-foreground"
}

export function AiCapability() {
  return (
    <Panel
      title="AI 能力"
      subtitle="AI Capability"
      description="AIOps 能力成熟度模型 · 评估当前投资阶段与演进路径"
      icon={<Sparkles className="size-4" />}
      action={
        <span className="rounded-md bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
          4/6 能力成熟
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {capabilities.map((cap) => (
          <div key={cap.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-foreground">{cap.label}</span>
              <div className="flex items-center gap-2">
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", statusBadge(cap.status))}>
                  {cap.status}
                </span>
                <span className="text-[11px] font-bold tabular text-primary">{cap.level}%</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full transition-all duration-700", levelColor(cap.level))}
                style={{ width: `${cap.level}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <ModuleConclusion>
        告警关联与根因分析能力已成熟可用，预测性与自主运维能力持续演进中。
      </ModuleConclusion>
    </Panel>
  )
}
