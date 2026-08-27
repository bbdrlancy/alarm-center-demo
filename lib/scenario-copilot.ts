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
