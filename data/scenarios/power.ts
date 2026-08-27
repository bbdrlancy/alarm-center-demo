import type { ScenarioModel } from "./types"

export const powerScenario: ScenarioModel = {
  id: "power",
  name: "Power Failure",
  domain: "Power",
  color: "#e53935",
  themeName: "Red",

  incident: {
    id: "INC-20260820",
    severity: "P1",
    status: "In Progress",
    title: "UPS Battery Failure",
    titleZh: "UPS 电池组故障",
    rootCause: "UPS-A01 Battery Failure",
    rootCauseZh: "UPS-A01 电池组故障",
    confidence: 98,
    analysisTime: "2 Minutes",
    alarmReduction: "1248 → 1",
    rawAlarms: 1248,
    rootCauseCount: 1,
    reductionRate: 99.92,
    analysisMinutes: 2,
    affectedAssets: "84 GPU Servers",
    businessImpact: "AI Training Service",
    affectedServer: 84,
    affectedGpu: 336,
    affectedRack: 12,
    startTime: "03:00",
    executiveLine:
      "Power domain P1: battery failure at the supply source cascaded to GPU servers serving AI Training Service.",
    investigationFocus: "Alarm convergence from raw alarms to single root cause in the power zone.",
    rcaSummary: "Alarm convergence, impact chain and temporal correlation confirm the supply source as sole root cause.",
  },

  impactChain: [
    { id: "ups", label: "UPS", sub: "Supply Unit A01", type: "Power", status: "root" },
    { id: "pdu", label: "PDU", sub: "Distribution A01~A04", type: "Power", status: "impacted" },
    { id: "rack", label: "Rack", sub: "Rack A01~A12", type: "Compute", status: "impacted" },
    { id: "gpu", label: "GPU", sub: "84 Servers", type: "Compute", status: "impacted" },
    { id: "service", label: "Training Service", sub: "AI Training", type: "Service", status: "impacted" },
  ],

  timeline: {
    events: [
      { time: "03:00:12", title: "Supply Failure", zh: "供电单元电池组故障", priority: "P1", detail: "电池内阻骤升，旁路切换失败" },
      { time: "03:00:48", title: "Voltage Drop", zh: "输出电压跌落", priority: "P1", detail: "Power Zone A 电压 400V → 210V" },
      { time: "03:01:30", title: "Distribution Loss", zh: "配电单元失电", priority: "P1", detail: "Distribution A01~A04 输入中断" },
      { time: "03:02:15", title: "Rack Down", zh: "机架断电", priority: "P2", detail: "Rack A01~A12 供电丢失" },
      { time: "03:03:40", title: "GPU Offline", zh: "GPU 服务器离线", priority: "P2", detail: "84 台 GPU 服务器离线" },
      { time: "03:04:20", title: "Service Impact", zh: "业务中断", priority: "P1", detail: "AI Training Service 训练任务中断" },
    ],
    conclusion: "自供电故障至业务中断，全程约 4 分钟。",
  },

  graph: {
    mapping: ["Supply Unit A01", "Power Zone A", "INC-20260820", "AI Training Service"],
    nodes: [
      { id: "device-root", label: "Supply Unit A01", category: "device" },
      { id: "loc-zone", label: "Power Zone A", category: "location" },
      { id: "incident", label: "INC-20260820", category: "incident" },
      { id: "service", label: "AI Training Service", category: "service" },
    ],
    edges: [
      { source: "device-root", target: "loc-zone", relation: "located_in" },
      { source: "device-root", target: "incident", relation: "generates" },
      { source: "incident", target: "service", relation: "impacts" },
    ],
    graphrag: {
      title: "Why was the supply source identified as root cause?",
      confidence: 98,
      factors: [
        { label: "Spatial relation", detail: "Only upstream supply source in Power Zone A" },
        { label: "Power chain", detail: "Complete downstream propagation to GPU cluster" },
        { label: "Business alignment", detail: "Service SLA breach aligns with supply failure time" },
        { label: "Historical pattern", detail: "94% match to battery failure pattern library" },
      ],
    },
    conclusion:
      "Graph instances linked by powered_by, generates and impacts relations form the GraphRAG reasoning context.",
  },

  digitalTwin: {
    focus: "Power Zone A · Building A / Floor 1",
    rootCauseLabel: "Supply Unit A01",
    conclusion:
      "Each domain retains power/cooling/network/storage/business topology; selecting the root device shows how spatial, supply, business and graph relations yield 98% confidence.",
  },

  copilot: {
    snapshot: "Power supply failure · 98% confidence · AI Training Service impacted",
    suggestions: [
      "为什么最终根因是供电故障？",
      "为什么告警被收敛为1条？",
      "本次事件影响范围是什么？",
      "受影响GPU数量是多少？",
    ],
  },

  businessValue: {
    annualRoi: 8.6,
    automationRate: 85,
    efficiencyGain: 120,
    businessRisk: 12.3,
    reductionRate: 99.92,
    mttrBefore: "4 Hours",
    mttrAfter: "2 Minutes",
    tagline: "Power incident RCA in 2 minutes vs 4 hours manual — ¥8.6M annual ROI.",
  },

  portfolio: {
    summaryLines: [
      "Power domain incident is the primary P1 event threatening AI Training Service.",
      "Supply failure drives 98% confidence root cause across converged alarms.",
      "Estimated financial exposure: ¥12.3M.",
    ],
    recommendedAction: {
      action: "Replace UPS battery module and validate bypass transfer.",
      ownerTeam: "Power Team",
      eta: "30 Minutes",
      riskReduction: 18,
      status: "In Progress",
      confidence: 92,
    },
  },
}
