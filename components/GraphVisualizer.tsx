'use client';

import { useEffect, useRef, useState } from 'react';
import { Network, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: string;
  properties: any;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
}

interface GraphVisualizerProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (node: Node) => void;
}

export default function GraphVisualizer({ nodes, edges, onNodeClick }: GraphVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutType, setLayoutType] = useState<'force' | 'hierarchical' | 'circular'>('force');

  // Color mapping for entity types
  const getNodeColor = (type: string): string => {
    const colors: Record<string, string> = {
      PERSON: '#3B82F6',        // blue
      ORGANIZATION: '#10B981',   // green
      LOCATION: '#F59E0B',       // amber
      CONCEPT: '#8B5CF6',        // purple
      DATE: '#EF4444',           // red
      METRIC: '#EC4899',         // pink
      DOCUMENT: '#6366F1',       // indigo
    };
    return colors[type] || '#6B7280'; // gray default
  };

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    // Simple SVG-based visualization
    renderGraph();
  }, [nodes, edges, layoutType]);

  const renderGraph = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.style.backgroundColor = '#F9FAFB';

    // Calculate positions based on layout type
    const positions = calculateLayout(nodes, edges, width, height, layoutType);

    // Draw edges first (so they appear behind nodes)
    edges.forEach(edge => {
      const sourcePos = positions.get(edge.source);
      const targetPos = positions.get(edge.target);
      
      if (sourcePos && targetPos) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(sourcePos.x));
        line.setAttribute('y1', String(sourcePos.y));
        line.setAttribute('x2', String(targetPos.x));
        line.setAttribute('y2', String(targetPos.y));
        line.setAttribute('stroke', '#D1D5DB');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);

        // Add edge label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;
        text.setAttribute('x', String(midX));
        text.setAttribute('y', String(midY));
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', '#6B7280');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = edge.type;
        svg.appendChild(text);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.style.cursor = 'pointer';
      
      group.addEventListener('click', () => {
        setSelectedNode(node);
        if (onNodeClick) onNodeClick(node);
      });

      // Node circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(pos.x));
      circle.setAttribute('cy', String(pos.y));
      circle.setAttribute('r', '20');
      circle.setAttribute('fill', getNodeColor(node.type));
      circle.setAttribute('stroke', '#FFFFFF');
      circle.setAttribute('stroke-width', '2');
      group.appendChild(circle);

      // Node label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(pos.x));
      text.setAttribute('y', String(pos.y + 35));
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#1F2937');
      text.setAttribute('text-anchor', 'middle');
      text.textContent = node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label;
      group.appendChild(text);

      svg.appendChild(group);
    });

    container.appendChild(svg);
  };

  const calculateLayout = (
    nodes: Node[],
    edges: Edge[],
    width: number,
    height: number,
    layout: string
  ): Map<string, { x: number; y: number }> => {
    const positions = new Map<string, { x: number; y: number }>();
    const padding = 50;

    if (layout === 'circular') {
      // Circular layout
      const radius = Math.min(width, height) / 2 - padding;
      const centerX = width / 2;
      const centerY = height / 2;
      const angleStep = (2 * Math.PI) / nodes.length;

      nodes.forEach((node, i) => {
        const angle = i * angleStep;
        positions.set(node.id, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
      });
    } else if (layout === 'hierarchical') {
      // Simple hierarchical layout
      const levels = new Map<string, number>();
      const visited = new Set<string>();

      // Assign levels using BFS
      const queue: Array<{ id: string; level: number }> = [];
      if (nodes.length > 0) {
        queue.push({ id: nodes[0].id, level: 0 });
      }

      while (queue.length > 0) {
        const { id, level } = queue.shift()!;
        if (visited.has(id)) continue;
        
        visited.add(id);
        levels.set(id, level);

        edges.forEach(edge => {
          if (edge.source === id && !visited.has(edge.target)) {
            queue.push({ id: edge.target, level: level + 1 });
          }
        });
      }

      // Position nodes by level
      const levelCounts = new Map<number, number>();
      nodes.forEach(node => {
        const level = levels.get(node.id) || 0;
        levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
      });

      const levelIndices = new Map<number, number>();
      nodes.forEach(node => {
        const level = levels.get(node.id) || 0;
        const count = levelCounts.get(level) || 1;
        const index = levelIndices.get(level) || 0;
        levelIndices.set(level, index + 1);

        const x = ((index + 1) / (count + 1)) * (width - 2 * padding) + padding;
        const y = (level * (height - 2 * padding) / Math.max(...levelCounts.keys(), 1)) + padding;

        positions.set(node.id, { x, y });
      });
    } else {
      // Force-directed layout (simplified)
      // Initialize random positions
      nodes.forEach(node => {
        positions.set(node.id, {
          x: padding + Math.random() * (width - 2 * padding),
          y: padding + Math.random() * (height - 2 * padding),
        });
      });

      // Simple force simulation iterations
      for (let iter = 0; iter < 50; iter++) {
        const forces = new Map<string, { x: number; y: number }>();
        
        // Initialize forces
        nodes.forEach(node => {
          forces.set(node.id, { x: 0, y: 0 });
        });

        // Repulsion between all nodes
        nodes.forEach(node1 => {
          nodes.forEach(node2 => {
            if (node1.id === node2.id) return;
            
            const pos1 = positions.get(node1.id)!;
            const pos2 = positions.get(node2.id)!;
            const dx = pos1.x - pos2.x;
            const dy = pos1.y - pos2.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            const force = 1000 / (dist * dist);
            
            const f1 = forces.get(node1.id)!;
            f1.x += (dx / dist) * force;
            f1.y += (dy / dist) * force;
          });
        });

        // Attraction for connected nodes
        edges.forEach(edge => {
          const pos1 = positions.get(edge.source)!;
          const pos2 = positions.get(edge.target)!;
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          const force = dist * 0.01;

          const f1 = forces.get(edge.source)!;
          const f2 = forces.get(edge.target)!;
          f1.x += (dx / dist) * force;
          f1.y += (dy / dist) * force;
          f2.x -= (dx / dist) * force;
          f2.y -= (dy / dist) * force;
        });

        // Apply forces
        nodes.forEach(node => {
          const pos = positions.get(node.id)!;
          const force = forces.get(node.id)!;
          pos.x += force.x * 0.1;
          pos.y += force.y * 0.1;

          // Keep within bounds
          pos.x = Math.max(padding, Math.min(width - padding, pos.x));
          pos.y = Math.max(padding, Math.min(height - padding, pos.y));
        });
      }
    }

    return positions;
  };

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Network className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No graph data to visualize</p>
          <p className="text-sm mt-1">Upload and process documents first</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full'}`}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <select
          value={layoutType}
          onChange={(e) => setLayoutType(e.target.value as any)}
          className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
        >
          <option value="force">Force</option>
          <option value="hierarchical">Hierarchical</option>
          <option value="circular">Circular</option>
        </select>
        
        <button
          onClick={() => renderGraph()}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-xs">
        <div className="font-medium mb-2">Entity Types</div>
        {['PERSON', 'ORGANIZATION', 'LOCATION', 'CONCEPT', 'DATE', 'METRIC', 'DOCUMENT'].map(type => (
          <div key={type} className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getNodeColor(type) }} />
            <span>{type}</span>
          </div>
        ))}
      </div>

      {/* Graph Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-w-md">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg">{selectedNode.label}</h3>
              <span className="text-sm text-gray-500">{selectedNode.type}</span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          {Object.keys(selectedNode.properties).length > 0 && (
            <div className="mt-2 text-sm">
              <div className="font-medium mb-1">Properties:</div>
              <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(selectedNode.properties, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
