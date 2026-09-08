"use client"

import { useEffect, useState } from "react"
import {
  BasicExplainabilityFlow,
} from "@/components/knowledge-center/basic-explainability-flow"
import {
  ExplainabilityModeSwitch,
  type ExplainabilityMode,
} from "@/components/knowledge-center/explainability-mode-switch"
import { ExpertExplainabilityFlow } from "@/components/knowledge-center/expert-explainability-flow"
import { CopilotStaticSection } from "@/components/knowledge-center/copilot-static-section"
import { OpenCopilotContinue } from "@/components/page-flow"
import { PageQuestionBanner, StorylineStrip } from "@/components/page-question-banner"
import { useDemoStory } from "@/hooks/use-demo-story"

export function ExplainabilityCenter() {
  const [mode, setMode] = useState<ExplainabilityMode>("basic")
  const { stage, playing } = useDemoStory()

  useEffect(() => {
    if (playing && (stage === 5 || stage === 6)) {
      setMode("basic")
    }
  }, [stage, playing])

  return (
    <div id="explainability-center" className="flex flex-col gap-4">
      <StorylineStrip activeStep={2} />

      <PageQuestionBanner
        question="Why does AI know?"
        questionZh="AI 为什么知道？"
        description={
          mode === "basic"
            ? "简洁模式：传播路径、根因、业务影响与结论说明。"
            : "专家模式：数字孪生、本体、知识图谱、GraphRAG 与知识来源的完整推理链。"
        }
      />

      <div className="no-print">
        <ExplainabilityModeSwitch mode={mode} onModeChange={setMode} />
      </div>

      {mode === "basic" ? <BasicExplainabilityFlow /> : <ExpertExplainabilityFlow />}

      <CopilotStaticSection />

      <div className="no-print rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-center text-[11px] text-muted-foreground">
        交互式 Copilot 可通过右下角浮动按钮全局访问 · Global floating Copilot available on every page
      </div>

      <div className="no-print">
        <OpenCopilotContinue />
      </div>
    </div>
  )
}
