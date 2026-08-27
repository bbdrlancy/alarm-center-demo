"use client"

import { Suspense, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { RcaFunnel } from "@/components/rca/rca-funnel"
import { TopologyGraph } from "@/components/rca/topology-graph"
import { RcaExecutiveSummary } from "@/components/rca/rca-executive-summary"
import { RcaIncidentContextBanner } from "@/components/rca/rca-incident-context-banner"
import { ManualInvestigationWorkspace } from "@/components/rca/manual-investigation-workspace"
import { RcaModeSwitch, type RcaAnalysisMode } from "@/components/rca/rca-mode-switch"
import { IncidentTimeline } from "@/components/incident-timeline"
import { PageQuestionBanner, StorylineStrip } from "@/components/page-question-banner"
import { ContinueTo } from "@/components/page-flow"

function RcaPageContent() {
  const [mode, setMode] = useState<RcaAnalysisMode>("ai")

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <StorylineStrip activeStep={1} />

      <PageQuestionBanner
        question="Why did it happen?"
        questionZh="为什么发生？"
        description="根因调查：告警收敛、影响链路与时间线证据，回答故障成因与传播路径。"
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <RcaModeSwitch mode={mode} onModeChange={setMode} />
      </div>

      <RcaIncidentContextBanner />

      {mode === "ai" ? (
        <>
          <RcaExecutiveSummary />
          <RcaFunnel />
          <TopologyGraph />
          <IncidentTimeline />
        </>
      ) : (
        <ManualInvestigationWorkspace />
      )}

      <ContinueTo label="AI 推理中心 · AI Explainability" href="/knowledge-center" />
    </div>
  )
}

export default function RcaPage() {
  return (
    <AppShell active="rca" title="根因分析中心" subtitle="RCA Center · Why happened?">
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}>
        <RcaPageContent />
      </Suspense>
    </AppShell>
  )
}
