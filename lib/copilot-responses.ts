import {
  convergenceStages,
  evidenceChain,
  impactKpis,
  incidentReport,
  propagationNodes,
  rcaRanking,
  rcaSummary,
  reductionRate,
  rootCause,
} from "@/lib/incident-data"

export const presetQuestions = [
  "为什么最终根因是UPS故障？",
  "为什么1248条告警被收敛为1条？",
  "本次事件影响范围是什么？",
  "受影响GPU数量是多少？",
  "请生成事故快报。",
  "请生成RCA报告。",
] as const

function matchQuery(query: string): (typeof presetQuestions)[number] | null {
  const q = query.trim()
  if (!q) return null
  const exact = presetQuestions.find((p) => p === q)
  if (exact) return exact
  const lower = q.toLowerCase()
  if (lower.includes("根因") && lower.includes("ups")) return presetQuestions[0]
  if (lower.includes("1248") || (lower.includes("收敛") && lower.includes("1"))) return presetQuestions[1]
  if (lower.includes("影响范围") || lower.includes("影响什么")) return presetQuestions[2]
  if (lower.includes("gpu") || lower.includes("显卡")) return presetQuestions[3]
  if (lower.includes("事故快报") || lower.includes("快报")) return presetQuestions[4]
  if (lower.includes("rca") || lower.includes("根因报告")) return presetQuestions[5]
  return null
}

const responses: Record<(typeof presetQuestions)[number], string> = {
  [presetQuestions[0]]: [
    `经智能分析，本次事故根因唯一定位为 **${rootCause.title}**（${rootCause.titleZh}），置信度 **${rootCause.confidence}%**。`,
    `推理依据：`,
    `• 证据链：${evidenceChain.map((e) => e.label).join(" → ")}`,
    `• 根因排名：${rcaRanking[0].cause}（${rcaRanking[0].confidence}%），远高于 ${rcaRanking[1].cause}（${rcaRanking[1].confidence}%）`,
    `• 故障机理：${rootCause.summary}`,
    `• 检测方法：${rootCause.method}`,
  ].join("\n\n"),

  [presetQuestions[1]]: [
    `AI 收敛管线将 **1,248** 条原始告警归并为 **1** 条根因事件，收敛率 **${reductionRate}%**。`,
    `收敛阶段：`,
    ...convergenceStages.map(
      (s, i) =>
        `${i + 1}. ${s.en}（${s.label}）：**${s.value.toLocaleString()}** — ${s.hint}`,
    ),
    ``,
    `传统人工分析同类事件平均需 **4 小时**，AI 引擎在 **2 分钟**内完成全链路收敛与根因定位。`,
  ].join("\n"),

  [presetQuestions[2]]: [
    `事故 **${rootCause.id}** 影响范围如下：`,
    ``,
    `**基础设施**`,
    `• 供电区域：${rootCause.zone}`,
    `• 传播路径：${propagationNodes.map((n) => n.label).join(" → ")}`,
    ``,
    `**资源影响**`,
    ...impactKpis.map(
      (k) => `• ${k.en}：${k.value.toLocaleString()} ${k.unit}（占总量 ${k.total} 的 ${Math.round((k.value / k.total) * 100)}%）`,
    ),
    ``,
    `**业务影响**`,
    `• 受影响服务：${rootCause.service}`,
    `• 优先级：**${rootCause.priority}**`,
  ].join("\n"),

  [presetQuestions[3]]: [
    `本次事件受影响 **GPU ${impactKpis.find((k) => k.key === "gpu")!.value} 卡**，涉及 **${impactKpis.find((k) => k.key === "server")!.value} 台 GPU 服务器**。`,
    ``,
    `详细影响：`,
    `• 受影响机架：**${impactKpis.find((k) => k.key === "rack")!.value}** 台`,
    `• 受影响服务器：**84** 台`,
    `• 受影响 GPU：**336** 卡`,
    `• 受影响业务：**2** 项（含 ${rootCause.service}）`,
    ``,
    `根因设备 **${rootCause.device}** 位于 ${rootCause.zone}，故障沿供电链级联至下游计算集群。`,
  ].join("\n"),

  [presetQuestions[4]]: [
    `📋 **${incidentReport.title}**`,
    `编号：${incidentReport.id} · 优先级：${incidentReport.priority} · 生成于 ${incidentReport.generatedAt}`,
    ``,
    ...incidentReport.body.map((s) => `**${s.h}**\n${s.t}`),
  ].join("\n\n"),

  [presetQuestions[5]]: [
    `📊 **RCA Investigation Report**`,
    `Incident：${rootCause.id}`,
    ``,
    `**Root Cause:** ${rootCause.title}`,
    `**Confidence:** ${rootCause.confidence}%`,
    `**Reduction Rate:** ${reductionRate}%`,
    `**Affected GPU:** ${impactKpis.find((k) => k.key === "gpu")!.value}`,
    `**Affected Servers:** ${impactKpis.find((k) => k.key === "server")!.value}`,
    ``,
    ...rcaSummary.text,
    ``,
    `— Generated at ${rcaSummary.generatedAt}`,
  ].join("\n\n"),
}

export const copilotPrintExamples = presetQuestions.map((question) => ({
  question,
  answer: responses[question],
}))

export function getMockCopilotResponse(query: string): string {
  const matched = matchQuery(query)
  if (matched) return responses[matched]
  return [
    "我可以帮您分析当前事件中的告警收敛与根因调查情况。请尝试以下问题：",
    "",
    ...presetQuestions.map((q, i) => `${i + 1}. ${q}`),
  ].join("\n")
}

export const copilotWelcome = [
  "您好，我是 **AIOps Copilot**，可帮您快速了解当前数据中心故障（UPS-A01 电池组故障）的分析结论与处置建议。",
  "",
  "**当前事件快照**",
  `• Root Cause: ${rootCause.title}`,
  `• Confidence: ${rootCause.confidence}%`,
  `• Reduction Rate: ${reductionRate}%`,
  `• Affected GPU: ${impactKpis.find((k) => k.key === "gpu")!.value}`,
  `• Affected Servers: ${impactKpis.find((k) => k.key === "server")!.value}`,
  "",
  "点击下方快捷问题，或直接输入您的问题。",
].join("\n")
