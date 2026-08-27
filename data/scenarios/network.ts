import type { ScenarioModel } from "./types"

export const networkScenario: ScenarioModel = {
  id: "network",
  name: "Network Failure",
  domain: "Network",
  color: "#1e88e5",
  themeName: "Blue",

  incident: {
    id: "INC-20260823",
    severity: "P2",
    status: "Resolved",
    title: "Core Network Switch Failure",
    titleZh: "核心网络交换机故障",
    rootCause: "Core Switch Failure",
    rootCauseZh: "核心交换机故障",
    confidence: 94,
    analysisTime: "2 Minutes",
    alarmReduction: "428 → 1",
    rawAlarms: 428,
    rootCauseCount: 1,
    reductionRate: 99.77,
    analysisMinutes: 2,
    affectedAssets: "32 Servers",
    businessImpact: "AI Gateway",
    affectedServer: 32,
    affectedGpu: 128,
    affectedRack: 4,
    startTime: "11:08",
    executiveLine:
      "Network domain P2: core switch failure isolated; traffic rerouted, AI Gateway restored.",
    investigationFocus: "BGP reconvergence and redundant path validation completed.",
    rcaSummary: "BGP flap and core switch offline confirm root cause; redundant path restored service.",
  },

  impactChain: [
    { id: "core", label: "Core Switch", sub: "SW-CORE-02", type: "Network", status: "root" },
    { id: "agg", label: "Aggregation Switch", sub: "SW-AGG-04", type: "Network", status: "impacted" },
    { id: "edge", label: "Edge Network", sub: "Top-of-Rack", type: "Network", status: "impacted" },
    { id: "gpu", label: "GPU Cluster", sub: "32 Servers", type: "Compute", status: "impacted" },
    { id: "gateway", label: "AI Gateway", sub: "API Gateway", type: "Service", status: "impacted" },
  ],

  timeline: {
    events: [
      { time: "11:08:15", title: "Core Switch Down", zh: "核心交换机离线", priority: "P2", detail: "控制平面 unreachable" },
      { time: "11:08:45", title: "BGP Flap", zh: "BGP 震荡", priority: "P2", detail: "Aggregation 层路由收敛延迟" },
      { time: "11:09:30", title: "East-West Loss", zh: "东西向流量中断", priority: "P2", detail: "GPU Cluster 32 台服务器网络隔离" },
      { time: "11:10:20", title: "Gateway Timeout", zh: "网关超时", priority: "P2", detail: "AI Gateway API 503 错误率上升" },
      { time: "11:12:00", title: "Path Restored", zh: "链路恢复", priority: "P3", detail: "冗余路径接管，服务逐步恢复" },
    ],
    conclusion: "自核心交换机故障至链路恢复，网络收敛约 4 分钟。",
  },

  graph: {
    mapping: ["SW-CORE-02", "Network Core", "INC-20260823", "AI Gateway"],
    nodes: [
      { id: "device-root", label: "SW-CORE-02", category: "device" },
      { id: "core", label: "Network Core", category: "location" },
      { id: "incident", label: "INC-20260823", category: "incident" },
      { id: "service", label: "AI Gateway", category: "service" },
    ],
    edges: [
      { source: "device-root", target: "core", relation: "routes" },
      { source: "device-root", target: "incident", relation: "generates" },
      { source: "incident", target: "service", relation: "impacts" },
    ],
    graphrag: {
      title: "Why was the core switch identified as root cause?",
      confidence: 94,
      factors: [
        { label: "BGP timing", detail: "Route flap begins at core switch control plane loss" },
        { label: "East-west isolation", detail: "GPU cluster isolation follows core failure" },
        { label: "Gateway errors", detail: "503 rate spike correlates with switch offline" },
        { label: "Redundant path", detail: "Recovery after alternate path validation" },
      ],
    },
    conclusion: "Network core instances and routing edges provide GraphRAG context for 94% confidence.",
  },

  digitalTwin: {
    focus: "Network Core · Aggregation Layer · AI Gateway Edge",
    rootCauseLabel: "Core Switch SW-CORE-02",
    conclusion: "Digital twin shows network dependency from core through aggregation to gateway edge.",
  },

  copilot: {
    snapshot: "Core switch failure · Network · 94% confidence · AI Gateway restored",
    suggestions: [
      "为什么根因是核心交换机？",
      "428条告警收敛过程？",
      "AI Gateway 影响范围？",
      "冗余路径如何切换？",
    ],
  },

  businessValue: {
    annualRoi: 5.8,
    automationRate: 88,
    efficiencyGain: 110,
    businessRisk: 7.5,
    reductionRate: 99.77,
    mttrBefore: "4 Hours",
    mttrAfter: "2 Minutes",
    tagline: "Network failover validated in 2 minutes — ¥5.8M annual uptime value.",
  },

  portfolio: {
    summaryLines: [
      "Network domain incident impacted AI Gateway via core switch failure.",
      "Core switch failure resolved at 94% confidence across 428 alarms.",
      "Estimated financial exposure: ¥7.5M.",
    ],
    recommendedAction: {
      action: "Reroute traffic to secondary network path.",
      ownerTeam: "Network Team",
      eta: "10 Minutes",
      riskReduction: 12,
      status: "Completed",
      confidence: 94,
    },
  },
}
