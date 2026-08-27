import { AppShell } from "@/components/app-shell"
import { PlatformValueSection } from "@/components/business-dashboard/platform-value-section"
import { ScenarioValueSection } from "@/components/business-dashboard/scenario-value-section"
import { PageQuestionBanner, StorylineStrip } from "@/components/page-question-banner"

export default function BusinessDashboardPage() {
  return (
    <AppShell
      active="business"
      title="业务价值中心"
      subtitle="Business Value Center · Why invest?"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <StorylineStrip activeStep={3} />

        <PageQuestionBanner
          question="Why invest?"
          questionZh="为什么投资？"
          description="分场景价值与平台价值两层展示 ROI：当前事故场景收益 vs AIOps 平台整体回报。"
        />

        <ScenarioValueSection />

        <PlatformValueSection />
      </div>
    </AppShell>
  )
}
