import type { AlarmSeverity, AlarmStatus, RawAlarm } from "@/lib/incident-data"
import type { ScenarioKey, ScenarioModel } from "@/data/scenarios"

export type AlarmRole = "root-symptom" | "cascade" | "secondary" | "noise"

export type TaggedAlarm = RawAlarm & {
  role: AlarmRole
  family: string
  hop: number
  zone: string
}

export type ConvergenceItem = {
  id: string
  time: string
  title: string
  detail: string
  device: string
  severity: AlarmSeverity
  status?: AlarmStatus
  source?: string
  hint?: string
  merged?: number
  members?: string[]
}

export const ROLE_HINT: Record<AlarmRole, string> = {
  "root-symptom": "源头症状",
  cascade: "下游级联",
  secondary: "伴随现象",
  noise: "噪声 / 闪断",
}

const SEVERITY_RANK: AlarmSeverity[] = ["Critical", "Major", "Minor", "Warning"]

function worstSeverity(list: TaggedAlarm[]): AlarmSeverity {
  return SEVERITY_RANK.find((severity) => list.some((alarm) => alarm.severity === severity)) ?? list[0]!.severity
}

export type ConvergenceRule = {
  key: string
  zh: string
  en: string
  how: string
}

export const CONVERGENCE_RULES: ConvergenceRule[] = [
  {
    key: "noise",
    zh: "噪声抑制",
    en: "Noise Reduction",
    how: "去掉 Warning / 闪断，并将同一告警码在兄弟设备上的风暴折叠为 1 条代表。",
  },
  {
    key: "topology",
    zh: "拓扑关联",
    en: "Topology Correlation",
    how: "沿供电 / 制冷 / 存储 / 网络依赖链保留因果跳数上的告警，并按跳数归并为链路节点。",
  },
  {
    key: "spatial",
    zh: "空间关联",
    en: "Spatial Correlation",
    how: "按机房区域 / 机柜簇聚合，同一空间内的同源症状合并。",
  },
  {
    key: "temporal",
    zh: "时间关联",
    en: "Temporal Correlation",
    how: "按级联时间窗对齐：源头窗口 → 下游窗口，窗口内告警归并。",
  },
  {
    key: "pattern",
    zh: "模式识别",
    en: "Pattern Matching",
    how: "匹配历史故障指纹：根因设备症状为一组，下游业务影响为另一组。",
  },
  {
    key: "cluster",
    zh: "智能聚类",
    en: "Symptom Clustering",
    how: "按设备族 + 告警码聚类，相同症状合并为事件组。",
  },
  {
    key: "causal",
    zh: "因果推理",
    en: "Causal RCA",
    how: "最早出现在拓扑源头、且能解释全部下游级联的告警，定位为唯一根因。",
  },
]

function pad(n: number, size = 2) {
  return String(n).padStart(size, "0")
}

function siblings(
  count: number,
  build: (i: number) => TaggedAlarm,
): TaggedAlarm[] {
  return Array.from({ length: count }, (_, i) => build(i))
}

function powerAlarms(): TaggedAlarm[] {
  const ups: TaggedAlarm[] = [
    {
      id: "A-P-001",
      timestamp: "03:00:12.481",
      device: "UPS-A01",
      code: "UPS-BATT-CRIT-014",
      message: "电池内阻 5 分钟内上升 34%，超过临界阈值",
      severity: "Critical",
      status: "Active",
      source: "Power Monitoring",
      role: "root-symptom",
      family: "UPS",
      hop: 0,
      zone: "Power Zone A",
    },
    {
      id: "A-P-002",
      timestamp: "03:00:13.902",
      device: "UPS-A01",
      code: "UPS-BYP-FAIL-021",
      message: "静态旁路切换失败，UPS 无法维持输出",
      severity: "Critical",
      status: "Correlated",
      source: "Power Monitoring",
      role: "root-symptom",
      family: "UPS",
      hop: 0,
      zone: "Power Zone A",
    },
    {
      id: "A-P-003",
      timestamp: "03:00:48.117",
      device: "UPS-A01",
      code: "UPS-VOUT-LOW-009",
      message: "电池耗尽后输出电压 400V → 210V",
      severity: "Critical",
      status: "Correlated",
      source: "Power Monitoring",
      role: "root-symptom",
      family: "UPS",
      hop: 0,
      zone: "Power Zone A",
    },
  ]

  const pdus = siblings(4, (i) => ({
    id: `A-P-1${pad(i + 1)}`,
    timestamp: `03:01:${pad(30 + i)}.${680 + i * 80}`,
    device: `PDU-A${pad(i + 1)}`,
    code: "PDU-INPUT-LOSS-003",
    message: "A 路输入失电（UPS 输出跌落后配电失电）",
    severity: "Major" as const,
    status: (i === 0 ? "Correlated" : "Suppressed") as AlarmStatus,
    source: "Facility DCIM",
    role: "cascade" as const,
    family: "PDU",
    hop: 1,
    zone: "Power Zone A",
  }))

  const racks = siblings(12, (i) => ({
    id: `A-P-2${pad(i + 1)}`,
    timestamp: `03:02:${pad(15 + i)}.${226 + i * 12}`,
    device: `Rack-A${pad(i + 1)}`,
    code: "RACK-PWR-DOWN-011",
    message: "机架 PDU 输出去电（配电中断后）",
    severity: "Major" as const,
    status: (i === 0 ? "Correlated" : "Suppressed") as AlarmStatus,
    source: "Facility DCIM",
    role: "cascade" as const,
    family: "RACK",
    hop: 2,
    zone: "IT Hall A",
  }))

  const gpus = siblings(12, (i) => ({
    id: `A-P-3${pad(i + 1)}`,
    timestamp: `03:03:${pad(40 + i)}.${338 + i * 9}`,
    device: `gpu-a01-n${pad(i + 1)}`,
    code: "SRV-UNREACH-002",
    message: "ICMP + IPMI 双通道超时，服务器离线（机架断电后）",
    severity: "Critical" as const,
    status: (i < 2 ? "Correlated" : "Suppressed") as AlarmStatus,
    source: "Infra Monitoring",
    role: "cascade" as const,
    family: "GPU",
    hop: 3,
    zone: "IT Hall A",
  }))

  const extras: TaggedAlarm[] = [
    {
      id: "A-P-040",
      timestamp: "03:02:40.512",
      device: "Rack-A07",
      code: "RACK-TEMP-HIGH-006",
      message: "进风温度升至 31°C（机架断电后风扇停转的伴随现象，非制冷故障）",
      severity: "Minor",
      status: "Suppressed",
      source: "Environmental",
      role: "secondary",
      family: "RACK-ENV",
      hop: 2,
      zone: "IT Hall A",
    },
    {
      id: "A-P-041",
      timestamp: "03:03:55.640",
      device: "gpu-a01-n01",
      code: "GPU-NVLINK-DOWN-008",
      message: "NVLink 分区丢失（同机架服务器掉电后的计算互联症状）",
      severity: "Major",
      status: "Suppressed",
      source: "GPU Telemetry",
      role: "cascade",
      family: "GPU",
      hop: 3,
      zone: "IT Hall A",
    },
    {
      id: "A-P-042",
      timestamp: "03:04:02.203",
      device: "tor-sw-a01",
      code: "NET-PORT-DOWN-004",
      message: "接入端口 down（服务器掉电导致链路丢失，非网络根因）",
      severity: "Major",
      status: "Suppressed",
      source: "Network NMS",
      role: "secondary",
      family: "TOR",
      hop: 3,
      zone: "IT Hall A",
    },
    {
      id: "A-P-043",
      timestamp: "03:04:08.771",
      device: "k8s-node-a12",
      code: "K8S-NODE-NOTREADY-005",
      message: "Kubelet NotReady，42 个 pod 被驱逐（计算节点掉电后）",
      severity: "Major",
      status: "Suppressed",
      source: "K8s Control Plane",
      role: "cascade",
      family: "K8S",
      hop: 4,
      zone: "Business",
    },
    {
      id: "A-P-044",
      timestamp: "03:04:18.418",
      device: "ai-train-svc",
      code: "SVC-DEGRADED-001",
      message: "训练吞吐跌至 12%（GPU 集群离线后）",
      severity: "Critical",
      status: "Correlated",
      source: "APM",
      role: "cascade",
      family: "SVC",
      hop: 4,
      zone: "Business",
    },
    {
      id: "A-P-045",
      timestamp: "03:04:19.002",
      device: "ai-train-svc",
      code: "JOB-CKPT-FAIL-007",
      message: "分布式作业 checkpoint 失败（rank 0-83，计算侧中断）",
      severity: "Major",
      status: "Suppressed",
      source: "APM",
      role: "cascade",
      family: "SVC",
      hop: 4,
      zone: "Business",
    },
    {
      id: "A-P-046",
      timestamp: "03:04:12.559",
      device: "storage-a01",
      code: "STG-LATENCY-HIGH-012",
      message: "NVMe 读延迟 48ms（计算节点掉线后的存储侧伴随，非存储故障）",
      severity: "Minor",
      status: "Suppressed",
      source: "Storage Array",
      role: "secondary",
      family: "STG",
      hop: 4,
      zone: "Storage",
    },
    {
      id: "A-P-047",
      timestamp: "03:04:28.117",
      device: "cooling-crah-a03",
      code: "COOL-FAN-WARN-010",
      message: "CRAH 风扇降速（IT 负载消失后的正常回落，非制冷故障）",
      severity: "Warning",
      status: "Suppressed",
      source: "Environmental",
      role: "noise",
      family: "COOL",
      hop: 4,
      zone: "Cooling",
    },
    {
      id: "A-P-048",
      timestamp: "03:04:20.884",
      device: "ai-train-svc",
      code: "SLA-BREACH-001",
      message: "作业可用性 < 99.5%，SLA 违约（训练服务中断）",
      severity: "Critical",
      status: "Active",
      source: "SLA 监控",
      role: "cascade",
      family: "SVC",
      hop: 4,
      zone: "Business",
    },
  ]

  return [...ups, ...pdus, ...racks, ...gpus, ...extras].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

function coolingAlarms(): TaggedAlarm[] {
  const alarms: TaggedAlarm[] = [
    {
      id: "A-C-001",
      timestamp: "05:42:08.102",
      device: "CRAC-A02",
      code: "CRAC-COMP-STOP-001",
      message: "压缩机电流异常，冷量输出归零",
      severity: "Critical",
      status: "Active",
      source: "Environmental",
      role: "root-symptom",
      family: "CRAH",
      hop: 0,
      zone: "Cooling Zone A",
    },
    {
      id: "A-C-002",
      timestamp: "05:42:09.440",
      device: "CRAC-A02",
      code: "CRAC-FLOW-LOW-004",
      message: "冷冻水流量低于设定值",
      severity: "Major",
      status: "Correlated",
      source: "Environmental",
      role: "root-symptom",
      family: "CRAH",
      hop: 0,
      zone: "Cooling Zone A",
    },
    {
      id: "A-C-003",
      timestamp: "05:42:11.009",
      device: "Pump-01",
      code: "PUMP-VIB-WARN-008",
      message: "水泵振动瞬态，4 秒内恢复（与压缩机停机无关的闪断噪声）",
      severity: "Warning",
      status: "Suppressed",
      source: "Facility DCIM",
      role: "noise",
      family: "PUMP",
      hop: 0,
      zone: "Cooling Zone A",
    },
    {
      id: "A-C-004",
      timestamp: "05:43:20.221",
      device: "Cold-Aisle-A",
      code: "AISLE-INLET-HIGH-002",
      message: "冷通道进风 24°C → 38°C（CRAC 停机约 1 分钟后的热积累）",
      severity: "Critical",
      status: "Correlated",
      source: "Environmental",
      role: "cascade",
      family: "AISLE",
      hop: 1,
      zone: "IT Hall A",
    },
    ...siblings(16, (i) => ({
      id: `A-C-1${pad(i + 1)}`,
      timestamp: `05:44:${pad(40 + (i % 20))}.${100 + i}`,
      device: `Rack-B${pad(i + 1)}`,
      code: "RACK-TEMP-HIGH-006",
      message: "机架进风超过 38°C（冷通道失温后）",
      severity: "Critical" as const,
      status: (i < 2 ? "Correlated" : "Suppressed") as AlarmStatus,
      source: "Environmental",
      role: "cascade" as const,
      family: "RACK",
      hop: 2,
      zone: "IT Hall A",
    })),
    ...siblings(8, (i) => ({
      id: `A-C-2${pad(i + 1)}`,
      timestamp: `05:46:${pad(8 + i)}.${80 + i}`,
      device: `gpu-b02-n${pad(i + 1)}`,
      code: "GPU-THERMAL-THRT-003",
      message: "GPU 触发 thermal throttle（机架超温后的降频保护）",
      severity: "Major" as const,
      status: (i === 0 ? "Correlated" : "Suppressed") as AlarmStatus,
      source: "GPU Telemetry",
      role: "cascade" as const,
      family: "GPU",
      hop: 3,
      zone: "IT Hall A",
    })),
    {
      id: "A-C-301",
      timestamp: "05:47:30.018",
      device: "train-cluster-b",
      code: "JOB-PAUSE-001",
      message: "Training Cluster B 作业因 GPU 超温自动暂停",
      severity: "Critical",
      status: "Active",
      source: "APM",
      role: "cascade",
      family: "SVC",
      hop: 4,
      zone: "Business",
    },
  ]
  return alarms.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

function storageAlarms(): TaggedAlarm[] {
  const alarms: TaggedAlarm[] = [
    {
      id: "A-S-001",
      timestamp: "08:15:22.014",
      device: "Storage-Ctrl-A",
      code: "SAN-HB-LOSS-001",
      message: "双控心跳丢失，failover 未完成",
      severity: "Major",
      status: "Active",
      source: "Storage Array",
      role: "root-symptom",
      family: "CTRL",
      hop: 0,
      zone: "SAN Fabric 2",
    },
    {
      id: "A-S-002",
      timestamp: "08:15:23.880",
      device: "Storage-Ctrl-B",
      code: "SAN-HB-LOSS-001",
      message: "对端控制器心跳超时（同一故障的对端视角）",
      severity: "Major",
      status: "Correlated",
      source: "Storage Array",
      role: "root-symptom",
      family: "CTRL",
      hop: 0,
      zone: "SAN Fabric 2",
    },
    {
      id: "A-S-003",
      timestamp: "08:16:02.010",
      device: "SAN-port-09",
      code: "SAN-CRC-WARN-003",
      message: "CRC 误码突发后恢复（闪断噪声）",
      severity: "Warning",
      status: "Suppressed",
      source: "Storage Array",
      role: "noise",
      family: "PORT",
      hop: 1,
      zone: "SAN Fabric 2",
    },
    ...siblings(8, (i) => ({
      id: `A-S-1${pad(i + 1)}`,
      timestamp: `08:16:${pad(38 + i)}.${40 + i}`,
      device: `SAN-port-${pad(i + 1)}`,
      code: "SAN-RETRY-STORM-012",
      message: "Fabric Zone 2 I/O 重试风暴",
      severity: "Major" as const,
      status: (i < 2 ? "Correlated" : "Suppressed") as AlarmStatus,
      source: "Storage Array",
      role: "cascade" as const,
      family: "PORT",
      hop: 1,
      zone: "SAN Fabric 2",
    })),
    {
      id: "A-S-201",
      timestamp: "08:18:05.331",
      device: "Dataset-Vol-01",
      code: "VOL-DEGRADED-004",
      message: "120 TB 数据卷进入 degraded",
      severity: "Major",
      status: "Correlated",
      source: "Storage Array",
      role: "cascade",
      family: "VOL",
      hop: 2,
      zone: "Storage Pool",
    },
    {
      id: "A-S-202",
      timestamp: "08:19:50.102",
      device: "training-job-001",
      code: "JOB-CKPT-FAIL-007",
      message: "训练作业 checkpoint 中断",
      severity: "Major",
      status: "Correlated",
      source: "APM",
      role: "cascade",
      family: "JOB",
      hop: 3,
      zone: "Business",
    },
    {
      id: "A-S-203",
      timestamp: "08:21:10.554",
      device: "dataset-svc",
      code: "SLA-BREACH-001",
      message: "Dataset Service 读写 SLA 违约（卷降级后的业务结果）",
      severity: "Critical",
      status: "Active",
      source: "SLA 监控",
      role: "cascade",
      family: "SVC",
      hop: 4,
      zone: "Business",
    },
    {
      id: "A-S-204",
      timestamp: "08:18:22.880",
      device: "gpu-train-hba-03",
      code: "HBA-PATH-TIMEOUT-009",
      message: "主机 HBA 路径超时（存储侧故障的计算节点伴随，非计算根因）",
      severity: "Minor",
      status: "Suppressed",
      source: "Infra Monitoring",
      role: "secondary",
      family: "HBA",
      hop: 2,
      zone: "IT Hall A",
    },
  ]
  return alarms.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

function networkAlarms(): TaggedAlarm[] {
  const alarms: TaggedAlarm[] = [
    {
      id: "A-N-001",
      timestamp: "11:08:15.008",
      device: "SW-CORE-02",
      code: "SW-CTRL-DOWN-001",
      message: "核心交换机控制平面 unreachable",
      severity: "Major",
      status: "Active",
      source: "Network NMS",
      role: "root-symptom",
      family: "CORE",
      hop: 0,
      zone: "Network Core",
    },
    {
      id: "A-N-002",
      timestamp: "11:08:18.700",
      device: "tor-sw-b03",
      code: "NET-CRC-WARN-006",
      message: "无关机柜接入端口 CRC 告警随后清除（闪断，不在本次故障路径）",
      severity: "Warning",
      status: "Suppressed",
      source: "Network NMS",
      role: "noise",
      family: "TOR",
      hop: 2,
      zone: "IT Hall B",
    },
    {
      id: "A-N-003",
      timestamp: "11:08:45.220",
      device: "SW-CORE-02",
      code: "BGP-FLAP-009",
      message: "与汇聚层 BGP 会话震荡（控制面丢失后的路由症状）",
      severity: "Major",
      status: "Correlated",
      source: "Network NMS",
      role: "root-symptom",
      family: "CORE",
      hop: 0,
      zone: "Network Core",
    },
    ...siblings(4, (i) => ({
      id: `A-N-1${pad(i + 1)}`,
      timestamp: `11:08:${pad(46 + i)}.${10 + i}`,
      device: `SW-AGG-0${i + 1}`,
      code: "BGP-PEER-DOWN-002",
      message: "汇聚交换机 BGP 邻居断开（核心控制面丢失导致）",
      severity: "Major" as const,
      status: (i === 0 ? "Correlated" : "Suppressed") as AlarmStatus,
      source: "Network NMS",
      role: "cascade" as const,
      family: "AGG",
      hop: 1,
      zone: "Network Core",
    })),
    ...siblings(4, (i) => ({
      id: `A-N-1${pad(i + 5)}`,
      timestamp: `11:09:${pad(8 + i)}.${20 + i}`,
      device: `tor-sw-a0${i + 1}`,
      code: "TOR-UPLINK-DOWN-003",
      message: "ToR 上联中断（汇聚层邻居丢失后的接入层级联）",
      severity: "Major" as const,
      status: (i === 0 ? "Correlated" : "Suppressed") as AlarmStatus,
      source: "Network NMS",
      role: "cascade" as const,
      family: "TOR",
      hop: 2,
      zone: "IT Hall A",
    })),
    ...siblings(12, (i) => ({
      id: `A-N-2${pad(i + 1)}`,
      timestamp: `11:09:${pad(28 + i)}.${50 + i}`,
      device: `gpu-net-n${pad(i + 1)}`,
      code: "NET-ISOLATED-004",
      message: "东西向路径丢失，服务器网络隔离（ToR 上联中断后）",
      severity: "Major" as const,
      status: (i < 2 ? "Correlated" : "Suppressed") as AlarmStatus,
      source: "Infra Monitoring",
      role: "cascade" as const,
      family: "GPU",
      hop: 3,
      zone: "IT Hall A",
    })),
    {
      id: "A-N-301",
      timestamp: "11:10:20.441",
      device: "AI-Gateway",
      code: "GW-HTTP-503-001",
      message: "AI Gateway API 503 错误率上升（后端 GPU 集群隔离后）",
      severity: "Major",
      status: "Correlated",
      source: "APM",
      role: "cascade",
      family: "GW",
      hop: 4,
      zone: "Business",
    },
    {
      id: "A-N-302",
      timestamp: "11:12:00.018",
      device: "SW-CORE-02",
      code: "PATH-RESTORE-001",
      message: "冗余路径接管，服务逐步恢复（恢复事件，不是新的根因）",
      severity: "Minor",
      status: "Cleared",
      source: "Network NMS",
      role: "secondary",
      family: "CORE",
      hop: 0,
      zone: "Network Core",
    },
  ]
  return alarms.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

const catalogs: Record<ScenarioKey, () => TaggedAlarm[]> = {
  power: powerAlarms,
  cooling: coolingAlarms,
  storage: storageAlarms,
  network: networkAlarms,
}

export function getScenarioRawAlarms(scenario: ScenarioModel): TaggedAlarm[] {
  return catalogs[scenario.id]()
}

function toItem(alarm: TaggedAlarm, extra?: Partial<ConvergenceItem>): ConvergenceItem {
  return {
    id: alarm.id,
    time: alarm.timestamp,
    title: alarm.code,
    detail: alarm.message,
    device: alarm.device,
    severity: alarm.severity,
    status: alarm.status,
    source: alarm.source,
    hint: ROLE_HINT[alarm.role],
    ...extra,
  }
}

export function toRawItems(alarms: TaggedAlarm[]): ConvergenceItem[] {
  return alarms.map((alarm) => toItem(alarm))
}

function collapseStorm(alarms: TaggedAlarm[]): ConvergenceItem[] {
  const groups = new Map<string, TaggedAlarm[]>()
  for (const alarm of alarms) {
    const key = `${alarm.family}::${alarm.code}`
    const list = groups.get(key) ?? []
    list.push(alarm)
    groups.set(key, list)
  }
  return [...groups.values()]
    .sort((a, b) => a[0]!.timestamp.localeCompare(b[0]!.timestamp))
    .map((list) => {
      const head = list[0]!
      const devices = [...new Set(list.map((a) => a.device))]
      return toItem(head, {
        id: `grp-${head.family}-${head.code}`,
        device: devices.length > 1 ? `${devices[0]} ~ ${devices[devices.length - 1]}` : head.device,
        hint: list.length > 1 ? `${ROLE_HINT[head.role]} · 同码风暴` : ROLE_HINT[head.role],
        merged: list.length,
        members: list.map((a) => a.id),
      })
    })
}

function applyNoise(alarms: TaggedAlarm[]): ConvergenceItem[] {
  const kept = alarms.filter((a) => a.role !== "noise" && a.severity !== "Warning")
  return collapseStorm(kept)
}

function applyTopology(alarms: TaggedAlarm[]): ConvergenceItem[] {
  const kept = alarms.filter((a) => a.role === "root-symptom" || a.role === "cascade")
  const byHop = new Map<number, TaggedAlarm[]>()
  for (const alarm of kept) {
    const list = byHop.get(alarm.hop) ?? []
    list.push(alarm)
    byHop.set(alarm.hop, list)
  }
  const hopLabel: Record<number, string> = {
    0: "源头设备",
    1: "一跳下游",
    2: "二跳下游",
    3: "三跳下游",
    4: "业务层",
  }
  return [...byHop.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hop, list]) => {
      const head = list[0]!
      const families = [...new Set(list.map((a) => a.family))]
      return {
        id: `hop-${hop}`,
        time: head.timestamp,
        title: hopLabel[hop] ?? `Hop ${hop}`,
        detail: `${families.join(" / ")} · ${list.length} 条告警处于同一依赖跳数`,
        device: [...new Set(list.map((a) => a.device))].slice(0, 3).join("、") + (list.length > 3 ? "…" : ""),
        severity: worstSeverity(list),
        hint: hopLabel[hop],
        merged: list.length,
        members: list.map((a) => a.id),
      }
    })
}

function applySpatial(alarms: TaggedAlarm[]): ConvergenceItem[] {
  const kept = alarms.filter((a) => a.role !== "noise")
  const byZone = new Map<string, TaggedAlarm[]>()
  for (const alarm of kept) {
    const list = byZone.get(alarm.zone) ?? []
    list.push(alarm)
    byZone.set(alarm.zone, list)
  }
  return [...byZone.entries()]
    .sort((a, b) => a[1][0]!.timestamp.localeCompare(b[1][0]!.timestamp))
    .map(([zone, list]) => {
      const head = list[0]!
      return {
        id: `zone-${zone}`,
        time: head.timestamp,
        title: zone,
        detail: `${[...new Set(list.map((a) => a.family))].join("、")} 在同一空间共 ${list.length} 条告警`,
        device: zone,
        severity: worstSeverity(list),
        hint: "空间簇",
        merged: list.length,
        members: list.map((a) => a.id),
      }
    })
}

function minuteKey(timestamp: string) {
  return timestamp.slice(0, 5)
}

function applyTemporal(alarms: TaggedAlarm[]): ConvergenceItem[] {
  const kept = alarms.filter((a) => a.role !== "noise")
  const byMinute = new Map<string, TaggedAlarm[]>()
  for (const alarm of kept) {
    const key = minuteKey(alarm.timestamp)
    const list = byMinute.get(key) ?? []
    list.push(alarm)
    byMinute.set(key, list)
  }
  return [...byMinute.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([minute, list]) => {
      const head = list[0]!
      const hops = [...new Set(list.map((a) => a.hop))].sort()
      return {
        id: `tw-${minute}`,
        time: `${minute}:00`,
        title: `${minute} 时间窗`,
        detail: `跳数 ${hops.join("→")} · ${[...new Set(list.map((a) => a.family))].join("、")}`,
        device: `${list.length} 条告警`,
        severity: worstSeverity(list),
        hint: hops[0] === 0 ? "源头窗口" : "级联窗口",
        merged: list.length,
        members: list.map((a) => a.id),
      }
    })
}

function applyPattern(alarms: TaggedAlarm[]): ConvergenceItem[] {
  const root = alarms.filter((a) => a.role === "root-symptom")
  const cascade = alarms.filter((a) => a.role === "cascade")
  const leftover = alarms.filter((a) => a.role === "secondary")
  const items: ConvergenceItem[] = []
  if (root.length) {
    items.push({
      id: "pattern-root",
      time: root[0]!.timestamp,
      title: "源头故障指纹",
      detail: `${root.map((a) => a.code).join(" + ")} 匹配历史根因模式`,
      device: root[0]!.device,
      severity: worstSeverity(root),
      hint: "根因指纹",
      merged: root.length,
      members: root.map((a) => a.id),
    })
  }
  if (cascade.length) {
    items.push({
      id: "pattern-cascade",
      time: cascade[0]!.timestamp,
      title: "下游级联指纹",
      detail: "与源头时间顺序一致的依赖链传播模式",
      device: [...new Set(cascade.map((a) => a.family))].join(" → "),
      severity: worstSeverity(cascade),
      hint: "级联指纹",
      merged: cascade.length,
      members: cascade.map((a) => a.id),
    })
  }
  if (leftover.length) {
    items.push({
      id: "pattern-other",
      time: leftover[0]!.timestamp,
      title: "未匹配指纹",
      detail: "伴随现象，不作为独立故障模式",
      device: leftover.map((a) => a.device).join("、"),
      severity: "Minor",
      hint: "伴随 / 恢复",
      merged: leftover.length,
      members: leftover.map((a) => a.id),
    })
  }
  return items
}

function applyCluster(alarms: TaggedAlarm[]): ConvergenceItem[] {
  return collapseStorm(alarms.filter((a) => a.role !== "noise"))
}

function applyCausal(alarms: TaggedAlarm[], scenario: ScenarioModel): ConvergenceItem[] {
  const rootAlarms = alarms.filter((a) => a.role === "root-symptom").sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const first = rootAlarms[0]
  const cascadeCount = alarms.filter((a) => a.role === "cascade").length
  return [
    {
      id: `causal-${scenario.incident.id}`,
      time: first?.timestamp ?? scenario.incident.startTime,
      title: scenario.incident.rootCause,
      detail: `${scenario.incident.rootCauseZh}。最早源头症状 ${first?.device ?? ""} / ${first?.code ?? ""} 可解释下游 ${cascadeCount} 条级联告警；噪声与伴随现象不计入根因。`,
      device: first?.device ?? scenario.digitalTwin.rootCauseLabel,
      severity: scenario.incident.severity === "P1" ? "Critical" : "Major",
      hint: "因果根因",
      merged: alarms.length,
      members: rootAlarms.map((a) => a.id),
    },
  ]
}

export function applyConvergenceRule(
  scenario: ScenarioModel,
  ruleKey: string,
): ConvergenceItem[] {
  const alarms = getScenarioRawAlarms(scenario)
  switch (ruleKey) {
    case "noise":
      return applyNoise(alarms)
    case "topology":
      return applyTopology(alarms)
    case "spatial":
      return applySpatial(alarms)
    case "temporal":
      return applyTemporal(alarms)
    case "pattern":
      return applyPattern(alarms)
    case "cluster":
      return applyCluster(alarms)
    case "causal":
      return applyCausal(alarms, scenario)
    default:
      return alarms.map((a) => toItem(a))
  }
}

export function getRootCauseItem(scenario: ScenarioModel): ConvergenceItem {
  return applyCausal(getScenarioRawAlarms(scenario), scenario)[0]!
}
