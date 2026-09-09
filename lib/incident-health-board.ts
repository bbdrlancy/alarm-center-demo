import {
  getCommandPortfolio,
  type CommandIncident,
} from "@/lib/incident-command"

export type HealthTimeRange = "1H" | "4H" | "24H" | "7D"

export const HEALTH_TIME_RANGES: { id: HealthTimeRange; zh: string; en: string }[] = [
  { id: "1H", zh: "1 小时", en: "1H" },
  { id: "4H", zh: "4 小时", en: "4H" },
  { id: "24H", zh: "24 小时", en: "24H" },
  { id: "7D", zh: "7 天", en: "7D" },
]

export type TrendSeriesKey = "open" | "p1" | "recovered"

export type HealthMetric = {
  id: string
  zh: string
  en: string
  value: number
  suffix?: string
  delta: number
  deltaSuffix?: string
  /** positive = up is worse for risk metrics, better for recovery */
  polarity: "risk" | "recovery"
}

export type TrendPoint = {
  label: string
  open: number
  p1: number
  recovered: number
}

export type DistributionSlice = {
  id: string
  label: string
  labelZh: string
  value: number
  color: string
}

export type FunnelStage = {
  id: string
  zh: string
  en: string
  count: number
}

export type IncidentHealthBoardModel = {
  range: HealthTimeRange
  metrics: HealthMetric[]
  trend: TrendPoint[]
  /** Domain risk composition; values are percentages that sum to 100. */
  riskWeight: DistributionSlice[]
  funnel: FunnelStage[]
  insight: { zh: string; en: string }
}

/** Demo scale + deltas by window — linked to live portfolio baseline. */
const RANGE_PROFILE: Record<
  HealthTimeRange,
  {
    openDelta: number
    criticalDelta: number
    servicesDelta: number
    assetsDelta: number
    recoveryDelta: number
    funnel: number[]
    trendLabels: string[]
    openTrend: number[]
    p1Trend: number[]
    recoveredTrend: number[]
    insightZh: string
    insightEn: string
  }
> = {
  "1H": {
    openDelta: 1,
    criticalDelta: 1,
    servicesDelta: 2,
    assetsDelta: 18,
    recoveryDelta: -4,
    funnel: [4, 3, 2, 1, 0],
    trendLabels: ["-60m", "-50m", "-40m", "-30m", "-20m", "-10m", "now"],
    openTrend: [3, 3, 4, 4, 5, 4, 4],
    p1Trend: [1, 1, 2, 2, 2, 2, 2],
    recoveredTrend: [0, 0, 0, 1, 1, 1, 1],
    insightZh: "近 1 小时 Open 事故略升，P1 未收敛，建议保持升级值班。",
    insightEn: "Open incidents edged up in the last hour; P1 load is not easing.",
  },
  "4H": {
    openDelta: 2,
    criticalDelta: 0,
    servicesDelta: -1,
    assetsDelta: 12,
    recoveryDelta: 6,
    funnel: [5, 4, 2, 2, 1],
    trendLabels: ["-4h", "-3h", "-2h", "-90m", "-60m", "-30m", "now"],
    openTrend: [2, 3, 4, 5, 4, 4, 4],
    p1Trend: [1, 2, 2, 2, 2, 2, 2],
    recoveredTrend: [0, 0, 1, 1, 1, 1, 1],
    insightZh: "4 小时窗口事故增量放缓，恢复进度回升，风险仍集中在电力与制冷。",
    insightEn: "4h growth slowed and recovery improved; risk still clusters in Power/Cooling.",
  },
  "24H": {
    openDelta: -1,
    criticalDelta: -1,
    servicesDelta: -3,
    assetsDelta: -24,
    recoveryDelta: 12,
    funnel: [6, 4, 3, 2, 2],
    trendLabels: ["00", "04", "08", "12", "16", "20", "24"],
    openTrend: [5, 6, 7, 6, 5, 4, 4],
    p1Trend: [3, 3, 3, 2, 2, 2, 2],
    recoveredTrend: [0, 1, 1, 2, 2, 2, 3],
    insightZh: "24 小时事故总量下降，P1 收敛，整体恢复向好，可评估是否降级响应。",
    insightEn: "24h totals and P1 are down; recovery is improving — consider de-escalation.",
  },
  "7D": {
    openDelta: -3,
    criticalDelta: -2,
    servicesDelta: -8,
    assetsDelta: -60,
    recoveryDelta: 18,
    funnel: [8, 6, 4, 3, 5],
    trendLabels: ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "Today"],
    openTrend: [9, 8, 7, 6, 5, 5, 4],
    p1Trend: [4, 4, 3, 3, 2, 2, 2],
    recoveredTrend: [2, 3, 4, 5, 5, 6, 7],
    insightZh: "7 天趋势明确收敛，恢复漏斗底部加厚，域风险仍以 Power 为主。",
    insightEn: "7-day trend is converging; recovery funnel fills at Resolved; Power still leads risk.",
  },
}

const DOMAIN_COLOR: Record<string, string> = {
  Cooling: "#0288d1",
  Power: "#e53935",
  Storage: "#7b1fa2",
  Network: "#00897b",
}

/** Demo risk composition by window — Cooling / Power lead, Storage & Network trail. */
const RISK_WEIGHT_BY_RANGE: Record<
  HealthTimeRange,
  { id: string; label: string; labelZh: string; value: number }[]
> = {
  "1H": [
    { id: "Cooling", label: "Cooling", labelZh: "制冷", value: 45 },
    { id: "Power", label: "Power", labelZh: "电力", value: 32 },
    { id: "Storage", label: "Storage", labelZh: "存储", value: 13 },
    { id: "Network", label: "Network", labelZh: "网络", value: 10 },
  ],
  "4H": [
    { id: "Cooling", label: "Cooling", labelZh: "制冷", value: 40 },
    { id: "Power", label: "Power", labelZh: "电力", value: 35 },
    { id: "Storage", label: "Storage", labelZh: "存储", value: 15 },
    { id: "Network", label: "Network", labelZh: "网络", value: 10 },
  ],
  "24H": [
    { id: "Cooling", label: "Cooling", labelZh: "制冷", value: 40 },
    { id: "Power", label: "Power", labelZh: "电力", value: 35 },
    { id: "Storage", label: "Storage", labelZh: "存储", value: 15 },
    { id: "Network", label: "Network", labelZh: "网络", value: 10 },
  ],
  "7D": [
    { id: "Cooling", label: "Cooling", labelZh: "制冷", value: 35 },
    { id: "Power", label: "Power", labelZh: "电力", value: 40 },
    { id: "Storage", label: "Storage", labelZh: "存储", value: 15 },
    { id: "Network", label: "Network", labelZh: "网络", value: 10 },
  ],
}

function funnelBucket(item: CommandIncident): FunnelStage["id"] {
  if (item.recovered || item.currentStage === "closed") return "resolved"
  if (item.currentStage === "recovering") return "recovering"
  if (item.currentStage === "mitigating" || item.commandStatus === "Mitigating") return "mitigating"
  if (
    item.currentStage === "analyzed" ||
    item.currentStage === "rootCause" ||
    item.commandStatus === "Analyzed"
  ) {
    return "analyzed"
  }
  return "open"
}

function liveFunnel(items: CommandIncident[]): number[] {
  const counts = { open: 0, analyzed: 0, mitigating: 0, recovering: 0, resolved: 0 }
  for (const item of items) {
    counts[funnelBucket(item) as keyof typeof counts] += 1
  }
  return [counts.open, counts.analyzed, counts.mitigating, counts.recovering, counts.resolved]
}

function blendFunnel(live: number[], profile: number[]): number[] {
  // Prefer live shape; scale toward profile totals for demo richness per range.
  const liveSum = live.reduce((a, b) => a + b, 0) || 1
  const profileSum = profile.reduce((a, b) => a + b, 0) || 1
  const scale = Math.max(1, Math.round(profileSum / liveSum))
  return live.map((n, i) => Math.max(n, Math.round((profile[i] ?? 0) * 0.35 + n * scale * 0.65)))
}

export function getIncidentHealthBoard(
  range: HealthTimeRange,
  items: CommandIncident[] = getCommandPortfolio(),
): IncidentHealthBoardModel {
  const profile = RANGE_PROFILE[range]
  const open = items.filter((item) => item.open)
  const critical = items.filter((item) => item.critical && item.open)
  const services = open.reduce((sum, item) => sum + item.impact.services, 0)
  const assets = open.reduce((sum, item) => sum + item.impact.devices, 0)
  const recovery = Math.round(
    items.reduce((sum, item) => sum + item.recoveryPercent, 0) / Math.max(items.length, 1),
  )

  const metrics: HealthMetric[] = [
    {
      id: "open",
      zh: "当前事故",
      en: "Open Incidents",
      value: open.length,
      delta: profile.openDelta,
      polarity: "risk",
    },
    {
      id: "critical",
      zh: "严重事故",
      en: "Critical Incidents",
      value: critical.length,
      delta: profile.criticalDelta,
      polarity: "risk",
    },
    {
      id: "services",
      zh: "受影响服务",
      en: "Affected Services",
      value: services,
      delta: profile.servicesDelta,
      polarity: "risk",
    },
    {
      id: "assets",
      zh: "受影响资产",
      en: "Affected Assets",
      value: assets,
      delta: profile.assetsDelta,
      polarity: "risk",
    },
    {
      id: "recovery",
      zh: "恢复进度",
      en: "Recovery Progress",
      value: recovery,
      suffix: "%",
      delta: profile.recoveryDelta,
      deltaSuffix: "%",
      polarity: "recovery",
    },
  ]

  const riskWeight: DistributionSlice[] = RISK_WEIGHT_BY_RANGE[range].map((slice) => ({
    ...slice,
    color: DOMAIN_COLOR[slice.id] ?? "#64748b",
  }))

  const funnelIds = ["open", "analyzed", "mitigating", "recovering", "resolved"] as const
  const funnelLabels = [
    { zh: "待处理", en: "Open" },
    { zh: "已分析", en: "Analyzed" },
    { zh: "处置中", en: "Mitigating" },
    { zh: "恢复中", en: "Recovering" },
    { zh: "已恢复", en: "Resolved" },
  ]
  const funnelCounts = blendFunnel(liveFunnel(items), profile.funnel)
  const funnel: FunnelStage[] = funnelIds.map((id, index) => ({
    id,
    zh: funnelLabels[index]!.zh,
    en: funnelLabels[index]!.en,
    count: funnelCounts[index] ?? 0,
  }))

  const trend: TrendPoint[] = profile.trendLabels.map((label, index) => ({
    label,
    open: profile.openTrend[index] ?? 0,
    p1: profile.p1Trend[index] ?? 0,
    recovered: profile.recoveredTrend[index] ?? 0,
  }))

  return {
    range,
    metrics,
    trend,
    riskWeight,
    funnel,
    insight: { zh: profile.insightZh, en: profile.insightEn },
  }
}

export function trendSeriesMeta(key: TrendSeriesKey) {
  if (key === "open") return { zh: "当前事故", en: "Open Incidents", color: "#2563eb" }
  if (key === "p1") return { zh: "P1 事故", en: "P1 Incidents", color: "#e53935" }
  return { zh: "已恢复", en: "Recovered Incidents", color: "#16a34a" }
}
