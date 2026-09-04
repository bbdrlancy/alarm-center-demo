/** Incident Portfolio / Digital Twin revision. Tell the assistant “回退到 DTn” to restore. */
export const DIGITAL_TWIN_VERSION = "DT8"

export const DIGITAL_TWIN_REVISION_LOG = [
  { id: "DT1", note: "浅色 SVG 流程图" },
  { id: "DT2", note: "深色科技风 2.5D，等距方块 + 动线" },
  { id: "DT3", note: "Three.js 立柱三维场景" },
  { id: "DT4", note: "浅色二维分区拓扑，无动线" },
  { id: "DT5", note: "深色科技风 + 二维设备图标 + 动线（动线在图层下方）" },
  { id: "DT6", note: "DT5 基础上将动线提到最前层" },
  { id: "DT7", note: "报警级别配色固定：P1 红 / P2 橙；不再随场景域颜色变化" },
  { id: "DT8", note: "Recommended Actions 当前场景卡片高亮加强（色条 + CURRENT 标签 + 其余降对比）" },
] as const
