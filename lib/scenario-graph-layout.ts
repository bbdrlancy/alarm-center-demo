import type { GraphEdge, GraphNode } from "@/data/scenarios/types"

export type LayoutNode = GraphNode & { x: number; y: number; incidentPath: boolean }

export function layoutGraphNodes(nodes: GraphNode[]): LayoutNode[] {
  const spacing = 160
  const startX = 120
  const y = 110
  return nodes.map((node, i) => ({
    ...node,
    x: startX + i * spacing,
    y,
    incidentPath: i === 0 || node.category === "incident",
  }))
}

export function graphEdgeLabel(relation: string): string {
  return relation.replace(/_/g, " ")
}
