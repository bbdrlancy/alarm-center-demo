import { AppShell } from "@/components/app-shell"
import { AiValueSummary } from "@/components/ai-value-summary"
import { ConvergenceFunnel } from "@/components/convergence-funnel"
import { RootCauseCard } from "@/components/root-cause-card"
import { ImpactAnalysis } from "@/components/impact-analysis"
import { IncidentTimeline } from "@/components/incident-timeline"
import { ActionCenter } from "@/components/action-center"
import { IncidentReport } from "@/components/incident-report"
import { FaultPropagation } from "@/components/fault-propagation"
import { ContinueTo, PageLearnBanner } from "@/components/page-flow"

export default function Page() {
  return (
    <AppShell
      active="command"
      title="事故处置中心"
      subtitle="Incident Command Center"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <PageLearnBanner
          questions={["发生了什么？", "影响了什么？", "谁负责处理？", "下一步怎么办？"]}
        />

        <AiValueSummary />

        <section id="incident-overview">
          <div className="mb-2 text-[11px] font-semibold text-muted-foreground">
            事故概览 · Incident Overview
          </div>
          <div className="mt-2" id="fault-propagation">
            <FaultPropagation />
          </div>
        </section>

        <section id="root-cause">
          <RootCauseCard />
        </section>

        <section id="impact-analysis">
          <ImpactAnalysis />
        </section>

        <section id="action-center">
          <ActionCenter />
        </section>

        <section id="incident-timeline">
          <IncidentTimeline />
        </section>

        <section id="incident-report">
          <IncidentReport />
        </section>

        <ContinueTo label="根因分析中心" href="/rca" />
      </div>
    </AppShell>
  )
}
