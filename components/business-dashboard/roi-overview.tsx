"use client"

import { TrendingUp } from "lucide-react"
import { Panel, ModuleConclusion } from "@/components/primitives"
import { useCountUp } from "@/hooks/use-count-up"

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card px-3 py-3 text-center">
      <span className="text-xl font-bold tabular text-primary">
        {value}
        {suffix}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

function MultiplierStat() {
  const { ref, display } = useCountUp(120, { duration: 1200, immediate: true })
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-primary/30 bg-primary/8 px-3 py-3 text-center">
      <span ref={ref} className="text-xl font-bold tabular text-primary">
        {display}×
      </span>
      <span className="text-[10px] text-muted-foreground">效率提升 Efficiency Gain</span>
    </div>
  )
}

export function RoiOverview() {
  return (
    <Panel
      title="ROI 总览"
      subtitle="ROI Overview"
      description="用业务语言量化投资回报：省多少时间、创造多少价值"
      icon={<TrendingUp className="size-4" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="人工分析 Manual Analysis" value="4" suffix=" 小时" />
        <Stat label="AI 分析 AI Analysis" value="2" suffix=" 分钟" />
        <MultiplierStat />
        <Stat label="投资回报 Annual ROI" value="¥860" suffix="万/年" />
      </div>
      <ModuleConclusion>
        AI 将单次故障分析从 4 小时压缩至 2 分钟，效率提升 120 倍，预估年 ROI ¥860 万。
      </ModuleConclusion>
    </Panel>
  )
}
