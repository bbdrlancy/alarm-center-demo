"use client"

import { useEffect, useState } from "react"
import { DEMO_STORY_STAGE, DEMO_STORY_EXIT, type DemoStoryDetail } from "@/lib/demo-story"

export function useDemoStory() {
  const [detail, setDetail] = useState<DemoStoryDetail | null>(null)

  useEffect(() => {
    const onStage = (e: Event) => {
      setDetail((e as CustomEvent<DemoStoryDetail>).detail)
    }
    const onExit = () => setDetail(null)

    window.addEventListener(DEMO_STORY_STAGE, onStage)
    window.addEventListener(DEMO_STORY_EXIT, onExit)
    return () => {
      window.removeEventListener(DEMO_STORY_STAGE, onStage)
      window.removeEventListener(DEMO_STORY_EXIT, onExit)
    }
  }, [])

  return {
    detail,
    stage: detail?.stage ?? null,
    playing: detail?.playing ?? false,
    runId: detail?.runId ?? 0,
    isStage: (n: number) => detail?.stage === n && detail.playing,
  }
}
