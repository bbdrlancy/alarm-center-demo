"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { RcaFunnel } from "@/components/rca/rca-funnel"
import { IncidentOverview } from "@/components/rca/incident-overview"
import { StorylineStrip } from "@/components/page-question-banner"
import { ContinueTo } from "@/components/page-flow"
import { RcaPageSwitch } from "@/components/rca/rca-page-switch"

function RcaAiPageContent() {
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <StorylineStrip activeStep={1} />

      <RcaPageSwitch current="ai" />

      <IncidentOverview />
      <RcaFunnel />

      <ContinueTo label="AI 推理中心 · AI Explainability" href="/knowledge-center" />
    </div>
  )
}

export default function RcaPage() {
  return (
    <AppShell active="rca-ai" title="自动分析" subtitle="Auto Analysis">
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}>
        <RcaAiPageContent />
      </Suspense>
    </AppShell>
  )
}
