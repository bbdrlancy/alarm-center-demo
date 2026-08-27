import { AppShell } from "@/components/app-shell"
import { ActiveIncidentTable } from "@/components/incident-portfolio/active-incident-table"
import { IncidentHeatmap } from "@/components/incident-portfolio/incident-heatmap"
import { RecommendedActions } from "@/components/incident-portfolio/recommended-actions"
import { PortfolioExecutiveSummary } from "@/components/incident-portfolio/portfolio-executive-summary"
import { PageQuestionBanner } from "@/components/page-question-banner"
import { StorylineStrip } from "@/components/page-question-banner"
import { ScenarioContinueToRca } from "@/components/scenario/scenario-continue-to-rca"

export default function IncidentPortfolioPage() {
  return (
    <AppShell
      active="portfolio"
      title="事故组合视图"
      subtitle="Incident Portfolio · What happened?"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <StorylineStrip activeStep={0} />

        <PageQuestionBanner
          question="What happened?"
          questionZh="发生了什么？"
          description="全局事故态势：当前活跃事件、领域风险分布与管理层摘要。"
        />

        <ActiveIncidentTable />

        <IncidentHeatmap />

        <RecommendedActions />

        <PortfolioExecutiveSummary />

        <ScenarioContinueToRca label="根因分析中心 · RCA Center" />
      </div>
    </AppShell>
  )
}
