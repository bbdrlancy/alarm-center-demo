"use client"

import { Clock, ShieldCheck, Bot, Coins } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { KpiCard, type KpiCardData } from "@/components/kpi-card"
import { ModuleConclusion, SectionHeader } from "@/components/primitives"

/** 价值导向 KPI — 弱化技术指标，突出管理层关心的结果 */
const valueKpis: (KpiCardData & { icon: LucideIcon; success?: boolean })[] = [
  {
    key: "time-saved",
    label: "节约工时 Time Saved",
    value: 1560,
    unit: "小时",
    icon: Clock,
    success: true,
  },
  {
    key: "risk-reduction",
    label: "风险降低 Risk Reduction",
    value: 92,
    suffix: "%",
    icon: ShieldCheck,
    success: true,
  },
  {
    key: "automation-rate",
    label: "自动化率 Automation Rate",
    value: 85,
    suffix: "%",
    icon: Bot,
    success: true,
  },
  {
    key: "annual-roi",
    label: "年投资回报 Annual ROI",
    value: 8.6,
    prefix: "¥",
    suffix: "M",
    decimals: 1,
    icon: Coins,
    success: true,
  },
]

export function ExecutiveSummary() {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <div className="h-1 bg-primary" />
      <SectionHeader
        title="价值总览"
        subtitle="Value Overview"
        description="用四个核心指标回答：省了多少时间、降了多少风险、自动化到什么程度、回报有多少"
      />
      <div className="grid gap-3 bg-background/50 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-4">
        {valueKpis.map((kpi, i) => {
          const { icon, success, ...data } = kpi
          return (
            <KpiCard
              key={kpi.key}
              kpi={{ ...data, delay: i * 80, success, immediate: true }}
              icon={icon}
            />
          )
        })}
      </div>
      <div className="px-4 pb-4">
        <ModuleConclusion>
          每起故障研判从 4 小时缩短至 2 分钟，85% 事件自动处置，预估每年创造 ¥860 万业务价值。
        </ModuleConclusion>
      </div>
    </section>
  )
}
