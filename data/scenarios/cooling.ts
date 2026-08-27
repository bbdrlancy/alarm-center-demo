import type { ScenarioModel } from "./types"

export const coolingScenario: ScenarioModel = {
  id: "cooling",
  name: "Cooling Failure",
  domain: "Cooling",
  color: "#fb8c00",
  themeName: "Orange",

  incident: {
    id: "INC-20260821",
    severity: "P1",
    status: "Open",
    title: "CRAC Cooling Failure",
    titleZh: "精密空调故障",
    rootCause: "CRAC-A02 Compressor Failure",
    rootCauseZh: "CRAC-A02 压缩机故障",
    confidence: 95,
    analysisTime: "3 Minutes",
    alarmReduction: "876 → 1",
    rawAlarms: 876,
    rootCauseCount: 1,
    reductionRate: 99.89,
    analysisMinutes: 3,
    affectedAssets: "16 Racks",
    businessImpact: "Training Cluster B",
    affectedServer: 64,
    affectedGpu: 256,
    affectedRack: 16,
    startTime: "05:42",
    executiveLine:
      "Cooling domain P1: compressor failure raised inlet temperature across 16 racks in Training Cluster B.",
    investigationFocus: "Thermal propagation path from CRAC unit through cold aisle to GPU rack group.",
    rcaSummary: "Thermal propagation chain and time alignment confirm compressor failure as root cause.",
  },

  impactChain: [
    { id: "crac", label: "CRAC", sub: "Unit A02", type: "Cooling", status: "root" },
    { id: "zone", label: "Cooling Zone A", sub: "Cold Aisle A", type: "Cooling", status: "impacted" },
    { id: "rack", label: "Rack Cluster B", sub: "16 Racks", type: "Compute", status: "impacted" },
    { id: "gpu", label: "GPU Overheat", sub: "72°C Inlet", type: "Compute", status: "impacted" },
    { id: "service", label: "Training Service", sub: "Cluster B", type: "Service", status: "impacted" },
  ],

  timeline: {
    events: [
      { time: "05:42:08", title: "CRAC Failure", zh: "压缩机停机", priority: "P1", detail: "压缩机电流异常，冷量输出归零" },
      { time: "05:43:20", title: "Inlet Temp Rise", zh: "进风温度上升", priority: "P1", detail: "Cold Aisle A 进风 24°C → 38°C" },
      { time: "05:44:55", title: "Rack Thermal Alert", zh: "机架热告警", priority: "P1", detail: "Rack Cluster B 16 台机架超温" },
      { time: "05:46:10", title: "GPU Throttle", zh: "GPU 降频保护", priority: "P2", detail: "256 GPU 卡触发 thermal throttle" },
      { time: "05:47:30", title: "Training Pause", zh: "训练任务暂停", priority: "P1", detail: "Training Cluster B 作业自动暂停" },
    ],
    conclusion: "自 CRAC 故障至训练暂停，热传播约 5 分钟。",
  },

  graph: {
    mapping: ["CRAC A02", "Cooling Zone A", "INC-20260821", "Training Cluster B"],
    nodes: [
      { id: "device-root", label: "CRAC A02", category: "device" },
      { id: "loc-zone", label: "Cooling Zone A", category: "location" },
      { id: "incident", label: "INC-20260821", category: "incident" },
      { id: "service", label: "Training Cluster B", category: "service" },
    ],
    edges: [
      { source: "device-root", target: "loc-zone", relation: "cools" },
      { source: "device-root", target: "incident", relation: "generates" },
      { source: "incident", target: "service", relation: "impacts" },
    ],
    graphrag: {
      title: "Why was the CRAC unit identified as root cause?",
      confidence: 95,
      factors: [
        { label: "Thermal chain", detail: "First temperature rise at CRAC outlet before rack alerts" },
        { label: "Spatial scope", detail: "Cold Aisle A racks heat together — not isolated PDU event" },
        { label: "Business timing", detail: "Training pause aligns with CRAC shutdown timestamp" },
        { label: "Historical pattern", detail: "91% match to compressor stall signature" },
      ],
    },
    conclusion: "Cooling asset instances and thermal edges provide GraphRAG context for 95% confidence.",
  },

  digitalTwin: {
    focus: "Cooling Zone A · Cold Aisle · Rack Cluster B",
    rootCauseLabel: "CRAC Unit A02",
    conclusion:
      "Digital twin shows thermal propagation from cooling unit through aisle to GPU racks and training cluster.",
  },

  copilot: {
    snapshot: "CRAC compressor failure · Cooling · 95% confidence · Training Cluster B impacted",
    suggestions: [
      "为什么根因是CRAC而不是配电？",
      "为什么876条告警被收敛为1条？",
      "Training Cluster B 影响范围？",
      "GPU 过热阈值是多少？",
    ],
  },

  businessValue: {
    annualRoi: 7.2,
    automationRate: 82,
    efficiencyGain: 95,
    businessRisk: 9.8,
    reductionRate: 99.89,
    mttrBefore: "4 Hours",
    mttrAfter: "3 Minutes",
    tagline: "Cooling incident isolated in 3 minutes — ¥7.2M annual thermal-risk savings.",
  },

  portfolio: {
    summaryLines: [
      "Cooling domain incident threatens Training Cluster B with thermal runaway risk.",
      "Compressor failure identified at 95% confidence across 876 alarms.",
      "Estimated financial exposure: ¥9.8M.",
    ],
    recommendedAction: {
      action: "Switch Cooling Zone A to backup CRAC unit.",
      ownerTeam: "Facility Team",
      eta: "15 Minutes",
      riskReduction: 22,
      status: "Suggested",
      confidence: 95,
    },
  },
}
