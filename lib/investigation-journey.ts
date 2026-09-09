export const INVESTIGATION_JOURNEY_STEPS = [
  {
    id: "ai-result",
    label: "AI Result",
    question: "AI认为发生了什么？",
  },
  {
    id: "propagation",
    label: "Propagation",
    question: "事件是如何扩散的？",
  },
  {
    id: "convergence",
    label: "Convergence",
    question: "AI如何收敛到事故？",
  },
  {
    id: "ai-reasoning",
    label: "AI Reasoning",
    question: "AI为什么锁定该根因？",
  },
  {
    id: "verification",
    label: "Verification",
    question: "专家验证到哪一步？",
  },
  {
    id: "candidate-causes",
    label: "Candidate Causes",
    question: "还有哪些可能？",
  },
  {
    id: "device-evidence",
    label: "Device Evidence",
    question: "设备真的发生故障了吗？",
  },
  {
    id: "conclusion",
    label: "Conclusion",
    question: "最终确认什么结论？",
  },
] as const

export type InvestigationJourneyId = (typeof INVESTIGATION_JOURNEY_STEPS)[number]["id"]

export function investigationSectionId(id: InvestigationJourneyId) {
  return `inv-journey-${id}`
}
