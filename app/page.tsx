import { AppShell } from "@/components/app-shell"
import { IncidentOverviewWorkspace } from "@/components/incident-portfolio/incident-overview-workspace"

export default function IncidentPortfolioPage() {
  return (
    <AppShell
      active="portfolio"
      title="事故总览"
      subtitle="Incident Overview"
    >
      <IncidentOverviewWorkspace />
    </AppShell>
  )
}
