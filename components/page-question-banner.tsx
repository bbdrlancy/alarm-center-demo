"use client"

import { cn } from "@/lib/utils"

export function PageQuestionBanner({
  question,
  questionZh,
  description,
}: {
  question: string
  questionZh: string
  description?: string
}) {
  return (
    <div
      id="page-question-banner"
      className="rounded-lg border border-primary/25 bg-gradient-to-r from-primary/8 via-card to-accent/30 px-5 py-4 shadow-sm"
    >
      <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
        This Page Answers · 本页回答
      </div>
      <h2 className="mt-1 text-lg font-bold text-foreground md:text-xl">{question}</h2>
      <p className="text-[12px] font-medium text-muted-foreground">{questionZh}</p>
      {description ? (
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export function StorylineStrip({ activeStep }: { activeStep?: number }) {
  const steps = [
    "Incident Portfolio",
    "RCA Center",
    "AI Explainability",
    "Business Value",
  ]
  return (
    <div className="flex flex-wrap items-center justify-center gap-1 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-[9px] text-muted-foreground">
      {steps.map((s, i) => (
        <span key={s} className="flex items-center gap-1">
          <span className={cn(activeStep === i && "font-semibold text-primary")}>{s}</span>
          {i < steps.length - 1 ? <span className="opacity-40">→</span> : null}
        </span>
      ))}
    </div>
  )
}
