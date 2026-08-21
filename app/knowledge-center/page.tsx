import { AppShell } from "@/components/app-shell"
import { ExplainabilityCenter } from "@/components/knowledge-center/explainability-center"

export default function KnowledgeCenterPage() {
  return (
    <AppShell
      active="knowledge"
      title="AI 推理中心"
      subtitle="AI Explainability Center"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <ExplainabilityCenter />
      </div>
    </AppShell>
  )
}
