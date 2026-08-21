import { Sparkles, Target, TrendingDown } from "lucide-react"
import { ModuleConclusion, SectionHeader } from "@/components/primitives"

const reasoningBasis = [
  "空间关系 · Spatial",
  "供电关系 · Power",
  "服务关系 · Service",
  "历史事件 · History",
  "知识图谱 · Knowledge Graph",
]

export function KeyBusinessValue() {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <div className="h-1 bg-primary" />
      <SectionHeader
        title="关键价值说明"
        subtitle="Key Business Value"
        description="为什么 AI 能够准确定位 UPS 为最终根因？"
        icon={
          <span className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
            <Sparkles className="size-5" />
          </span>
        }
      />

      <div className="space-y-4 px-5 pb-5">
        <div className="rounded-lg border border-border bg-panel/60 px-4 py-3 text-[12px] leading-relaxed text-foreground">
          <p className="font-medium">为什么 AI 定位 UPS 为最终根因？</p>
          <p className="mt-2 text-muted-foreground">
            因为 AI 不仅分析告警，还综合分析以下五类关系进行推理——
            而非基于告警文本的简单猜测。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {reasoningBasis.map((item) => (
            <span
              key={item}
              className="rounded-md border border-primary/30 bg-primary/8 px-3 py-1.5 text-[11px] font-medium text-primary"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
            <Target className="size-8 shrink-0 text-primary" />
            <div>
              <div className="text-2xl font-bold tabular text-success">98%</div>
              <div className="text-[11px] text-muted-foreground">RCA 准确率 · RCA Accuracy</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
            <TrendingDown className="size-8 shrink-0 text-primary" />
            <div>
              <div className="text-2xl font-bold tabular text-success">99.92%</div>
              <div className="text-[11px] text-muted-foreground">告警收敛率 · Alarm Reduction</div>
            </div>
          </div>
        </div>

        <ModuleConclusion>
          基于数字孪生、企业本体与知识图谱的 GraphRAG 推理，使 AI 具备可解释、可验证的根因定位能力。
        </ModuleConclusion>
      </div>
    </section>
  )
}
