import type { ScenarioKey } from "@/data/scenarios"
import type { TaggedAlarm } from "@/lib/alarm-convergence"

/** Alarms that are not bound to any portfolio incident (INC-*). Visible in Event Exploration only. */
export const ORPHAN_INCIDENT_ID = "UNLINKED"
export const ORPHAN_INCIDENT_TITLE = "未关联事故"
export const ORPHAN_INCIDENT_TITLE_EN = "Unlinked Alarm"

export type OrphanAlarmBundle = {
  scenarioKey: ScenarioKey
  domain: string
  alarms: TaggedAlarm[]
}

/**
 * Standalone / stray alarms: real ops noise and one-offs that never became an incident.
 * Times intentionally sit outside the four demo incident windows.
 */
export function getOrphanAlarmBundles(): OrphanAlarmBundle[] {
  return [
    {
      scenarioKey: "power",
      domain: "Power",
      alarms: [
        {
          id: "A-O-P01",
          timestamp: "09:18:22.104",
          device: "UPS-B02",
          code: "UPS-BATT-WARN-003",
          message: "B 路电池自检阻抗偏高（+8%），未达 Critical，尚未立案",
          severity: "Warning",
          status: "Active",
          source: "Power Monitoring",
          role: "noise",
          family: "UPS-B",
          hop: 0,
          zone: "Power Room B",
        },
        {
          id: "A-O-P02",
          timestamp: "09:18:41.550",
          device: "UPS-B02",
          code: "UPS-SELFTEST-OK-001",
          message: "电池自检完成，结果可接受，告警自动恢复",
          severity: "Warning",
          status: "Cleared",
          source: "Power Monitoring",
          role: "noise",
          family: "UPS-B",
          hop: 0,
          zone: "Power Room B",
        },
        {
          id: "A-O-P03",
          timestamp: "14:05:11.882",
          device: "ATS-MAIN-01",
          code: "ATS-TRANSFER-TEST-002",
          message: "市电 / 油机切换演练抖动 1.2s，无业务影响",
          severity: "Minor",
          status: "Cleared",
          source: "Facility DCIM",
          role: "noise",
          family: "ATS",
          hop: 0,
          zone: "Utility Yard",
        },
        {
          id: "A-O-P04",
          timestamp: "14:06:03.210",
          device: "PDU-B08",
          code: "PDU-PHASE-IMBAL-005",
          message: "三相不平衡 6.4%，低于处置阈值，仅观察",
          severity: "Minor",
          status: "Active",
          source: "Facility DCIM",
          role: "secondary",
          family: "PDU-B",
          hop: 1,
          zone: "IT Hall B",
        },
      ],
    },
    {
      scenarioKey: "cooling",
      domain: "Cooling",
      alarms: [
        {
          id: "A-O-C01",
          timestamp: "06:22:08.441",
          device: "CRAC-B05",
          code: "COOL-FILTER-DIRTY-004",
          message: "回风滤网压差升高，计划明日更换，未升级事故",
          severity: "Minor",
          status: "Active",
          source: "Environmental",
          role: "secondary",
          family: "CRAC-B",
          hop: 0,
          zone: "Cooling Plant B",
        },
        {
          id: "A-O-C02",
          timestamp: "06:40:19.090",
          device: "CHILLER-2",
          code: "CHILL-SETPOINT-DRIFT-007",
          message: "冷冻水设定点短暂漂移 0.6°C 后回稳",
          severity: "Warning",
          status: "Cleared",
          source: "BMS",
          role: "noise",
          family: "CHILLER",
          hop: 0,
          zone: "Cooling Plant B",
        },
        {
          id: "A-O-C03",
          timestamp: "16:11:44.673",
          device: "AHU-EAST-03",
          code: "AHU-VFD-WARN-012",
          message: "风机变频器谐波告警闪断，已自动复位",
          severity: "Warning",
          status: "Cleared",
          source: "Environmental",
          role: "noise",
          family: "AHU",
          hop: 1,
          zone: "East Mech Gallery",
        },
      ],
    },
    {
      scenarioKey: "storage",
      domain: "Storage",
      alarms: [
        {
          id: "A-O-S01",
          timestamp: "10:33:05.228",
          device: "SAN-SW-07",
          code: "SAN-CRC-ERR-009",
          message: "光纤端口偶发 CRC，单端口计数 +3，未形成风暴",
          severity: "Minor",
          status: "Active",
          source: "Storage Fabric",
          role: "noise",
          family: "SAN-SW",
          hop: 1,
          zone: "Storage Room 1",
        },
        {
          id: "A-O-S02",
          timestamp: "10:34:18.901",
          device: "DISK-JBOD-12",
          code: "DISK-PREFAIL-SMART-015",
          message: "盘位 14 SMART 预故障，已加入换盘工单，无 IO 中断",
          severity: "Major",
          status: "Active",
          source: "Storage Array",
          role: "secondary",
          family: "JBOD",
          hop: 0,
          zone: "Storage Room 1",
        },
        {
          id: "A-O-S03",
          timestamp: "19:02:55.340",
          device: "NAS-GW-03",
          code: "NAS-CONN-FLAP-006",
          message: "NFS 客户端短暂重连（客户端侧重启），存储侧健康",
          severity: "Warning",
          status: "Cleared",
          source: "NAS Gateway",
          role: "noise",
          family: "NAS",
          hop: 2,
          zone: "Storage Edge",
        },
        {
          id: "A-O-S04",
          timestamp: "19:03:12.017",
          device: "BACKUP-LIB-01",
          code: "TAPE-MOUNT-DELAY-002",
          message: "磁带装载延迟 48s，备份窗口仍满足 SLA",
          severity: "Minor",
          status: "Cleared",
          source: "Backup",
          role: "secondary",
          family: "BACKUP",
          hop: 3,
          zone: "Media Vault",
        },
      ],
    },
    {
      scenarioKey: "network",
      domain: "Network",
      alarms: [
        {
          id: "A-O-N01",
          timestamp: "12:47:09.556",
          device: "SW-ACCESS-19",
          code: "NET-STP-TCN-008",
          message: "接入层拓扑变更通知（工单换线），收敛 2s",
          severity: "Warning",
          status: "Cleared",
          source: "Network NMS",
          role: "noise",
          family: "ACCESS",
          hop: 2,
          zone: "Hall D ToR",
        },
        {
          id: "A-O-N02",
          timestamp: "12:48:33.120",
          device: "FW-EDGE-02",
          code: "FW-SESSION-SPIKE-011",
          message: "会话表瞬时冲高至 72%，随后回落，无丢包",
          severity: "Minor",
          status: "Cleared",
          source: "Security Gateway",
          role: "secondary",
          family: "FW",
          hop: 1,
          zone: "DMZ",
        },
        {
          id: "A-O-N03",
          timestamp: "21:15:02.884",
          device: "DNS-CACHE-01",
          code: "DNS-QUERY-LAT-003",
          message: "解析 P99 延迟 85ms（上游抖动），未触发业务告警",
          severity: "Warning",
          status: "Active",
          source: "DNS Ops",
          role: "noise",
          family: "DNS",
          hop: 3,
          zone: "Service Net",
        },
        {
          id: "A-O-N04",
          timestamp: "21:16:40.441",
          device: "LB-PUB-04",
          code: "LB-BACKEND-PROBE-FAIL-001",
          message: "单个后端探活失败 1 次后恢复，池内仍健康",
          severity: "Minor",
          status: "Cleared",
          source: "Load Balancer",
          role: "noise",
          family: "LB",
          hop: 3,
          zone: "Service Net",
        },
      ],
    },
  ]
}

export function getAllOrphanAlarms(): TaggedAlarm[] {
  return getOrphanAlarmBundles().flatMap((bundle) => bundle.alarms)
}

export function findOrphanAlarm(id: string): TaggedAlarm | undefined {
  return getAllOrphanAlarms().find((alarm) => alarm.id === id)
}

export function isOrphanIncidentId(incidentId?: string | null) {
  return incidentId === ORPHAN_INCIDENT_ID
}
