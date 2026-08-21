"use client"

import type { ReactNode } from "react"
import {
  Bell,
  GitBranch,
  Bot,
  Clock,
  Coins,
  LineChart,
  Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { KpiCard, type KpiCardData } from "@/components/kpi-card"
import { Panel, ModuleConclusion } from "@/components/primitives"

const insightKpis: (KpiCardData & { icon: LucideIcon; success?: boolean })[] = [
  {
    key: "monthly-alarms",
    label: "月告警量 Monthly Alarms",
    value: 48321,
    icon: Bell,
  },
  {
    key: "auto-correlated",
    label: "自动关联 Auto Correlated",
    value: 47982,
    icon: GitBranch,
    success: true,
  },
  {
    key: "auto-handled",
    label: "自动处置 Auto Handled",
    value: 38610,
    icon: Bot,
    success: true,
  },
  {
    key: "hours-saved",
    label: "节约工时 Hours Saved",
    value: 1560,
    unit: "小时",
    icon: Clock,
    success: true,
  },
  {
    key: "annual-value",
    label: "年预估价值 Estimated Annual Value",
    value: 8.6,
    prefix: "¥",
    suffix: "M",
    decimals: 1,
    icon: Coins,
    success: true,
  },
]

const aiSummary = {
  generatedAt: "2026-08-20",
  text: [
    "本月共处理 **48,321** 起告警，其中 **47,982** 起（99.3%）由系统自动关联归类，无需人工分拣。",
    "**38,610** 起事件实现全自动处置，相当于释放 **1,560** 小时运维人力，可投入预防性维护与容量规划等高价值工作。",
    "自动化处置降低了告警遗漏与响应延迟风险，关键业务 SLA 违规事件同比减少 **92%**。",
    "综合人力节约与停机损失避免，本平台预估每年可创造 **¥860 万** 业务价值，投资回报率显著。",
  ],
}

function renderBold(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function ExecutiveInsight() {
  return (
    <Panel
      title="管理决策洞察"
      subtitle="Executive Insight"
      description="用业务语言解读运营成果，支撑管理层投资决策与资源规划"
      icon={<LineChart className="size-4" />}
      action={
        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
          <Sparkles className="size-3" />
          决策参考
        </span>
      }
      bodyClassName="p-4 md:p-5"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insightKpis.map((kpi, i) => {
            const { icon, success, ...data } = kpi
            return (
              <KpiCard
                key={kpi.key}
                kpi={{ ...data, delay: i * 80, immediate: true, success }}
                icon={icon}
              />
            )
          })}
        </div>

        <div className="flex flex-col rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-foreground">管理层摘要</div>
              <div className="truncate text-[10px] text-muted-foreground">Executive Brief · 本月运营成果</div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 bg-accent/30 p-4">
            {aiSummary.text.map((para, i) => (
              <p key={i} className="text-[12.5px] leading-relaxed text-muted-foreground">
                {renderBold(para)}
              </p>
            ))}
            <div className="mt-auto border-t border-border pt-3 text-[10px] text-muted-foreground">
              数据截至 {aiSummary.generatedAt}
            </div>
          </div>
        </div>
      </div>
      <ModuleConclusion>
        投入 AIOps 平台可显著节约人力、降低 SLA 违约风险，85% 事件自动处置，年 ROI 约 ¥860 万。
      </ModuleConclusion>
    </Panel>
  )
}
