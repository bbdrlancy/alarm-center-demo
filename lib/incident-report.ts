import { buildConvergenceFlow } from "@/lib/alarm-convergence"
import type { CommandIncident } from "@/lib/incident-command"
import { getPropagationHops } from "@/lib/incident-journey"
import { getIncidentOverview } from "@/lib/incident-overview"
import { getInvestigationWorkbench } from "@/lib/manual-investigation-data"

export type IncidentReport = {
  incidentId: string
  title: string
  titleZh: string
  generatedAt: string
  markdown: string
  fileName: string
}

function nowStamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

function nowLabel() {
  return new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function buildIncidentReport(incident: CommandIncident): IncidentReport {
  const scenario = incident.scenario
  const overview = getIncidentOverview(scenario)
  const hops = getPropagationHops(scenario)
  const flow = buildConvergenceFlow(scenario)
  const workbench = getInvestigationWorkbench(scenario)
  const generatedAt = nowLabel()
  const stamp = nowStamp()

  const stageLines = flow.stages
    .map((stage) => `- ${stage.label} / ${stage.en}：${stage.input} → ${stage.output}（减少 ${stage.reduced}，贡献 ${Math.round(stage.contribution)}%）`)
    .join("\n")

  const hopLines = hops
    .map(
      (hop, index) =>
        `${index + 1}. **${hop.time}** ${hop.zh} / ${hop.title}\n   - 详情：${hop.detail}\n   - 资产：${hop.asset}\n   - 服务：${hop.service}\n   - 角色：${hop.role}`,
    )
    .join("\n")

  const evidenceLines = incident.evidence
    .map((item) => `- ${item.zh} / ${item.en}：${item.value}`)
    .join("\n")

  const whatLines = incident.whatHappened.map((line, i) => `${i + 1}. ${line}`).join("\n")

  const candidateLines = workbench.candidates
    .map(
      (c) =>
        `- ${c.nameZh} / ${c.name}｜置信度 ${c.confidence}%｜告警 ${c.alarmCount}｜历史相似 ${c.historicalSimilarity}%${c.likelyRoot ? "｜**Top Candidate**" : ""}\n  - 理由：${c.whyZh}`,
    )
    .join("\n")

  const verifyLines = workbench.steps
    .map((step) => `- [${step.status}] ${step.stepZh} / ${step.stepEn}\n  - 发现：${step.finding}\n  - 下一步：${step.nextAction}`)
    .join("\n")

  const action = overview.recommendedAction
  const actionSteps = action.steps.map((s, i) => `${i + 1}. ${s.zh}（${s.team}）`).join("\n")

  const markdown = `# 事故分析报告 / Incident Analysis Report

## 文档信息
- 事故编号：${incident.incidentId}
- 标题：${incident.titleZh} / ${incident.title}
- 域：${incident.domain}
- 严重级别：${incident.severityLabel}
- 状态：${incident.commandStatusZh} / ${incident.commandStatus}
- 生成时间：${generatedAt}
- 报告来源：事故工作台 Incident Workspace

---

## 1. 执行摘要 / Executive Summary
${scenario.incident.executiveLine}

- 根因：${incident.rootCauseZh}（${incident.rootCause}）
- 置信度：${incident.confidence}%
- 告警收敛：${scenario.incident.alarmReduction}（降幅 ${scenario.incident.reductionRate}%）
- 分析耗时：${scenario.incident.analysisTime}
- 持续时间：${incident.duration}
- 恢复进度：${incident.recoveryPercent}%
- SLA 风险：${incident.impact.slaRisk}

---

## 2. 事故概况 / Incident Profile
| 字段 | 内容 |
| --- | --- |
| 开始时间 | ${incident.startTimeLabel} |
| 更新时间 | ${incident.updateTimeLabel} |
| 受影响服务 | ${incident.impact.services}（${scenario.incident.businessImpact}） |
| 受影响资产 | ${incident.impact.devices}（${scenario.incident.affectedAssets}） |
| 影响域数 | ${incident.impact.domains} |
| GPU 节点 | ${incident.impact.gpuNodes} |
| 责任团队 | ${incident.commander} |
| 当前阶段 | ${incident.currentStage} |

### 发生了什么 / What Happened
${whatLines}

### RCA 结论
${scenario.incident.rcaSummary}

### 调查焦点
${scenario.incident.investigationFocus}

---

## 3. 根因判断 / Root Cause
- 最终根因：${incident.rootCauseZh}
- 英文：${incident.rootCause}
- 置信度：${incident.confidence}%
- GraphRAG 命题：${scenario.graph.graphrag.title}

### 推理因子
${scenario.graph.graphrag.factors.map((f) => `- **${f.label}**：${f.detail}`).join("\n")}

### 根因候选
${candidateLines}

---

## 4. 传播路径 / Propagation
${hopLines}

### 影响链
${scenario.impactChain.map((n, i) => `${i + 1}. ${n.label}（${n.sub}）· ${n.type} · ${n.status}`).join("\n")}

---

## 5. 业务与资产影响 / Impact
- 业务：${incident.impactBreakdown.business.title} — ${incident.impactBreakdown.business.detail}
- 服务：${incident.impactBreakdown.service.title} — ${incident.impactBreakdown.service.detail}
- 资产：${incident.impactBreakdown.asset.title} — ${incident.impactBreakdown.asset.detail}

---

## 6. 证据摘要 / Evidence
${evidenceLines}
- 置信度 / Confidence：${incident.confidence}%

### 时间线结论
${scenario.timeline.conclusion}

---

## 7. 告警收敛 / Alarm Convergence
原始告警总量：${flow.rawCount}

${stageLines}

### 关键规则贡献
${flow.pipelineRules
  .slice(0, 6)
  .map((rule) => `- ${rule.en} / ${rule.zh ?? rule.en}：减少 ${rule.reduced}，贡献 ${Math.round(rule.contribution)}%`)
  .join("\n")}

---

## 8. 处置建议 / Mitigation
- 建议行动：${incident.nextAction.short}
- 详情：${incident.nextAction.actionZh}
- 英文：${incident.nextAction.action}${incident.nextAction.line2 ? ` ${incident.nextAction.line2}` : ""}
- 责任团队：${incident.nextAction.ownerTeam}
- ETA：${incident.nextAction.eta}（${incident.nextAction.etaShort}）
- 状态：${incident.nextAction.status} / ${incident.nextAction.runStatus}
- 完成度：${incident.nextAction.completion}%
- 风险下降：${incident.nextAction.riskReduction}%
- 行动置信度：${action.confidence}%

### 理由
${action.rationaleZh}

### 执行步骤
${actionSteps}

---

## 9. 人工核验 / Human Verification
${verifyLines}

---

## 10. 结论 / Conclusion
系统判定根因为 **${incident.rootCauseZh}**，置信度 **${incident.confidence}%**。  
传播路径：${incident.propagationPath.join(" → ")}。  
当前处置：**${incident.nextAction.short}**，预计 **${incident.nextAction.eta}** 完成，恢复进度 **${incident.recoveryPercent}%**。

---

*本报告由 AIOps 事故工作台根据当前事故全量上下文自动生成，可用于复盘、升级与交接。*
`

  return {
    incidentId: incident.incidentId,
    title: incident.title,
    titleZh: incident.titleZh,
    generatedAt,
    markdown,
    fileName: `incident-report-${incident.incidentId}-${stamp}.md`,
  }
}

export function downloadTextFile(fileName: string, content: string, mime = "text/markdown;charset=utf-8") {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
