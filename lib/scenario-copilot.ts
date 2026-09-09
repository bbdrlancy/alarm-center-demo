import type { ScenarioModel } from "@/data/scenarios"

export function buildCopilotWelcome(scenario: ScenarioModel): string {
  const { incident, copilot } = scenario
  return [
    "您好，我是 **AIOps Copilot**，可帮您快速了解当前数据中心故障的分析结论与处置建议。",
    "",
    "**当前事件快照**",
    `• Incident: ${incident.id}`,
    `• Root Cause: ${incident.rootCause}`,
    `• Domain: ${scenario.domain}`,
    `• Confidence: ${incident.confidence}%`,
    `• Business Impact: ${incident.businessImpact}`,
    `• ${copilot.snapshot}`,
    "",
    "点击下方快捷问题，或直接输入您的问题。",
  ].join("\n")
}

export const twinCopilotSuggestions = [
  "事故在哪里发生？",
  "故障如何传播？",
  "如何切换供电链路？",
] as const

export const portfolioCopilotSuggestions = [
  "当前有哪些 P1 事故？",
  "建议操作怎么安排？",
  "如何进入事故工作台？",
] as const

export function buildTwinCopilotWelcome(): string {
  return [
    "您好，我是 **AIOps Copilot**。当前是 **数字孪生视图**，用来解释事故发生位置与传播路径。",
    "",
    "这里是 Context / Explainability Layer，不是指挥台：",
    "• Topology / Business / Power / Cooling / Network 分层查看",
    "• Overlay 高亮根因资产、受影响资产、受影响服务与传播路径",
    "• Timeline Sync 按事件时间回放传播过程",
    "",
    "点击下方快捷问题，或直接输入您的问题。",
  ].join("\n")
}

export function getTwinCopilotResponse(query: string): string {
  const q = query.trim().toLowerCase()
  if (!q) return buildTwinCopilotWelcome()

  if (q.includes("哪里") || q.includes("where") || q.includes("位置")) {
    return "数字孪生画布展示事故发生的空间与拓扑上下文。打开 **Incident Overlay** 后，根因资产以红色标注，受影响资产与服务沿传播路径展开。"
  }

  if (q.includes("传播") || q.includes("propagate") || q.includes("路径")) {
    return "使用底部 **Timeline Sync** 选择事件时刻，或点击「播放传播过程」，拓扑会按跳数逐步点亮受影响对象。也可切换 Power / Cooling / Network / Business 视图观察对应链路。"
  }

  if (q.includes("供电") || q.includes("power") || q.includes("制冷") || q.includes("网络") || q.includes("业务")) {
    return "顶部 Layer Switch 可在 Topology、Business、Power、Cooling、Network 之间切换。图层回答「链路长什么样」；事故叠加回答「故障落在哪、怎么走」。"
  }

  return [
    "当前为数字孪生视图，我可以帮您理解事故空间与传播。请尝试：",
    "",
    ...twinCopilotSuggestions.map((prompt, index) => `${index + 1}. ${prompt}`),
  ].join("\n")
}

export function buildPortfolioCopilotWelcome(): string {
  return [
    "您好，我是 **AIOps Copilot**，可帮您了解事故总览的全局态势与建议操作。",
    "",
    "当前页面展示全部事故总览，不绑定单一事故。进入 **事故工作台** 后，可用事故选择器切换并查看对应分析结论。",
    "",
    "点击下方快捷问题，或直接输入您的问题。",
  ].join("\n")
}

export function getPortfolioCopilotResponse(query: string): string {
  const q = query.trim().toLowerCase()
  if (!q) return buildPortfolioCopilotWelcome()

  if (q.includes("p1") || q.includes("事故")) {
    return [
      "事故总览当前有 **12** 起进行中事故，其中 **2** 起 P1。",
      "",
      "建议操作看板按 Suggested / In Progress / Completed 排列，可从卡片进入对应事故工作台。",
    ].join("\n")
  }

  if (q.includes("建议") || q.includes("操作") || q.includes("action")) {
    return "建议操作看板汇总了各域事故的推荐处置。拖动卡片可更新状态；点击 Open RCA 进入该事故的工作台。"
  }

  if (q.includes("工作台") || q.includes("选择器") || q.includes("rca")) {
    return "事故选择器只控制 **事故工作台** 的内容。在事故总览点击某张卡片的 Open RCA，或使用底部「下一步」进入工作台后再切换事故。"
  }

  return [
    "当前为事故总览，我可以帮您了解全局态势。请尝试：",
    "",
    ...portfolioCopilotSuggestions.map((p, i) => `${i + 1}. ${p}`),
  ].join("\n")
}

export function getScenarioCopilotResponse(scenario: ScenarioModel, query: string): string {
  const { incident, impactChain, copilot } = scenario
  const q = query.trim().toLowerCase()
  if (!q) return buildCopilotWelcome(scenario)

  if (q.includes("根因") || q.includes("root")) {
    return [
      `经智能分析，**${incident.rootCause}**（${incident.rootCauseZh}）为 ${scenario.domain} 域根因，置信度 **${incident.confidence}%**。`,
      "",
      incident.investigationFocus,
      "",
      incident.rcaSummary,
    ].join("\n")
  }

  if (q.includes("收敛") || String(incident.rawAlarms).includes(q.replace(/\D/g, ""))) {
    return [
      `AI 收敛管线将 **${incident.rawAlarms.toLocaleString("en-US")}** 条原始告警归并为 **${incident.rootCauseCount}** 条根因事件，收敛率 **${incident.reductionRate}%**。`,
      "",
      `分析用时 **${incident.analysisMinutes} 分钟**（人工平均 4 小时）。`,
    ].join("\n")
  }

  if (q.includes("影响") || q.includes("范围") || q.includes("impact")) {
    return [
      `事故 **${incident.id}** 业务影响：**${incident.businessImpact}**`,
      "",
      `受影响资产：${incident.affectedAssets}`,
      `传播链：${impactChain.map((n) => n.label).join(" → ")}`,
    ].join("\n")
  }

  if (q.includes("gpu") || q.includes("服务器")) {
    return incident.affectedGpu > 0
      ? `本次事件受影响 **${incident.affectedServer} 台服务器**、**${incident.affectedGpu} 张 GPU 卡**。`
      : `本次 ${scenario.domain} 事件主要影响 **${incident.affectedAssets}**，不涉及 GPU 计算资源。`
  }

  const exactPreset = copilot.suggestions.find((p) => p === query.trim())
  if (exactPreset) {
    return [
      `关于「${exactPreset}」`,
      "",
      `当前场景 **${scenario.name}**（${incident.id}）`,
      `• 根因：**${incident.rootCause}**（置信度 ${incident.confidence}%）`,
      `• 业务影响：**${incident.businessImpact}** · ${incident.affectedAssets}`,
      `• ${incident.investigationFocus}`,
      "",
      incident.rcaSummary,
    ].join("\n")
  }

  return [
    `我可以帮您分析 **${scenario.name}**（${incident.id}）的告警收敛与根因调查。请尝试：`,
    "",
    ...copilot.suggestions.map((p, i) => `${i + 1}. ${p}`),
  ].join("\n")
}

export function buildCopilotPrintExamples(scenario: ScenarioModel) {
  return scenario.copilot.suggestions.map((question) => ({
    question,
    answer: getScenarioCopilotResponse(scenario, question),
  }))
}
