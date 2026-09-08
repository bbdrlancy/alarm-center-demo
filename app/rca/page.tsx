"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { RcaFunnel } from "@/components/rca/rca-funnel"
import { IncidentDecisionBanner } from "@/components/rca/incident-decision-banner"
import { IncidentOverview } from "@/components/rca/incident-overview"
import { StorylineStrip } from "@/components/page-question-banner"
import { ContinueTo } from "@/components/page-flow"
import { RcaPageSwitch } from "@/components/rca/rca-page-switch"

function RcaAiPageContent() {
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <IncidentDecisionBanner />

      <StorylineStrip activeStep={1} />

      <RcaPageSwitch current="ai" />

      <IncidentOverview />
      <RcaFunnel />

      <ContinueTo label="调查工作台 · Investigation Workspace" href="/rca/manual" />
    </div>
  )
}

export default function RcaPage() {
  return (
    <AppShell active="rca-ai" title="事故工作台" subtitle="Incident Workspace">
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}>
        <RcaAiPageContent />
      </Suspense>
    </AppShell>
  )
}
