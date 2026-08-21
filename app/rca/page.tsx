import { AppShell } from "@/components/app-shell"
import { RcaHeader } from "@/components/rca/rca-header"
import { RawAlarmExplorer } from "@/components/rca/raw-alarm-explorer"
import { CorrelationPipeline } from "@/components/rca/correlation-pipeline"
import { RcaFunnel } from "@/components/rca/rca-funnel"
import { TopologyGraph } from "@/components/rca/topology-graph"
import { EvidenceTimeline } from "@/components/rca/evidence-timeline"
import { ChangeCorrelation } from "@/components/rca/change-correlation"
import { RcaAssistant } from "@/components/rca/rca-assistant"
import { RcaExecutiveSummary } from "@/components/rca/rca-executive-summary"
import { ContinueTo, PageLearnBanner } from "@/components/page-flow"

export default function RcaPage() {
  return (
    <AppShell
      active="rca"
      title="根因分析中心"
      subtitle="Root Cause Investigation Center"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <PageLearnBanner
          questions={["为什么发生？", "真正根因是什么？", "有哪些证据支持？"]}
        />

        <RcaExecutiveSummary />

        <RcaHeader />

        <RawAlarmExplorer />

        <CorrelationPipeline />

        <RcaFunnel />

        <div className="grid gap-4 xl:grid-cols-2">
          <TopologyGraph />
          <EvidenceTimeline />
        </div>

        <ChangeCorrelation />

        <RcaAssistant />

        <ContinueTo label="AI 推理中心" href="/knowledge-center" />
      </div>
    </AppShell>
  )
}
