"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { ManualInvestigationWorkspace } from "@/components/rca/manual-investigation-workspace"
import { StorylineStrip } from "@/components/page-question-banner"
import { OpenCopilotContinue } from "@/components/page-flow"
import { RcaPageSwitch } from "@/components/rca/rca-page-switch"

function RcaManualPageContent() {
  return (
    <div className="mx-auto flex max-w-[1760px] flex-col gap-4">
      <StorylineStrip activeStep={3} />
      <RcaPageSwitch current="manual" />
      <ManualInvestigationWorkspace />
      <OpenCopilotContinue />
    </div>
  )
}

export default function RcaManualPage() {
  return (
    <AppShell
      active="rca-manual"
      title="事件调查中心"
      subtitle="Investigation Center"
      hideDemoControls
    >
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}>
        <RcaManualPageContent />
      </Suspense>
    </AppShell>
  )
}
