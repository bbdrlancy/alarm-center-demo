import { scenarioOrder, scenarios, type ScenarioKey } from "@/data/scenarios"
import { getInvestigationWorkbench } from "@/lib/manual-investigation-data"
import {
  getInventoryRawCount,
  getInventoryRulePreview,
  type InventoryEventRow,
  type InventoryRuleKey,
} from "@/lib/manual-event-inventory"

export const INVESTIGATION_CHAT_PROMPTS = [
  "当前告警在数字孪生的什么位置？",
  "这条告警可能影响哪些下游？",
  "为什么判定是这个根因？",
  "全量原始告警覆盖哪些事故？",
]

export type InvestigationChatContext = {
  focusKey: ScenarioKey
  ruleKey: InventoryRuleKey
  selectedEvent?: InventoryEventRow | null
  locationDevice?: string | null
  locationPath?: string | null
}

export function buildSelectionContextLine(ctx: InvestigationChatContext): string {
  if (!ctx.selectedEvent) return "尚未点选告警。在左侧清单选择一条后，孪生图与本对话会同步。"
  const path = ctx.locationPath ? ` · 路径 ${ctx.locationPath}` : ""
  return `${ctx.selectedEvent.incidentId} · ${ctx.selectedEvent.device} · ${ctx.selectedEvent.displayCode}${path}`
}

export function buildInvestigationWelcome(ctx: InvestigationChatContext): string {
  const preview = getInventoryRulePreview("raw")
  return [
    "您好，我是本页固定的 **AI 分析探索** 助手，与左侧数字孪生、原始告警清单联动。",
    "",
    `• 全量原始告警：${preview.rawCount} 条（四域全部，不随其他页面事故切换）`,
    `• ${buildSelectionContextLine(ctx)}`,
    "",
    "点选告警后，可问位置、影响路径或根因；也可以直接输入问题。",
  ].join("\n")
}

export function getInvestigationChatResponse(ctx: InvestigationChatContext, query: string): string {
  const q = query.trim().toLowerCase()
  const preview = getInventoryRulePreview("raw")
  const focus = scenarios[ctx.focusKey]
  const workbench = getInvestigationWorkbench(focus)
  const event = ctx.selectedEvent

  if (!q) return buildInvestigationWelcome(ctx)

  if (q.includes("位置") || q.includes("孪生") || q.includes("在哪") || q.includes("localize") || q.includes("location")) {
    if (!event) {
      return "还没有选中告警。请在左侧 **原始告警** 清单点一条，数字孪生会标注 ALARM 位置，我再根据该位置回答。"
    }
    return [
      `当前联动告警：**${event.device}**（${event.displayCode}）`,
      `事故：${event.incidentId} · ${event.domain}`,
      ctx.locationDevice ? `孪生标注位置：**${ctx.locationDevice}**` : "",
      ctx.locationPath ? `可能影响路径：**${ctx.locationPath}**` : "",
      "",
      event.summary,
    ]
      .filter(Boolean)
      .join("\n")
  }

  if (q.includes("影响") || q.includes("下游") || q.includes("路径") || q.includes("impact") || q.includes("path")) {
    if (!event) {
      return "请先点选一条原始告警。选中后我会按已有依赖链给出从该位置往下的可能影响路径。"
    }
    return [
      `告警 **${event.device}** 位于 ${event.domain} 域。`,
      ctx.locationPath ? `可能影响路径：**${ctx.locationPath}**` : `传播链：${workbench.propagation.map((node) => node.label).join(" → ")}`,
      "",
      `• 基础设施：${workbench.impact.infrastructure}`,
      `• 计算：${workbench.impact.compute}`,
      `• 业务：${workbench.impact.business}`,
      `• 告警：${workbench.impact.alarm}`,
    ].join("\n")
  }

  if (q.includes("清单") || q.includes("全部") || q.includes("覆盖") || q.includes("inventory") || q.includes("多少")) {
    return [
      `左侧原始告警清单共 **${getInventoryRawCount()}** 条，覆盖四起事故，不随其他页面切换改变。`,
      "",
      ...preview.byIncident.map((item) => `• ${item.domain} · ${item.incidentId}：${item.input} 条`),
      "",
      "点选任意一条，上方孪生图标注位置，本对话同步该告警上下文。",
    ].join("\n")
  }

  if (q.includes("对比") || q.includes("四起") || q.includes("源头") || q.includes("compare")) {
    return [
      "四起事故各自源头：",
      "",
      ...scenarioOrder.map((key) => {
        const scenario = scenarios[key]
        const root = getInvestigationWorkbench(scenario).candidates.find((item) => item.likelyRoot)
        return `• ${scenario.domain} · ${scenario.incident.id}：${root?.nameZh ?? scenario.incident.rootCauseZh}（${root?.confidence ?? scenario.incident.confidence}%）`
      }),
    ].join("\n")
  }

  if (q.includes("根因") || q.includes("为什么") || q.includes("判定") || q.includes("candidate") || q.includes("why")) {
    if (!event) {
      return "请先在原始告警中点选一条，我会按该告警所属事故给出根因候选与理由。"
    }
    const top = workbench.candidates.find((item) => item.likelyRoot) ?? workbench.candidates[0]
    return [
      `当前联动事故 **${focus.incident.id}**（${focus.incident.titleZh}）。`,
      "",
      `Top Candidate：**${top?.nameZh}**，置信度 **${top?.confidence}%**。`,
      "",
      top?.whyZh ?? focus.incident.rcaSummary,
    ].join("\n")
  }

  if (event && (q.includes("这条") || q.includes("选中") || q.includes("告警") || q.includes("event") || q.includes(event.device.toLowerCase()) || q.includes(event.displayCode.toLowerCase()))) {
    return [
      `正在分析 **${event.incidentId}** / **${event.device}**。`,
      `• 时间：${event.timestamp}`,
      `• 级别：${event.severity}`,
      `• 告警：${event.displayCode}`,
      `• 说明：${event.summary}`,
      ctx.locationPath ? `• 可能影响路径：${ctx.locationPath}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  }

  return [
    `我已与当前页面联动。${buildSelectionContextLine(ctx)}`,
    "",
    "可以问：",
    ...INVESTIGATION_CHAT_PROMPTS.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n")
}
