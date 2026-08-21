"use client"

import { Sparkles } from "lucide-react"

const summaryItems = [
  {
    title: "What Happened",
    zh: "发生了什么",
    text: "UPS-A01 电池组故障触发 Power Zone A 供电中断，1,248 条告警涌入。",
  },
  {
    title: "Why Happened",
    zh: "为什么发生",
    text: "电池内阻异常升高导致旁路切换失败，故障沿 UPS → PDU → Rack → GPU 级联传播。",
  },
  {
    title: "Why AI Knows",
    zh: "AI 为什么知道",
    text: "Digital Twin + Knowledge Graph + GraphRAG 可解释推理，98% 置信度定位唯一根因。",
  },
  {
    title: "What Value Delivered",
    zh: "创造了什么价值",
    text: "分析从 4 小时压缩至 2 分钟，自动化率 85%，年价值约 ¥860 万。",
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
          <p className="text-[12px] text-muted-foreground">What → Why → How → Value</p>
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
