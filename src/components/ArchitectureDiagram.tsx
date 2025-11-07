"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ConnectionMode,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

interface ArchitectureDiagramProps {
  className?: string;
}

export default function ArchitectureDiagram({
  className = "",
}: ArchitectureDiagramProps) {
  const initialNodes: Node[] = useMemo(
    () => [
      {
        id: "1",
        type: "input",
        data: { label: "Frontend\n(React/Next.js)" },
        position: { x: 250, y: 0 },
        style: {
          background: "#3b82f6",
          color: "#fff",
          border: "2px solid #2563eb",
          borderRadius: "8px",
          padding: "16px",
          fontSize: "14px",
          fontWeight: "600",
          textAlign: "center",
          minWidth: "180px",
        },
      },
      {
        id: "2",
        data: { label: "API Gateway\n(REST/GraphQL)" },
        position: { x: 250, y: 120 },
        style: {
          background: "#10b981",
          color: "#fff",
          border: "2px solid #059669",
          borderRadius: "8px",
          padding: "16px",
          fontSize: "14px",
          fontWeight: "600",
          textAlign: "center",
          minWidth: "180px",
        },
      },
      {
        id: "3",
        data: { label: "Auth Service\n(JWT/OAuth)" },
        position: { x: 0, y: 240 },
        style: {
          background: "#f59e0b",
          color: "#fff",
          border: "2px solid #d97706",
          borderRadius: "8px",
          padding: "16px",
          fontSize: "14px",
          fontWeight: "600",
          textAlign: "center",
          minWidth: "160px",
        },
      },
      {
        id: "4",
        data: { label: "Business Logic\n(Service Layer)" },
        position: { x: 250, y: 240 },
        style: {
          background: "#8b5cf6",
          color: "#fff",
          border: "2px solid #7c3aed",
          borderRadius: "8px",
          padding: "16px",
          fontSize: "14px",
          fontWeight: "600",
          textAlign: "center",
          minWidth: "180px",
        },
      },
      {
        id: "5",
        data: { label: "Database\n(PostgreSQL)" },
        position: { x: 500, y: 240 },
        style: {
          background: "#ef4444",
          color: "#fff",
          border: "2px solid #dc2626",
          borderRadius: "8px",
          padding: "16px",
          fontSize: "14px",
          fontWeight: "600",
          textAlign: "center",
          minWidth: "160px",
        },
      },
      {
        id: "6",
        type: "output",
        data: { label: "Cache Layer\n(Redis)" },
        position: { x: 250, y: 360 },
        style: {
          background: "#ec4899",
          color: "#fff",
          border: "2px solid #db2777",
          borderRadius: "8px",
          padding: "16px",
          fontSize: "14px",
          fontWeight: "600",
          textAlign: "center",
          minWidth: "180px",
        },
      },
    ],
    []
  );

  const initialEdges: Edge[] = useMemo(
    () => [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#6b7280", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#6b7280",
        },
      },
      {
        id: "e2-3",
        source: "2",
        target: "3",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#6b7280", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#6b7280",
        },
      },
      {
        id: "e2-4",
        source: "2",
        target: "4",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#6b7280", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#6b7280",
        },
      },
      {
        id: "e4-5",
        source: "4",
        target: "5",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#6b7280", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#6b7280",
        },
      },
      {
        id: "e4-6",
        source: "4",
        target: "6",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#6b7280", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#6b7280",
        },
      },
    ],
    []
  );

  return (
    <div className={`w-full h-full ${className}`}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gray-50"
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data?.label) {
              case "Frontend\n(React/Next.js)":
                return "#3b82f6";
              case "API Gateway\n(REST/GraphQL)":
                return "#10b981";
              case "Auth Service\n(JWT/OAuth)":
                return "#f59e0b";
              case "Business Logic\n(Service Layer)":
                return "#8b5cf6";
              case "Database\n(PostgreSQL)":
                return "#ef4444";
              case "Cache Layer\n(Redis)":
                return "#ec4899";
              default:
                return "#6b7280";
            }
          }}
          className="bg-white border border-gray-200 rounded-lg"
        />
      </ReactFlow>
    </div>
  );
}
