"use client"

import { cn } from "@/lib/utils"

export function PageQuestionBanner({
  question,
  questionZh,
  description,
  items,
}: {
  question: string
  questionZh: string
  description?: string
  items?: { zh: string; en: string }[]
}) {
  return (
    <div
      id="page-question-banner"
      className="rounded-lg border border-primary/25 bg-gradient-to-r from-primary/8 via-card to-accent/30 px-5 py-4 shadow-sm"
    >
      <div className="text-[10px] font-semibold tracking-wide text-primary">
        本页回答 · This Page Answers
      </div>
      <h2 className="mt-1 text-lg font-bold text-foreground md:text-xl">{questionZh}</h2>
      <p className="text-[12px] font-medium text-muted-foreground">{question}</p>
      {description ? (
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {items?.length ? (
        <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {items.map((item, index) => (
            <li key={item.en} className="flex items-baseline gap-2 text-[12px] text-foreground">
              <span className="font-mono text-[10px] font-bold text-primary">{index + 1}</span>
              <span className="font-semibold">{item.zh}</span>
              <span className="text-[11px] text-muted-foreground">{item.en}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}

export function StorylineStrip({ activeStep }: { activeStep?: number }) {
  const steps = [
    { zh: "事故组合", en: "Portfolio" },
    { zh: "根因分析", en: "RCA" },
    { zh: "AI 推理", en: "Explainability" },
    { zh: "业务价值", en: "Value" },
  ]
  return (
    <div className="flex flex-wrap items-center justify-center gap-1 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-[9px] text-muted-foreground">
      {steps.map((s, i) => (
        <span key={s.en} className="flex items-center gap-1">
          <span className={cn(activeStep === i && "font-semibold text-primary")}>
            {s.zh}
            <span className="ml-1 opacity-70">{s.en}</span>
          </span>
          {i < steps.length - 1 ? <span className="opacity-40">→</span> : null}
        </span>
      ))}
    </div>
  )
}
