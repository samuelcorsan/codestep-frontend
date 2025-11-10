"use client";

import React, { useMemo, useState, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ConnectionMode,
  MarkerType,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowInstance,
  Handle,
  Position,
} from "reactflow";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "reactflow/dist/style.css";

interface Explanation {
  question: string;
  answer: string;
}

interface ArchitectureDiagramProps {
  className?: string;
  architectureItems?: Array<{
    file: string;
    purpose: string;
    starter_code: string;
    explanations?: Explanation[];
    dependencies?: string[];
  }>;
}

const colors = [
  { bg: "#3b82f6", border: "#2563eb" },
  { bg: "#10b981", border: "#059669" },
  { bg: "#f59e0b", border: "#d97706" },
  { bg: "#8b5cf6", border: "#7c3aed" },
  { bg: "#ef4444", border: "#dc2626" },
  { bg: "#ec4899", border: "#db2777" },
  { bg: "#06b6d4", border: "#0891b2" },
  { bg: "#84cc16", border: "#65a30d" },
];

interface InfoNodeData {
  question: string;
  answer: string;
  onOpen: () => void;
}

interface CustomNodeData {
  file: string;
  purpose: string;
  color: { bg: string; border: string };
  handlePositions?: number[]; // Array of Y offsets for multiple handles
}

const CustomNode = ({ data }: { data: CustomNodeData }) => {
  return (
    <div
      style={{
        background: data.color.bg,
          color: "#fff",
        border: `2px solid ${data.color.border}`,
          borderRadius: "8px",
          padding: "16px",
          minWidth: "180px",
        maxWidth: "200px",
          textAlign: "center",
        position: "relative",
      }}
    >
      <Handle type="target" position={Position.Top} />
      {/* Add multiple handles on the left side at different vertical positions */}
      {data.handlePositions?.map((offset, index) => (
        <Handle
          key={`left-${index}`}
          type="target"
          position={Position.Left}
          id={`left-${index}`}
          style={{
            top: `${50 + offset}%`, // Center at 50%, then offset
            transform: "translateY(-50%)",
          }}
        />
      )) || <Handle type="target" position={Position.Left} />}
      <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
        {data.file}
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "400",
          opacity: 0.9,
          lineHeight: "1.4",
        }}
      >
        {data.purpose}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

const InfoNode = ({ data }: { data: InfoNodeData }) => {
  return (
    <div
      onClick={data.onOpen}
      style={{
        background: "#f3f4f6",
        color: "#374151",
        border: "2px solid #d1d5db",
        borderRadius: "6px",
        padding: "8px 12px",
        minWidth: "140px",
        maxWidth: "180px",
          textAlign: "center",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontSize: "11px",
        fontWeight: "500",
        transition: "all 0.2s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#e5e7eb";
        e.currentTarget.style.borderColor = "#9ca3af";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#f3f4f6";
        e.currentTarget.style.borderColor = "#d1d5db";
      }}
    >
      <Handle type="source" position={Position.Bottom} />
      <Info size={14} style={{ flexShrink: 0 }} />
      <span style={{ lineHeight: "1.3" }}>{data.question}</span>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
  info: InfoNode,
};

export default function ArchitectureDiagram({
  className = "",
  architectureItems = [],
}: ArchitectureDiagramProps) {
  const [selectedExplanation, setSelectedExplanation] =
    useState<Explanation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openExplanationModal = useCallback((explanation: Explanation) => {
    setSelectedExplanation(explanation);
    setIsModalOpen(true);
  }, []);

  const initialNodes: Node[] = useMemo(() => {
    if (!architectureItems || architectureItems.length === 0) {
      return [];
    }

    const nodes: Node[] = [];
    const nodeSpacing = 250;
    const startX = 100;
    const fileNodeY = 250; // Y position for file nodes (moved down to make room for edges)
    const infoNodeY = 50; // Y position for info nodes (above file nodes)

    architectureItems.forEach((item, index) => {
      const color = colors[index % colors.length];
      const x = startX + index * nodeSpacing;

      // Add info node if explanations exist
      if (item.explanations && item.explanations.length > 0) {
        // For now, show the first explanation. You can extend this to show multiple
        const explanation = item.explanations[0];
        nodes.push({
          id: `info-${index + 1}`,
          type: "info",
          data: {
            question: explanation.question,
            answer: explanation.answer,
            onOpen: () => openExplanationModal(explanation),
          },
          position: { x, y: infoNodeY },
          draggable: false,
        });
      }

      // Add file node (handle positions will be added later in edge generation)
      nodes.push({
        id: String(index + 1),
        type: "custom",
        data: {
          file: item.file,
          purpose: item.purpose,
          color: color,
        },
        position: { x, y: fileNodeY },
        draggable: true,
      });
    });

    return nodes;
  }, [architectureItems, openExplanationModal]);

  const { edges: initialEdges, nodes: nodesWithHandles } = useMemo(() => {
    const edges: Edge[] = [];

    // Create a map of file names to node IDs for quick lookup
    const fileToNodeId = new Map<string, string>();
    architectureItems.forEach((item, index) => {
      fileToNodeId.set(item.file, String(index + 1));
    });

    // Create edges connecting info nodes to their corresponding file nodes
    architectureItems.forEach((item, index) => {
      if (item.explanations && item.explanations.length > 0) {
        edges.push({
          id: `info-edge-${index + 1}`,
          source: `info-${index + 1}`,
          target: String(index + 1),
          type: "straight",
          style: { stroke: "#9ca3af", strokeWidth: 1, strokeDasharray: "5,5" },
          animated: false,
        });
      }
    });

    // Create edges based on dependencies
    // Track edges per target to assign different handle positions
    const edgesPerTarget = new Map<string, number>();
    const handlePositionsPerNode = new Map<string, number[]>();

    // First pass: collect all dependencies to determine handle positions
    architectureItems.forEach((item, index) => {
      const currentNodeId = String(index + 1);
      if (item.dependencies && item.dependencies.length > 0) {
        const handleOffsets: number[] = [];
        item.dependencies.forEach((dependency, depIndex) => {
          const dependencyNodeId = fileToNodeId.get(dependency);
          if (dependencyNodeId) {
            const edgeId = `e${dependencyNodeId}-${currentNodeId}`;
            if (!edges.find((e) => e.id === edgeId)) {
              const edgeCount = edgesPerTarget.get(currentNodeId) || 0;
              edgesPerTarget.set(currentNodeId, edgeCount + 1);

              // Calculate handle offset: distribute evenly from -30% to +30%
              const totalDeps = item.dependencies?.length || 0;
              const offsetRange = 60; // Total range in percentage
              const offset =
                totalDeps > 1
                  ? (depIndex / (totalDeps - 1)) * offsetRange - offsetRange / 2
                  : 0;
              handleOffsets.push(offset);
            }
          }
        });
        if (handleOffsets.length > 0) {
          handlePositionsPerNode.set(currentNodeId, handleOffsets);
        }
      }
    });

    // Update nodes with handle positions
    const nodesWithHandles = initialNodes.map((node) => {
      if (node.type === "custom") {
        const nodeId = node.id;
        const handlePositions = handlePositionsPerNode.get(nodeId);
        return {
          ...node,
          data: {
            ...node.data,
            handlePositions: handlePositions || undefined,
          },
        };
      }
      return node;
    });

    // Second pass: create edges with specific target handles
    let handleIndex = 0;
    architectureItems.forEach((item, index) => {
      const currentNodeId = String(index + 1);

      if (item.dependencies && item.dependencies.length > 0) {
        item.dependencies.forEach((dependency, depIndex) => {
          const dependencyNodeId = fileToNodeId.get(dependency);
          if (dependencyNodeId) {
            // Check if edge already exists (avoid duplicates)
            const edgeId = `e${dependencyNodeId}-${currentNodeId}`;
            if (!edges.find((e) => e.id === edgeId)) {
              const handlePositions = handlePositionsPerNode.get(currentNodeId);
              const handleOffset = handlePositions?.[depIndex] || 0;
              const targetHandle =
                handlePositions && handlePositions.length > 1
                  ? `left-${depIndex}`
                  : undefined;

              edges.push({
                id: edgeId,
                source: dependencyNodeId,
                target: currentNodeId,
                sourceHandle: "right",
                targetHandle: targetHandle,
        type: "smoothstep",
        animated: true,
                style: {
                  stroke: "#6b7280",
                  strokeWidth: 2,
                },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#6b7280",
        },
              });

              handleIndex++;
            }
          }
        });
      }
    });

    return { edges, nodes: nodesWithHandles };
  }, [architectureItems, initialNodes]);

  const [nodes, setNodes] = useState<Node[]>(nodesWithHandles);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Update nodes and edges when architectureItems changes
  React.useEffect(() => {
    console.log(
      "ArchitectureDiagram: architectureItems changed",
      architectureItems
    );
    setNodes(nodesWithHandles);
    setEdges(initialEdges);

    // Fit view after a short delay to ensure nodes are rendered
    if (reactFlowInstance.current && nodesWithHandles.length > 0) {
      setTimeout(() => {
        reactFlowInstance.current?.fitView({ padding: 0.2 });
      }, 100);
    }
  }, [nodesWithHandles, initialEdges, architectureItems]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onInit = useCallback(
    (instance: ReactFlowInstance) => {
      reactFlowInstance.current = instance;
      if (nodes.length > 0) {
        instance.fitView({ padding: 0.2 });
      }
    },
    [nodes.length]
  );

  return (
    <>
    <div className={`w-full h-full ${className}`}>
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No architecture data available</p>
          </div>
        ) : (
      <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onInit={onInit}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gray-50"
            nodesDraggable={true}
            nodeTypes={nodeTypes}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
                if (node.id.startsWith("info-")) {
                  return "#9ca3af";
                }
                const nodeIndex = parseInt(node.id) - 1;
                if (nodeIndex >= 0 && nodeIndex < colors.length) {
                  return colors[nodeIndex % colors.length].bg;
                }
                return "#6b7280";
          }}
          className="bg-white border border-gray-200 rounded-lg"
        />
      </ReactFlow>
        )}
    </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedExplanation?.question}</DialogTitle>
            <DialogDescription className="pt-4 text-base text-gray-700">
              {selectedExplanation?.answer}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
