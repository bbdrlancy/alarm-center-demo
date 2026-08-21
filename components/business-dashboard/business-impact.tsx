"use client"

import { Briefcase, Cpu, ThumbsDown, ServerCrash, ShieldCheck, Coins } from "lucide-react"
import { Panel, ModuleConclusion } from "@/components/primitives"

const impacts = [
  {
    icon: ServerCrash,
    title: "避免业务中断",
    en: "Prevent Service Outage",
    value: "3 次",
  },
  {
    icon: ShieldCheck,
    title: "避免 SLA 违约",
    en: "Prevent SLA Breach",
    value: "12 次",
  },
  {
    icon: Cpu,
    title: "避免 GPU 任务失败",
    en: "Prevent GPU Job Failures",
    value: "168 个",
  },
  {
    icon: Briefcase,
    title: "保护 GPU 资源",
    en: "Protect GPU Assets",
    value: "336 张 GPU",
  },
  {
    icon: ThumbsDown,
    title: "减少客户投诉",
    en: "Reduce Customer Complaints",
    value: "87%",
  },
  {
    icon: Coins,
    title: "避免潜在经济损失",
    en: "Prevent Financial Loss",
    value: "¥1,200,000",
  },
] as const

export function BusinessImpact() {
  return (
    <Panel
      title="业务影响"
      subtitle="Business Impact"
      description="量化 AIOps 为业务带来的直接保护与风险规避价值"
      icon={<Briefcase className="size-4" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {impacts.map((item) => (
          <div
            key={item.title}
            className="flex gap-3 rounded-lg border border-border bg-card p-3.5 shadow-sm"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
              <item.icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-[13px] font-semibold text-foreground">{item.title}</div>
                  <div className="text-[10px] text-muted-foreground">{item.en}</div>
                </div>
                <span className="shrink-0 text-base font-bold tabular text-success">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ModuleConclusion>
        快速根因定位有效保护 GPU 训练任务与 SLA，显著降低业务中断与客户投诉风险。
      </ModuleConclusion>
    </Panel>
  )
}
