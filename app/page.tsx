import { AppShell } from "@/components/app-shell"
import { DigitalTwinMap } from "@/components/incident-portfolio/digital-twin-map"
import { RecommendedActions } from "@/components/incident-portfolio/recommended-actions"
import { StorylineStrip } from "@/components/page-question-banner"
import { ScenarioContinueToRca } from "@/components/scenario/scenario-continue-to-rca"

export default function IncidentPortfolioPage() {
  return (
    <AppShell
      active="portfolio"
      title="事故组合视图"
      subtitle="Incident Portfolio"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <StorylineStrip activeStep={0} />

        <DigitalTwinMap />

        <RecommendedActions />

        <ScenarioContinueToRca label="根因分析中心 · RCA Center" />
      </div>
    </AppShell>
  )
}
