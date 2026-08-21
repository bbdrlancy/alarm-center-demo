"use client"

import { useEffect, useState } from "react"
import { Bell, Bot, ChevronRight, FileText, RefreshCw, Zap } from "lucide-react"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { useCountUp } from "@/hooks/use-count-up"
import { cn } from "@/lib/utils"

const flowSteps = [
  { key: "alarm", label: "Alarm", icon: Bell, desc: "1,248 条原始告警接入" },
  { key: "analysis", label: "AI Analysis", icon: Bot, desc: "2 分钟内完成关联与收敛" },
  { key: "incident", label: "Incident", icon: Zap, desc: "归并为 1 起 P1 事件" },
  { key: "runbook", label: "Runbook", icon: FileText, desc: "5 项任务自动分派" },
  { key: "recovery", label: "Recovery", icon: RefreshCw, desc: "旁路供电 · 任务迁移" },
] as const

function RateBadge() {
  const { ref, display } = useCountUp(85, { duration: 1400, immediate: true })
  return (
    <span ref={ref} className="rounded-md bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary tabular">
      自动化率 {display}%
    </span>
  )
}

export function AutomationCenter() {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % flowSteps.length)
    }, 1800)
    return () => clearInterval(t)
  }, [])

  return (
    <Panel
      title="自动化中心"
      subtitle="Automation Center"
      description="从告警接入到业务恢复的全链路自动化处置流程"
      icon={<Bot className="size-4" />}
      action={<RateBadge />}
    >
      <div className="flex flex-wrap items-center justify-center gap-2 py-2">
        {flowSteps.map((step, i) => {
          const isActive = i <= activeIdx
          const isCurrent = i === activeIdx
          return (
            <div key={step.key} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex w-[120px] flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-all duration-500 sm:w-[140px]",
                  isCurrent
                    ? "border-primary/60 bg-primary/12 shadow-[0_0_0_1px_var(--primary)]"
                    : isActive
                      ? "border-primary/30 bg-primary/6"
                      : "border-border bg-background/60",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-md transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                  )}
                >
                  <step.icon className="size-4" />
                </span>
                <div className="text-[11px] font-semibold text-foreground">{step.label}</div>
                <p className="text-[9px] leading-snug text-muted-foreground">{step.desc}</p>
              </div>
              {i < flowSteps.length - 1 ? (
                <ChevronRight
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    i < activeIdx ? "text-primary" : "text-border",
                  )}
                />
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-2 rounded-md border border-border bg-background/60 px-3 py-2.5 text-center text-[11px] text-muted-foreground">
        当前阶段 ·{" "}
        <span className="font-semibold text-foreground">{flowSteps[activeIdx].label}</span>
        {" · "}
        {flowSteps[activeIdx].desc}
      </div>

      <ModuleConclusion>
        85% 事件实现从告警到恢复的全链路自动化，运维团队只需关注 371 起需人工介入的复杂事件。
      </ModuleConclusion>
    </Panel>
  )
}
