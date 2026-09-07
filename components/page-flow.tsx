"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function PageLearnBanner({ questions }: { questions: string[] }) {
  return (
    <div id="page-learn-banner" className="rounded-lg border border-primary/20 bg-accent/60 px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[11px] font-semibold text-primary">本页面帮助你了解什么？</span>
        <span className="text-[10px] text-muted-foreground">What You Will Learn</span>
      </div>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {questions.map((q) => (
          <li key={q} className="flex items-start gap-2 text-[12px] text-foreground">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            {q}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ExplainStep({
  step,
  title,
  subtitle,
  question,
  children,
  className,
}: {
  step: number
  title: string
  subtitle: string
  question: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
          Step {step}
        </span>
        <span className="text-[12px] font-semibold text-foreground">{title}</span>
        <span className="text-[10px] text-muted-foreground">{subtitle}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">{question}</p>
      {children}
    </section>
  )
}

export function ContinueTo({
  label,
  href,
  onClick,
}: {
  label: string
  href?: string
  onClick?: () => void
}) {
  const inner = (
    <>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        下一步推荐阅读 · Continue To
      </span>
      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
        {label}
        <ArrowRight className="size-4" />
      </span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
      >
        {inner}
      </button>
    )
  }

  return (
    <Link
      href={href ?? "#"}
      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      {inner}
    </Link>
  )
}

export function OpenCopilotContinue() {
  return (
    <ContinueTo
      label="向 Copilot 提问 · Copilot Assistant"
      onClick={() => window.dispatchEvent(new CustomEvent("open-copilot"))}
    />
  )
}

export function StorylineStrip() {
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
          <span>
            {s.zh}
            <span className="ml-1 opacity-70">{s.en}</span>
          </span>
          {i < steps.length - 1 ? <ArrowRight className="size-2.5 opacity-50" /> : null}
        </span>
      ))}
    </div>
  )
}
