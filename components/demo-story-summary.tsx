"use client"

import { Sparkles } from "lucide-react"

const summaryItems = [
  {
    title: "Incident Portfolio",
    zh: "全局事故视图",
    text: "12 起活跃事故，Power 与 Cooling 为主要风险域，预估业务暴露 ¥12.3M。",
  },
  {
    title: "Root Cause Investigation",
    zh: "根因调查",
    text: "从 Portfolio 选择事故进入 RCA，1,248 条告警收敛至唯一根因，98% 置信度。",
  },
  {
    title: "AI Explainability",
    zh: "AI 可解释性",
    text: "Impact Path、Root Cause、Business Impact 与 Explanation 以业务语言呈现 AI 推理。",
  },
  {
    title: "Business Value & Copilot",
    zh: "业务价值与 Copilot",
    text: "分析从 4 小时压缩至 2 分钟，自动化率 85%，年 ROI ¥8.6M；Copilot 随时解答。",
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
          <p className="text-[12px] text-muted-foreground">Portfolio → RCA → Explainability → Value → Copilot</p>
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
