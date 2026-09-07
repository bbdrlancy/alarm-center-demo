"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { RcaFunnel } from "@/components/rca/rca-funnel"
import { TopologyGraph } from "@/components/rca/topology-graph"
import { RcaExecutiveSummary } from "@/components/rca/rca-executive-summary"
import { RcaIncidentContextBanner } from "@/components/rca/rca-incident-context-banner"
import { IncidentTimeline } from "@/components/incident-timeline"
import { StorylineStrip } from "@/components/page-question-banner"
import { ContinueTo } from "@/components/page-flow"
import { RcaPageSwitch } from "@/components/rca/rca-page-switch"

function RcaAiPageContent() {
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <StorylineStrip activeStep={1} />

      <RcaPageSwitch current="ai" />

      <RcaIncidentContextBanner />

      <RcaExecutiveSummary />
      <RcaFunnel />
      <TopologyGraph />
      <IncidentTimeline />

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
