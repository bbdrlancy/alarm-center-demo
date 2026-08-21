"use client"

import type { ReactNode } from "react"
import { Sparkles, ArrowDown, ShieldCheck, Copy } from "lucide-react"
import { evidenceChain, rcaRanking, preventiveActions, rcaSummary } from "@/lib/incident-data"
import { Panel, ModuleConclusion } from "@/components/primitives"

// 简易 **bold** 解析
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

export function RcaAssistant() {
  const copySummary = () => {
    const text = rcaSummary.text.map((t) => t.replace(/\*\*/g, "")).join("\n\n")
    navigator.clipboard?.writeText(text)
  }

  return (
    <Panel
      title="AI 根因解释助手"
      subtitle="AI Root Cause Assistant"
      description="用通俗语言解释根因结论、影响范围与建议措施，无需专业背景即可理解"
      icon={<Sparkles className="size-4" />}
      action={
        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
          <Sparkles className="size-3" />
          智能分析
        </span>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Left: structured analysis */}
        <div className="flex flex-col gap-4">
          {/* Evidence chain */}
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              因果链条 · Cause Chain
            </h3>
            <div className="flex flex-col gap-1">
              {evidenceChain.map((e, i) => (
                <div key={e.label} className="flex flex-col">
                  <div className="flex items-center gap-2.5 rounded-md border border-border bg-background/60 px-3 py-2">
                    <span className="grid size-5 place-items-center rounded bg-primary/15 text-[10px] font-bold text-primary tabular">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[13px] font-medium text-foreground">{e.label}</span>
                      <span className="ml-1.5 text-[11px] text-muted-foreground">{e.zh}</span>
                    </div>
                    <span className="hidden truncate font-mono text-[10px] text-muted-foreground sm:block">{e.device}</span>
                  </div>
                  {i < evidenceChain.length - 1 ? (
                    <ArrowDown className="my-0.5 ml-4 size-3.5 text-primary/50" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Root cause ranking */}
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              根因可能性 · Likely Causes
            </h3>
            <div className="flex flex-col gap-2">
              {rcaRanking.map((r, i) => {
                const isTop = i === 0
                const color = isTop ? "var(--p1)" : "var(--muted-foreground)"
                return (
                  <div key={r.cause} className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <div className="truncate text-xs font-medium" style={{ color: isTop ? "var(--foreground)" : "var(--muted-foreground)" }}>
                        {r.cause}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">{r.zh}</div>
                    </div>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${r.confidence}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-sm font-bold tabular" style={{ color }}>
                      {r.confidence}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Preventive actions */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Preventive Actions · 预防措施
            </h3>
            <div className="flex flex-col gap-1.5">
              {preventiveActions.map((p) => (
                <div key={p.title} className="rounded-md border border-border bg-background/60 px-3 py-2">
                  <div className="text-[13px] font-medium text-foreground">
                    {p.title}
                    <span className="ml-1.5 text-[11px] text-muted-foreground">{p.zh}</span>
                  </div>
                  <p className="text-[11px] leading-snug text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI-generated summary (Copilot bubble) */}
        <div className="flex flex-col rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-foreground">根因分析摘要</div>
              <div className="text-[10px] text-muted-foreground">{rcaSummary.source}</div>
            </div>
            <button
              onClick={copySummary}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary"
            >
              <Copy className="size-3" />
              复制
            </button>
          </div>
          <div className="flex flex-col gap-3 bg-accent/30 p-4">
            {rcaSummary.text.map((para, i) => (
              <p key={i} className="text-[12.5px] leading-relaxed text-muted-foreground">
                {renderBold(para)}
              </p>
            ))}
            <div className="mt-1 flex items-center gap-2 border-t border-border pt-3 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded bg-primary/12 px-1.5 py-0.5 font-medium text-primary">
                <Sparkles className="size-2.5" />
                置信度 98%
              </span>
              <span>生成于 {rcaSummary.generatedAt}</span>
            </div>
          </div>
        </div>
      </div>
      <ModuleConclusion>
        根因是 UPS 电池故障（置信度 98%），建议优先完成供电处置并落实预防性维护，避免同类事故复发。
      </ModuleConclusion>
    </Panel>
  )
}
