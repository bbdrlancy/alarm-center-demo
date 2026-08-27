import type { ScenarioModel } from "./types"

export const storageScenario: ScenarioModel = {
  id: "storage",
  name: "Storage Failure",
  domain: "Storage",
  color: "#7b1fa2",
  themeName: "Purple",

  incident: {
    id: "INC-20260822",
    severity: "P2",
    status: "Investigating",
    title: "Storage Controller Failure",
    titleZh: "存储控制器故障",
    rootCause: "Storage Controller Cluster Failure",
    rootCauseZh: "存储控制器集群故障",
    confidence: 92,
    analysisTime: "4 Minutes",
    alarmReduction: "642 → 1",
    rawAlarms: 642,
    rootCauseCount: 1,
    reductionRate: 99.84,
    analysisMinutes: 4,
    affectedAssets: "120 TB Data Volume",
    businessImpact: "Dataset Service",
    affectedServer: 48,
    affectedGpu: 0,
    affectedRack: 8,
    startTime: "08:15",
    executiveLine:
      "Storage domain P2: dual-controller failover incomplete; dataset volume at degraded I/O.",
    investigationFocus: "Controller heartbeat loss correlated with SAN fabric retry storms.",
    rcaSummary: "SAN retry storms and controller heartbeat loss confirm storage controller cluster failure.",
  },

  impactChain: [
    { id: "ctrl", label: "Storage Controller", sub: "Ctrl-A/B", type: "Storage", status: "root" },
    { id: "san", label: "SAN", sub: "Fabric Zone 2", type: "Storage", status: "impacted" },
    { id: "volume", label: "Dataset Volume", sub: "120 TB", type: "Storage", status: "impacted" },
    { id: "job", label: "Model Training Job", sub: "Job-8842", type: "Compute", status: "impacted" },
    { id: "platform", label: "AI Platform", sub: "Dataset Service", type: "Service", status: "impacted" },
  ],

  timeline: {
    events: [
      { time: "08:15:22", title: "Controller Failover", zh: "控制器切换失败", priority: "P2", detail: "双控心跳丢失，failover 未完成" },
      { time: "08:16:40", title: "SAN Retry Storm", zh: "SAN 重试风暴", priority: "P2", detail: "Fabric Zone 2 I/O 延迟飙升" },
      { time: "08:18:05", title: "Volume Degraded", zh: "卷降级", priority: "P2", detail: "120 TB Dataset Volume 进入 degraded 模式" },
      { time: "08:19:50", title: "Training Job Fail", zh: "训练作业失败", priority: "P2", detail: "Model Training Job checkpoint 中断" },
      { time: "08:21:10", title: "Service Degraded", zh: "服务降级", priority: "P2", detail: "Dataset Service 读写 SLA 违约" },
    ],
    conclusion: "自控制器故障至服务降级，存储链路约 6 分钟。",
  },

  graph: {
    mapping: ["Storage Ctrl-A", "SAN-Fabric-2", "INC-20260822", "Dataset Service"],
    nodes: [
      { id: "device-root", label: "Storage Ctrl-A", category: "device" },
      { id: "fabric", label: "SAN-Fabric-2", category: "network" },
      { id: "incident", label: "INC-20260822", category: "incident" },
      { id: "service", label: "Dataset Service", category: "service" },
    ],
    edges: [
      { source: "device-root", target: "fabric", relation: "controls" },
      { source: "device-root", target: "incident", relation: "generates" },
      { source: "incident", target: "service", relation: "impacts" },
    ],
    graphrag: {
      title: "Why was the storage controller identified as root cause?",
      confidence: 92,
      factors: [
        { label: "Controller heartbeat", detail: "Dual-controller heartbeat lost before volume errors" },
        { label: "SAN fabric", detail: "Retry storm originates at controller port" },
        { label: "Volume path", detail: "Degraded I/O on dataset volume downstream only" },
        { label: "Historical pattern", detail: "88% match to failover timeout signature" },
      ],
    },
    conclusion: "Storage controller and SAN fabric instances form the GraphRAG reasoning subgraph.",
  },

  digitalTwin: {
    focus: "Storage Tier · SAN Fabric Zone 2 · Dataset Volume Pool",
    rootCauseLabel: "Storage Controller Cluster",
    conclusion: "Digital twin maps storage tier dependencies from controller through SAN to dataset service.",
  },

  copilot: {
    snapshot: "Storage controller failure · Storage · 92% confidence · Dataset Service degraded",
    suggestions: [
      "为什么根因是存储控制器？",
      "642条告警如何收敛？",
      "120 TB 数据卷影响范围？",
      "训练作业如何恢复？",
    ],
  },

  businessValue: {
    annualRoi: 6.4,
    automationRate: 78,
    efficiencyGain: 88,
    businessRisk: 11.1,
    reductionRate: 99.84,
    mttrBefore: "4 Hours",
    mttrAfter: "4 Minutes",
    tagline: "Storage RCA in 4 minutes prevents data-loss escalation — ¥6.4M annual value.",
  },

  portfolio: {
    summaryLines: [
      "Storage domain incident degrades 120 TB dataset volume for Dataset Service.",
      "Controller cluster failure at 92% confidence across 642 alarms.",
      "Estimated financial exposure: ¥11.1M.",
    ],
    recommendedAction: {
      action: "Trigger storage controller failover.",
      ownerTeam: "Storage Team",
      eta: "20 Minutes",
      riskReduction: 35,
      status: "Suggested",
      confidence: 92,
    },
  },
}
