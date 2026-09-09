"use client"

import { Sparkles } from "lucide-react"

const summaryItems = [
  {
    title: "Incident Overview",
    zh: "事故总览",
    text: "12 起活跃事故，Power 与 Cooling 为主要风险域，预估业务暴露 ¥12.3M。",
  },
  {
    title: "Incident Workspace",
    zh: "事故工作台",
    text: "从事故总览进入工作台，回答发生了什么、为何如此判断、下一步怎么做。",
  },
  {
    title: "Digital Twin View",
    zh: "数字孪生视图",
    text: "在拓扑上解释事故发生位置与传播路径，供电 / 制冷 / 网络 / 业务分层查看。",
  },
  {
    title: "Investigation Center",
    zh: "事件调查中心",
    text: "人工核对告警、候选根因与证据，确认或修正自动分析结论。",
  },
  {
    title: "Copilot Assistant",
    zh: "Copilot 助手",
    text: "全局浮动 Copilot 随时解答事故与根因问题，贯穿总览 → 工作台 → 数字孪生 → 调查全流程。",
  },
] as const

export function DemoStorySummary({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-primary/30 bg-card shadow-2xl">
        <div className="h-1.5 bg-primary" />
        <div className="border-b border-border bg-primary/8 px-6 py-4 text-center">
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1 text-[11px] font-semibold text-primary">
            <Sparkles className="size-3.5" />
            Demo Story Complete
          </div>
          <h2 className="text-xl font-bold text-foreground">AIOps 产品故事线</h2>
          <p className="text-[12px] text-muted-foreground">Overview → Workspace → Twin → Investigation</p>
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2">
          {summaryItems.map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-background/60 p-4">
              <div className="text-[13px] font-semibold text-foreground">{item.title}</div>
              <div className="text-[10px] text-primary">{item.zh}</div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-6 py-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Exit Demo
          </button>
        </div>
      </div>
    </div>
  )
}
