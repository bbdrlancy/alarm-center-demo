export type DemoStoryStageConfig = {
  stage: number
  label: string
  subtitle: string
  href: string
  highlightId?: string
  action?: string
  durationMs: number
}

/** 8-stage demo · total ~54s (under 60s) */
export const demoStoryStages: DemoStoryStageConfig[] = [
  {
    stage: 1,
    label: "Incident Command Center",
    subtitle: "UPS Battery Failure",
    href: "/",
    highlightId: "root-cause",
    durationMs: 5500,
  },
  {
    stage: 2,
    label: "Fault Propagation",
    subtitle: "UPS → PDU → Rack → GPU → AI Service",
    href: "/",
    highlightId: "fault-propagation",
    action: "play-propagation",
    durationMs: 7500,
  },
  {
    stage: 3,
    label: "RCA Center · Alarm Reduction",
    subtitle: "1248 → 312 → 92 → 48 → 17 → 1",
    href: "/rca",
    highlightId: "correlation-pipeline",
    action: "play-alarm-reduction",
    durationMs: 7500,
  },
  {
    stage: 4,
    label: "Impact Chain",
    subtitle: "故障影响链路动画",
    href: "/rca",
    highlightId: "topology-graph",
    action: "play-impact-chain",
    durationMs: 6000,
  },
  {
    stage: 5,
    label: "AI Explainability Center",
    subtitle: "Digital Twin → Knowledge Graph → GraphRAG → Root Cause",
    href: "/knowledge-center",
    highlightId: "basic-explainability-flow",
    action: "play-explain-steps",
    durationMs: 7000,
  },
  {
    stage: 6,
    label: "Why AI Knows",
    subtitle: "AI 为什么知道？",
    href: "/knowledge-center",
    highlightId: "page-learn-banner",
    durationMs: 5000,
  },
  {
    stage: 7,
    label: "Business Value Center",
    subtitle: "4 Hours → 2 Minutes → 120× → 85% → ¥8.6M",
    href: "/business-dashboard",
    highlightId: "hero-roi-summary",
    action: "play-roi-hero",
    durationMs: 6500,
  },
  {
    stage: 8,
    label: "Demo Complete",
    subtitle: "What → Why → How → Value",
    href: "/business-dashboard",
    action: "show-summary",
    durationMs: 6000,
  },
]

export const DEMO_STORY_STAGE = "demo-story-stage"
export const DEMO_STORY_START = "demo-story-start"
export const DEMO_STORY_EXIT = "demo-story-exit"
export const DEMO_STORY_PAUSE = "demo-story-pause"
export const DEMO_STORY_RESUME = "demo-story-resume"

export type DemoStoryDetail = {
  stage: number
  action?: string
  playing: boolean
  runId: number
}

export function emitDemoStory(detail: DemoStoryDetail) {
  window.dispatchEvent(new CustomEvent(DEMO_STORY_STAGE, { detail }))
}

export function clearDemoHighlight() {
  document.querySelectorAll(".demo-story-highlight").forEach((el) => {
    el.classList.remove("demo-story-highlight")
  })
}

export function highlightElement(id?: string) {
  clearDemoHighlight()
  if (!id) return
  document.getElementById(id)?.classList.add("demo-story-highlight")
}
