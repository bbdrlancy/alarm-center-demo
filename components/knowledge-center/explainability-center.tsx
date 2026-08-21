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
import { ContinueTo, PageLearnBanner, StorylineStrip } from "@/components/page-flow"
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
    <div id="explainability-center">
      <PageLearnBanner
        questions={[
          "AI 为什么知道？",
          "为什么不是 PDU？",
          "为什么不是 GPU？",
          "为什么置信度 98%？",
        ]}
      />

      <ExplainabilityModeSwitch mode={mode} onModeChange={setMode} />

      {mode === "expert" ? <StorylineStrip /> : null}

      {mode === "basic" ? <BasicExplainabilityFlow /> : <ExpertExplainabilityFlow />}

      <ContinueTo label="业务价值中心" href="/business-dashboard" />
    </div>
  )
}
