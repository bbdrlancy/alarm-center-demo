import { AppShell } from "@/components/app-shell"
import { HeroRoiSummary } from "@/components/business-dashboard/hero-roi-summary"
import { AiCapability } from "@/components/business-dashboard/ai-capability"
import { AutomationCenter } from "@/components/business-dashboard/automation-center"
import { BusinessImpact } from "@/components/business-dashboard/business-impact"
import { ExecutiveInsight } from "@/components/business-dashboard/executive-insight"
import { RoiOverview } from "@/components/business-dashboard/roi-overview"
import { OpenCopilotContinue, PageLearnBanner, StorylineStrip } from "@/components/page-flow"

export default function BusinessDashboardPage() {
  return (
    <AppShell
      active="business"
      title="业务价值中心"
      subtitle="Business Value Center"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <PageLearnBanner
          questions={[
            "这套系统值多少钱？",
            "节省多少时间？",
            "降低多少风险？",
            "ROI 是多少？",
          ]}
        />

        <HeroRoiSummary />

        <StorylineStrip />

        <section id="business-impact">
          <BusinessImpact />
        </section>

        <section id="automation-center">
          <AutomationCenter />
        </section>

        <section id="ai-capability">
          <AiCapability />
        </section>

        <ExecutiveInsight />

        <RoiOverview />

        <OpenCopilotContinue />
      </div>
    </AppShell>
  )
}
