import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WorkflowNode, WorkflowEdge, WORKFLOW_BLOCKS } from '@/services/workflow';
import { Trash2, Settings, Copy, Move } from 'lucide-react';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodesChange: (nodes: WorkflowNode[]) => void;
  onEdgesChange: (edges: WorkflowEdge[]) => void;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  isReadOnly?: boolean;
}

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  selectedNodeId,
  onNodeSelect,
  isReadOnly = false
}: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Handle node dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (isReadOnly) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left - node.position.x * scale - pan.x;
    const offsetY = e.clientY - rect.top - node.position.y * scale - pan.y;

    setDraggedNode(nodeId);
    setDragOffset({ x: offsetX, y: offsetY });
    onNodeSelect(nodeId);
  }, [nodes, scale, pan, onNodeSelect, isReadOnly]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedNode || isReadOnly) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newX = (e.clientX - rect.left - dragOffset.x - pan.x) / scale;
    const newY = (e.clientY - rect.top - dragOffset.y - pan.y) / scale;

    const updatedNodes = nodes.map(node =>
      node.id === draggedNode
        ? { ...node, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
        : node
    );

    onNodesChange(updatedNodes);
  }, [draggedNode, dragOffset, nodes, onNodesChange, scale, pan, isReadOnly]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Handle node connection
  const handleConnectionStart = useCallback((nodeId: string) => {
    if (isReadOnly) return;
    
    setIsConnecting(true);
    setConnectionStart(nodeId);
  }, [isReadOnly]);

  const handleConnectionEnd = useCallback((targetNodeId: string) => {
    if (!connectionStart || connectionStart === targetNodeId || isReadOnly) {
      setIsConnecting(false);
      setConnectionStart(null);
      return;
    }

    // Check if connection already exists
    const existingEdge = edges.find(
      edge => edge.source === connectionStart && edge.target === targetNodeId
    );

    if (!existingEdge) {
      const newEdge: WorkflowEdge = {
        id: `edge-${connectionStart}-${targetNodeId}`,
        source: connectionStart,
        target: targetNodeId,
        type: 'default',
      };

      onEdgesChange([...edges, newEdge]);
    }

    setIsConnecting(false);
    setConnectionStart(null);
  }, [connectionStart, edges, onEdgesChange, isReadOnly]);

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    if (isReadOnly) return;
    
    const updatedNodes = nodes.filter(node => node.id !== nodeId);
    const updatedEdges = edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
    
    onNodesChange(updatedNodes);
    onEdgesChange(updatedEdges);
    
    if (selectedNodeId === nodeId) {
      onNodeSelect(null);
    }
  }, [nodes, edges, onNodesChange, onEdgesChange, selectedNodeId, onNodeSelect, isReadOnly]);

  // Delete edge
  const deleteEdge = useCallback((edgeId: string) => {
    if (isReadOnly) return;
    
    const updatedEdges = edges.filter(edge => edge.id !== edgeId);
    onEdgesChange(updatedEdges);
  }, [edges, onEdgesChange, isReadOnly]);

  // Get edge path
  const getEdgePath = useCallback((edge: WorkflowEdge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return '';

    const sourceX = sourceNode.position.x + 100; // Node width / 2
    const sourceY = sourceNode.position.y + 30; // Node height / 2
    const targetX = targetNode.position.x + 100;
    const targetY = targetNode.position.y + 30;

    // Simple curved path
    const controlX = (sourceX + targetX) / 2;
    const controlY1 = sourceY + Math.abs(targetY - sourceY) / 3;
    const controlY2 = targetY - Math.abs(targetY - sourceY) / 3;

    return `M ${sourceX} ${sourceY} C ${controlX} ${controlY1}, ${controlX} ${controlY2}, ${targetX} ${targetY}`;
  }, [nodes]);

  // Handle zoom and pan
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.1, scale + delta), 3);
    
    setScale(newScale);
  }, [scale]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  // Get block config for node
  const getBlockConfig = useCallback((nodeType: string) => {
    return WORKFLOW_BLOCKS.find(block => block.type === nodeType) || WORKFLOW_BLOCKS[0];
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggedNode(null);
      setIsConnecting(false);
      setConnectionStart(null);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Badge variant="secondary">
          Zoom: {Math.round(scale * 100)}%
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale(1)}
        >
          Reset View
        </Button>
      </div>

      <div
        ref={canvasRef}
        className="w-full h-full cursor-move"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        style={{
          backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Edges (connections) */}
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {edges.map(edge => {
            const path = getEdgePath(edge);
            return path ? (
              <g key={edge.id}>
                <path
                  d={path}
                  stroke="#6b7280"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
                {!isReadOnly && (
                  <circle
                    cx={0}
                    cy={0}
                    r="8"
                    fill="red"
                    className="cursor-pointer pointer-events-auto"
                    onClick={() => deleteEdge(edge.id)}
                  >
                    <animateMotion dur="0s" begin="0s" fill="freeze">
                      <mpath xlinkHref={`#path-${edge.id}`} />
                    </animateMotion>
                  </circle>
                )}
                <path id={`path-${edge.id}`} d={path} style={{ display: 'none' }} />
              </g>
            ) : null;
          })}
          
          {/* Arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6b7280"
              />
            </marker>
          </defs>
        </svg>

        {/* Nodes */}
        <div 
          className="relative"
          style={{
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            zIndex: 2,
          }}
        >
          {nodes.map(node => {
            const blockConfig = getBlockConfig(node.type);
            const isSelected = selectedNodeId === node.id;
            
            return (
              <Card
                key={node.id}
                className={`absolute p-4 w-48 cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                } ${isConnecting && connectionStart !== node.id ? 'ring-2 ring-green-400' : ''}`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  borderColor: blockConfig.color,
                  borderWidth: '2px',
                }}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isConnecting) {
                    handleConnectionEnd(node.id);
                  } else {
                    onNodeSelect(node.id);
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{blockConfig.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{node.data.label}</h4>
                    <p className="text-xs text-gray-500 truncate">{blockConfig.description}</p>
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: blockConfig.color + '20', color: blockConfig.color }}
                >
                  {blockConfig.category}
                </Badge>

                {!isReadOnly && (
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectionStart(node.id);
                      }}
                    >
                      <Move className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNodeSelect(node.id);
                      }}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Connection points */}
                {!isReadOnly && (
                  <>
                    <div
                      className="absolute -top-2 left-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-pointer transform -translate-x-1/2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectionEnd(node.id);
                      }}
                    />
                    <div
                      className="absolute -bottom-2 left-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-pointer transform -translate-x-1/2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectionStart(node.id);
                      }}
                    />
                  </>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}