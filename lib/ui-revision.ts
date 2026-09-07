/** Incident Portfolio / Digital Twin revision. Tell the assistant “回退到 DTn” to restore. */
export const DIGITAL_TWIN_VERSION = "DT18"

export const DIGITAL_TWIN_REVISION_LOG = [
  { id: "DT1", note: "浅色 SVG 流程图" },
  { id: "DT2", note: "深色科技风 2.5D，等距方块 + 动线" },
  { id: "DT3", note: "Three.js 立柱三维场景" },
  { id: "DT4", note: "浅色二维分区拓扑，无动线" },
  { id: "DT5", note: "深色科技风 + 二维设备图标 + 动线（动线在图层下方）" },
  { id: "DT6", note: "DT5 基础上将动线提到最前层" },
  { id: "DT7", note: "报警级别配色固定：P1 红 / P2 橙；不再随场景域颜色变化" },
  { id: "DT8", note: "Recommended Actions 当前场景卡片高亮加强（色条 + CURRENT 标签 + 其余降对比）" },
  { id: "DT9", note: "菜单改为自动分析；去掉本页回答；告警收敛漏斗改为左右分列清单" },
  { id: "DT10", note: "收敛漏斗：左全量告警 / 中规则下拉聚合 / 右最终根因；四场景告警时序与角色对齐" },
  { id: "DT11", note: "告警收敛改为可解释流图：Sankey + Top3 规则展开 + 多对一归并 + Explain Why 证据" },
  { id: "DT12", note: "收敛数字可下钻：右侧抽屉追溯 Raw / 聚合组 / 规则详情 / Explain Why 证据树" },
  { id: "DT13", note: "Alarm Convergence Workspace：横向 Pulse Flow + 页内 Event Grid + 规则下移，去掉抽屉" },
  { id: "DT14", note: "事件列表与 Affected Events 增加白话说明，方便非专业人士理解告警码" },
  { id: "DT15", note: "影响链路改为数字孪生图叠加：同风格拓扑上标记根因、受影响节点与传播路径" },
  { id: "DT16", note: "RCA 顶部融合为 Incident Overview：KPI + 传播链 + 证据卡 + 事故故事时间线" },
  { id: "DT17", note: "根因路径恢复数字孪生叠加风格：跳数条 + 拓扑标注传播链路" },
  { id: "DT18", note: "去掉路径跳数框图；Overview 拆成根因汇总+建议行动；故事时间线提前" },
] as const
