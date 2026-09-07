"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { ManualInvestigationWorkspace } from "@/components/rca/manual-investigation-workspace"
import { StorylineStrip } from "@/components/page-question-banner"
import { ContinueTo } from "@/components/page-flow"
import { RcaPageSwitch } from "@/components/rca/rca-page-switch"

function RcaManualPageContent() {
  return (
    <div className="mx-auto flex max-w-[1760px] flex-col gap-4">
      <StorylineStrip activeStep={1} />
      <RcaPageSwitch current="manual" />
      <ManualInvestigationWorkspace />
      <ContinueTo label="AI 推理中心 · AI Explainability" href="/knowledge-center" />
    </div>
  )
}

export default function RcaManualPage() {
  return (
    <AppShell active="rca-manual" title="人工调查" subtitle="Manual Investigation" hideDemoControls>
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}>
        <RcaManualPageContent />
      </Suspense>
    </AppShell>
  )
}
