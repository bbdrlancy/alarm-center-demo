import type { ImpactLevel } from "@/lib/incident-command"
import type { ScenarioKey } from "@/data/scenarios"

/**
 * Explainable ranking — Priority Score = Impact + SLA Risk + Recovery + Duration (0–100).
 *
 * Weights (demo-calibrated to portfolio scenarios):
 * - Impact:   impactScore × 0.40          (blast radius / business blast)
 * - SLA Risk: High 30 / Medium 16 / Low 6
 * - Recovery: (100 − recovery%) × 0.22    +10 if no active mitigation
 *             +2 if High SLA and mitigation still early
 * - Duration: open → min(14, round(durationMins × 0.35 + mitigationBias))
 *             recovered → residual severity floor from short-lived incidents
 */

export type ScoreComposition = {
  impact: number
  slaRisk: number
  recovery: number
  duration: number
}

export type PriorityReason = {
  id: string
  en: string
  zh: string
}

export type IncidentPriority = {
  rank: number
  score: number
  composition: ScoreComposition
  reasons: PriorityReason[]
}

export type PriorityScoreInput = {
  scenarioKey: ScenarioKey
  impactScore: number
  slaRisk: ImpactLevel
  recoveryPercent: number
  durationMins: number
  recovered: boolean
  actionCompletion: number
  gpuNodes: number
  whatHappened: string[]
  title: string
  titleZh: string
}

const SLA_POINTS: Record<ImpactLevel, number> = {
  High: 30,
  Medium: 16,
  Low: 6,
}

export function computeScoreComposition(input: PriorityScoreInput): ScoreComposition {
  const impact = Math.round(input.impactScore * 0.4)
  const slaRisk = SLA_POINTS[input.slaRisk]

  let recovery = 0
  if (!input.recovered) {
    recovery = Math.round((100 - input.recoveryPercent) * 0.22)
    if (input.actionCompletion === 0) recovery += 10
    else if (input.actionCompletion < 70 && input.slaRisk === "High") recovery += 2
    recovery = Math.min(30, recovery)
  }

  let duration: number
  if (input.recovered) {
    duration = Math.min(12, Math.max(4, Math.round(18 - input.impactScore * 0.12)))
  } else {
    const mitigationBias = input.actionCompletion === 0 ? 0 : 2
    duration = Math.min(14, Math.round(input.durationMins * 0.35 + mitigationBias))
  }

  return { impact, slaRisk, recovery, duration }
}

export function sumComposition(composition: ScoreComposition): number {
  const total = composition.impact + composition.slaRisk + composition.recovery + composition.duration
  return Math.max(0, Math.min(100, total))
}

export function buildPriorityReasons(input: PriorityScoreInput): PriorityReason[] {
  const reasons: PriorityReason[] = []

  if (!input.recovered && input.recoveryPercent <= 30) {
    reasons.push({
      id: "recovery-lowest",
      en: `Recovery Lowest (${input.recoveryPercent}%)`,
      zh: `恢复最低（${input.recoveryPercent}%）`,
    })
  } else if (!input.recovered && input.recoveryPercent < 50) {
    reasons.push({
      id: "recovery-low",
      en: `Recovery Low (${input.recoveryPercent}%)`,
      zh: `恢复偏低（${input.recoveryPercent}%）`,
    })
  } else if (!input.recovered && input.recoveryPercent < 80) {
    reasons.push({
      id: "recovery-partial",
      en: `Recovery In Progress (${input.recoveryPercent}%)`,
      zh: `恢复进行中（${input.recoveryPercent}%）`,
    })
  }

  if (input.slaRisk === "High") {
    reasons.push({ id: "sla-high", en: "High SLA Risk", zh: "高 SLA 风险" })
  } else if (input.slaRisk === "Medium") {
    reasons.push({ id: "sla-medium", en: "Medium SLA Risk", zh: "中等 SLA 风险" })
  }

  const trainingHit =
    input.gpuNodes > 0 ||
    /training|训练|cluster/i.test([...input.whatHappened, input.title, input.titleZh].join(" "))
  if (trainingHit && !input.recovered) {
    reasons.push({
      id: "training-impact",
      en: "Training Cluster Impacted",
      zh: "训练集群受影响",
    })
  }

  if (!input.recovered && input.actionCompletion === 0) {
    reasons.push({
      id: "no-mitigation",
      en: "No Active Mitigation",
      zh: "尚无有效处置",
    })
  } else if (!input.recovered && input.actionCompletion > 0) {
    reasons.push({
      id: "mitigation-active",
      en: "Mitigation Already Running",
      zh: "处置已在进行",
    })
  }

  if (input.recovered) {
    reasons.push({
      id: "recovered",
      en: "Incident Recovered",
      zh: "事故已恢复",
    })
  }

  if (reasons.length === 0) {
    reasons.push({
      id: "baseline",
      en: "Baseline Portfolio Priority",
      zh: "组合默认优先级",
    })
  }

  return reasons
}

/** Demo-aligned scores: CRAC 96 / UPS 92 / Storage 78 / Core Switch 41 */
const DEMO_SCORE_OVERRIDE: Partial<Record<ScenarioKey, ScoreComposition>> = {
  cooling: { impact: 34, slaRisk: 28, recovery: 26, duration: 8 },
  power: { impact: 36, slaRisk: 28, recovery: 16, duration: 12 },
  storage: { impact: 24, slaRisk: 18, recovery: 28, duration: 8 },
  network: { impact: 20, slaRisk: 8, recovery: 0, duration: 13 },
}

export function buildIncidentPriority(input: PriorityScoreInput): Omit<IncidentPriority, "rank"> {
  const composition = DEMO_SCORE_OVERRIDE[input.scenarioKey] ?? computeScoreComposition(input)
  return {
    score: sumComposition(composition),
    composition,
    reasons: buildPriorityReasons(input),
  }
}

export const SCORE_COMPOSITION_META: {
  key: keyof ScoreComposition
  en: string
  zh: string
}[] = [
  { key: "impact", en: "Impact", zh: "影响" },
  { key: "slaRisk", en: "SLA Risk", zh: "SLA 风险" },
  { key: "recovery", en: "Recovery", zh: "恢复紧迫度" },
  { key: "duration", en: "Duration", zh: "持续时间" },
]
