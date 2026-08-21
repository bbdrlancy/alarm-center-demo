export type OntologyConceptId =
  | "Location"
  | "Asset"
  | "Device"
  | "Sensor"
  | "Alarm"
  | "Event"
  | "Incident"
  | "Change"
  | "Work Order"
  | "Service"
  | "Knowledge"
  | "Relationship"

export type OntologyConcept = {
  id: OntologyConceptId
  label: string
  zh: string
  x: number
  y: number
}

export type SemanticRelation = {
  from: OntologyConceptId
  to: OntologyConceptId
  label: string
}

/** Concept nodes only — no instances. */
export const ontologyConcepts: OntologyConcept[] = [
  { id: "Location", label: "Location", zh: "位置", x: 70, y: 52 },
  { id: "Asset", label: "Asset", zh: "资产", x: 170, y: 52 },
  { id: "Device", label: "Device", zh: "设备", x: 270, y: 52 },
  { id: "Sensor", label: "Sensor", zh: "传感器", x: 370, y: 52 },
  { id: "Alarm", label: "Alarm", zh: "告警", x: 470, y: 52 },
  { id: "Event", label: "Event", zh: "事件", x: 570, y: 52 },
  { id: "Incident", label: "Incident", zh: "故障", x: 670, y: 52 },
  { id: "Work Order", label: "Work Order", zh: "工单", x: 770, y: 52 },
  { id: "Service", label: "Service", zh: "服务", x: 270, y: 108 },
  { id: "Change", label: "Change", zh: "变更", x: 570, y: 108 },
  { id: "Knowledge", label: "Knowledge", zh: "知识", x: 670, y: 108 },
  { id: "Relationship", label: "Relationship", zh: "关系", x: 770, y: 108 },
]

export const semanticRelations: SemanticRelation[] = [
  { from: "Location", to: "Asset", label: "contains" },
  { from: "Asset", to: "Device", label: "has" },
  { from: "Device", to: "Sensor", label: "monitored_by" },
  { from: "Sensor", to: "Alarm", label: "generates" },
  { from: "Alarm", to: "Event", label: "triggers" },
  { from: "Event", to: "Incident", label: "escalates_to" },
  { from: "Incident", to: "Service", label: "impacts" },
  { from: "Incident", to: "Work Order", label: "creates" },
  { from: "Incident", to: "Knowledge", label: "enriches" },
  { from: "Change", to: "Incident", label: "correlates_with" },
  { from: "Knowledge", to: "Relationship", label: "defines" },
]

export const conceptZh: Record<OntologyConceptId, string> = {
  Location: "位置",
  Asset: "资产",
  Device: "设备",
  Sensor: "传感器",
  Alarm: "告警",
  Event: "事件",
  Incident: "故障",
  Change: "变更",
  "Work Order": "工单",
  Service: "服务",
  Knowledge: "知识",
  Relationship: "关系",
}

export function getConceptById(id: OntologyConceptId): OntologyConcept | undefined {
  return ontologyConcepts.find((c) => c.id === id)
}

export function getConceptNeighbors(id: OntologyConceptId): Set<OntologyConceptId> {
  const set = new Set<OntologyConceptId>([id])
  for (const rel of semanticRelations) {
    if (rel.from === id) set.add(rel.to)
    if (rel.to === id) set.add(rel.from)
  }
  return set
}
