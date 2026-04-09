import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';

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
}: EdgeProps) {
  const isSelfLoop = data?.isSelfLoop;
  const isBidirectional = data?.isBidirectional;

  let edgePath = '';
  let labelX = 0;
  let labelY = 0;

  if (isSelfLoop) {
    const nodeCenterX = sourceX - 25;
    const nodeCenterY = sourceY;

    const startX = nodeCenterX - 10;
    const startY = nodeCenterY - 25;
    const endX = nodeCenterX + 10;
    const endY = nodeCenterY - 25;

    edgePath = `M ${startX} ${startY} C ${startX - 30} ${startY - 60}, ${endX + 30} ${endY - 60}, ${endX} ${endY}`;
    labelX = nodeCenterX;
    labelY = nodeCenterY - 75;
  } else {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const l = Math.sqrt(dx * dx + dy * dy);

    const isBackward = targetX < sourceX - 20;
    const isLongForward = dx > 150;

    if (isBackward) {
      const controlOffset = Math.max(Math.abs(dx) * 0.4, 50);
      const verticalOffset = Math.max(l * 0.3, 60);

      const cp1X = sourceX + controlOffset;
      const cp1Y = sourceY - verticalOffset;

      const cp2X = targetX - controlOffset;
      const cp2Y = targetY - verticalOffset;

      edgePath = `M ${sourceX} ${sourceY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`;
      labelX = 0.125 * sourceX + 0.375 * cp1X + 0.375 * cp2X + 0.125 * targetX;
      labelY = 0.125 * sourceY + 0.375 * cp1Y + 0.375 * cp2Y + 0.125 * targetY;
    } else if (isBidirectional) {
      const controlOffset = Math.max(dx * 0.3, 30);
      const verticalOffset = Math.min(dx * 0.2, 40);

      const cp1X = sourceX + controlOffset;
      const cp1Y = sourceY + verticalOffset;

      const cp2X = targetX - controlOffset;
      const cp2Y = targetY + verticalOffset;

      edgePath = `M ${sourceX} ${sourceY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`;
      labelX = 0.125 * sourceX + 0.375 * cp1X + 0.375 * cp2X + 0.125 * targetX;
      labelY = 0.125 * sourceY + 0.375 * cp1Y + 0.375 * cp2Y + 0.125 * targetY;
    } else if (isLongForward) {
      const controlOffset = dx * 0.3;
      const verticalOffset = Math.min(dx * 0.25, 80);

      const cp1X = sourceX + controlOffset;
      const cp1Y = sourceY - verticalOffset;

      const cp2X = targetX - controlOffset;
      const cp2Y = targetY - verticalOffset;

      edgePath = `M ${sourceX} ${sourceY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`;
      labelX = 0.125 * sourceX + 0.375 * cp1X + 0.375 * cp2X + 0.125 * targetX;
      labelY = 0.125 * sourceY + 0.375 * cp1Y + 0.375 * cp2Y + 0.125 * targetY;
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
    }
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
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
