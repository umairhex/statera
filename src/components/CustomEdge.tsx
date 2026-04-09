import React, { useState, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
  useReactFlow,
  MarkerType,
} from '@xyflow/react';

const getSymbolColor = (symbol: string, isDark: boolean): string => {
  const colors = isDark ? [
    '#60a5fa',
    '#34d399',
    '#fbbf24',
    '#f87171',
    '#a78bfa',
    '#06b6d4',
    '#fb923c',
    '#ec4899',
  ] : [
    '#2563eb',
    '#059669',
    '#d97706',
    '#dc2626',
    '#7c3aed',
    '#0891b2',
    '#ea580c',
    '#db2777',
  ];
  
 
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
  selected = false,
}: EdgeProps) {
  const [isDraggingControl, setIsDraggingControl] = useState<'cp1' | 'cp2' | null>(null);
  const { setEdges } = useReactFlow();
  
 
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  
 
  const cp1OffsetX = (data?.cp1OffsetX ?? 0) as number;
  const cp1OffsetY = (data?.cp1OffsetY ?? 0) as number;
  const cp2OffsetX = (data?.cp2OffsetX ?? 0) as number;
  const cp2OffsetY = (data?.cp2OffsetY ?? 0) as number;

 
  const symbols = data?.symbols as string[] || [];
  const firstSymbol = symbols.length > 0 ? symbols[0] : (label as string || 'a');
  const arrowColor = getSymbolColor(firstSymbol, isDark);

 
  const markerColorId = arrowColor.replace('#', '');
  const markerId = `arrow-${markerColorId}`;
  
 
  const markerEndRef = `url(#${markerId})`;

  const handleControlPointerDown = useCallback(
    (e: React.PointerEvent, point: 'cp1' | 'cp2') => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingControl(point);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingControl) return;
      e.preventDefault();

      const deltaX = e.movementX;
      const deltaY = e.movementY;

      setEdges((edges) =>
        edges.map((edge) => {
          if (edge.id !== id) return edge;
          return {
            ...edge,
            data: {
              ...edge.data,
              [isDraggingControl === 'cp1' ? 'cp1OffsetX' : 'cp2OffsetX']:
                (isDraggingControl === 'cp1' ? cp1OffsetX : cp2OffsetX) + deltaX,
              [isDraggingControl === 'cp1' ? 'cp1OffsetY' : 'cp2OffsetY']:
                (isDraggingControl === 'cp1' ? cp1OffsetY : cp2OffsetY) + deltaY,
            },
          };
        })
      );
    },
    [id, isDraggingControl, cp1OffsetX, cp1OffsetY, cp2OffsetX, cp2OffsetY, setEdges]
  );

  const handlePointerUp = useCallback(() => {
    setIsDraggingControl(null);
  }, []);

  React.useEffect(() => {
    if (!isDraggingControl) return;
    
    document.addEventListener('pointermove', handlePointerMove as any);
    document.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      document.removeEventListener('pointermove', handlePointerMove as any);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingControl, handlePointerMove, handlePointerUp]);

  const isSelfLoop = data?.isSelfLoop;
  const isBidirectional = data?.isBidirectional;

  let edgePath = '';
  let labelX = 0;
  let labelY = 0;
  let calculatedCp1X = 0, calculatedCp1Y = 0, calculatedCp2X = 0, calculatedCp2Y = 0;

  if (isSelfLoop) {
    const nodeCenterX = sourceX - 25;
    const nodeCenterY = sourceY;

    const startX = nodeCenterX - 10;
    const startY = nodeCenterY - 25;
    const endX = nodeCenterX + 10;
    const endY = nodeCenterY - 25;

    const cp1 = startX - 30 + cp1OffsetX;
    const cp1y = startY - 60 + cp1OffsetY;
    const cp2 = endX + 30 + cp2OffsetX;
    const cp2y = endY - 60 + cp2OffsetY;

    edgePath = `M ${startX} ${startY} C ${cp1} ${cp1y}, ${cp2} ${cp2y}, ${endX} ${endY}`;
    labelX = nodeCenterX;
    labelY = nodeCenterY - 75;
    
    calculatedCp1X = cp1;
    calculatedCp1Y = cp1y;
    calculatedCp2X = cp2;
    calculatedCp2Y = cp2y;
  } else {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const l = Math.sqrt(dx * dx + dy * dy);

    const isBackward = targetX < sourceX - 20;
    const isLongForward = dx > 150;

    if (isBackward) {
      const controlOffset = Math.max(Math.abs(dx) * 0.4, 50);
      const verticalOffset = Math.max(l * 0.3, 60);

      calculatedCp1X = sourceX + controlOffset + cp1OffsetX;
      calculatedCp1Y = sourceY - verticalOffset + cp1OffsetY;

      calculatedCp2X = targetX - controlOffset + cp2OffsetX;
      calculatedCp2Y = targetY - verticalOffset + cp2OffsetY;

      edgePath = `M ${sourceX} ${sourceY} C ${calculatedCp1X} ${calculatedCp1Y}, ${calculatedCp2X} ${calculatedCp2Y}, ${targetX} ${targetY}`;
      labelX = 0.125 * sourceX + 0.375 * calculatedCp1X + 0.375 * calculatedCp2X + 0.125 * targetX;
      labelY = 0.125 * sourceY + 0.375 * calculatedCp1Y + 0.375 * calculatedCp2Y + 0.125 * targetY;
    } else if (isBidirectional) {
      const controlOffset = Math.max(dx * 0.3, 30);
      const verticalOffset = Math.min(dx * 0.2, 40);

      calculatedCp1X = sourceX + controlOffset + cp1OffsetX;
      calculatedCp1Y = sourceY + verticalOffset + cp1OffsetY;

      calculatedCp2X = targetX - controlOffset + cp2OffsetX;
      calculatedCp2Y = targetY + verticalOffset + cp2OffsetY;

      edgePath = `M ${sourceX} ${sourceY} C ${calculatedCp1X} ${calculatedCp1Y}, ${calculatedCp2X} ${calculatedCp2Y}, ${targetX} ${targetY}`;
      labelX = 0.125 * sourceX + 0.375 * calculatedCp1X + 0.375 * calculatedCp2X + 0.125 * targetX;
      labelY = 0.125 * sourceY + 0.375 * calculatedCp1Y + 0.375 * calculatedCp2Y + 0.125 * targetY;
    } else if (isLongForward) {
      const controlOffset = dx * 0.3;
      const verticalOffset = Math.min(dx * 0.25, 80);

      calculatedCp1X = sourceX + controlOffset + cp1OffsetX;
      calculatedCp1Y = sourceY - verticalOffset + cp1OffsetY;

      calculatedCp2X = targetX - controlOffset + cp2OffsetX;
      calculatedCp2Y = targetY - verticalOffset + cp2OffsetY;

      edgePath = `M ${sourceX} ${sourceY} C ${calculatedCp1X} ${calculatedCp1Y}, ${calculatedCp2X} ${calculatedCp2Y}, ${targetX} ${targetY}`;
      labelX = 0.125 * sourceX + 0.375 * calculatedCp1X + 0.375 * calculatedCp2X + 0.125 * targetX;
      labelY = 0.125 * sourceY + 0.375 * calculatedCp1Y + 0.375 * calculatedCp2Y + 0.125 * targetY;
    } else {
      const [path, lx, ly] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
      edgePath = path;
      labelX = lx;
      labelY = ly;
      
     
      const midX = (sourceX + targetX) / 2;
      const midY = (sourceY + targetY) / 2;
      calculatedCp1X = sourceX + (midX - sourceX) * 0.5 + cp1OffsetX;
      calculatedCp1Y = sourceY + (midY - sourceY) * 0.5 + cp1OffsetY;
      calculatedCp2X = targetX - (targetX - midX) * 0.5 + cp2OffsetX;
      calculatedCp2Y = targetY - (targetY - midY) * 0.5 + cp2OffsetY;
    }
  }
  return (
    <>
            <svg 
        width="0" 
        height="0"
        style={{
          position: 'absolute',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="12"
            markerHeight="12"
            refX="11"
            refY="6"
            orient="auto"
          >
            <polygon 
              points="0 0, 12 6, 0 12" 
              fill={arrowColor}
            />
          </marker>
        </defs>
      </svg>
      
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEndRef}
        style={{
          ...style,
          stroke: arrowColor,
          strokeWidth: (style as any)?.strokeWidth || 2,
        }} 
      />
      
      {/* Interactive control point handles when edge is selected */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${calculatedCp1X}px,${calculatedCp1Y}px)`,
              pointerEvents: 'all',
            }}
            onPointerDown={(e) => handleControlPointerDown(e, 'cp1')}
            className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-lg hover:w-4 hover:h-4 hover:bg-blue-600 cursor-grab active:cursor-grabbing active:bg-blue-700 transition-all"
            title="Drag to adjust edge routing"
          />
        </EdgeLabelRenderer>
      )}
      
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${calculatedCp2X}px,${calculatedCp2Y}px)`,
              pointerEvents: 'all',
            }}
            onPointerDown={(e) => handleControlPointerDown(e, 'cp2')}
            className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-lg hover:w-4 hover:h-4 hover:bg-blue-600 cursor-grab active:cursor-grabbing active:bg-blue-700 transition-all"
            title="Drag to adjust edge routing"
          />
        </EdgeLabelRenderer>
      )}
      
            {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 rounded text-sm font-bold shadow-sm border border-gray-200 dark:border-gray-700"
          >
            {label as string}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
