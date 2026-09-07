export type DemoStep = {
  id: string
  label: string
  subtitle: string
  href: string
  scrollTo?: string
  durationMs: number
}

/** 客户演示自动播放流程 */
export const demoSteps: DemoStep[] = [
  {
    id: "ups-fault",
    label: "UPS 故障",
    subtitle: "发生了什么？电池内阻异常升高",
    href: "/",
    scrollTo: "incident-overview",
    durationMs: 5000,
  },
  {
    id: "pdu-loss",
    label: "PDU 失电",
    subtitle: "故障沿供电链传播",
    href: "/",
    scrollTo: "fault-propagation",
    durationMs: 4500,
  },
  {
    id: "gpu-offline",
    label: "GPU 离线",
    subtitle: "336 卡计算资源受影响",
    href: "/",
    scrollTo: "impact-analysis",
    durationMs: 4500,
  },
  {
    id: "service-impact",
    label: "业务中断",
    subtitle: "AI 训练任务 SLA 违约",
    href: "/",
    scrollTo: "impact-analysis",
    durationMs: 4500,
  },
  {
    id: "rca",
    label: "根因调查 RCA",
    subtitle: "1,248 条告警 → 1 条根因",
    href: "/rca",
    scrollTo: "incident-overview",
    durationMs: 6000,
  },
  {
    id: "auto-report",
    label: "自动报告",
    subtitle: "一键生成事故快报",
    href: "/",
    scrollTo: "incident-report",
    durationMs: 5000,
  },
  {
    id: "value",
    label: "价值展示",
    subtitle: "节约时间 · 降低风险 · ROI",
    href: "/business-dashboard",
    scrollTo: "executive-summary-hero",
    durationMs: 6000,
  },
]
