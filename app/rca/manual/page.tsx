"use client"

import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import { RcaIncidentContextBanner } from "@/components/rca/rca-incident-context-banner"
import { ManualInvestigationWorkspace } from "@/components/rca/manual-investigation-workspace"
import { PageQuestionBanner, StorylineStrip } from "@/components/page-question-banner"
import { ContinueTo } from "@/components/page-flow"
import { RcaPageSwitch } from "@/components/rca/rca-page-switch"

function RcaManualPageContent() {
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <StorylineStrip activeStep={1} />

      <PageQuestionBanner
        question="How do operators investigate?"
        questionZh="如何人工调查？"
        description="人工调查工作台：按证据、拓扑与候选根因交叉验证，沉淀操作员结论与处置记录。"
      />

      <RcaPageSwitch current="manual" />

      <RcaIncidentContextBanner />

      <ManualInvestigationWorkspace />

      <ContinueTo label="AI 推理中心 · AI Explainability" href="/knowledge-center" />
    </div>
  )
}

export default function RcaManualPage() {
  return (
    <AppShell
      active="rca-manual"
      title="人工调查"
      subtitle="Manual Investigation · Operator Workspace"
    >
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}>
        <RcaManualPageContent />
      </Suspense>
    </AppShell>
  )
}
