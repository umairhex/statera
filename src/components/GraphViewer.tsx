import { useEffect, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MarkerType,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import {
  Download,
  FileJson,
  ZoomIn,
  ZoomOut,
  Maximize,
  Navigation,
} from 'lucide-react';
import { Automaton } from '../lib/automata';
import { CustomEdge } from './CustomEdge';

const edgeTypes = {
  custom: CustomEdge,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 80;
const nodeHeight = 80;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
    return newNode;
  });

  return { nodes: newNodes, edges };
};

function GraphViewerInner({
  automaton,
  activeStates = [],
}: {
  automaton: Automaton;
  activeStates?: string[];
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!automaton || automaton.states.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const initialNodes: any[] = automaton.states.map((state) => {
      const isActive = activeStates.includes(state.id);
      return {
        id: state.id,
        data: { label: state.id },
        position: { x: 0, y: 0 },
        style: {
          borderRadius: '50%',
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: state.isAccepting ? 4 : 2,
          borderStyle: state.isAccepting ? 'double' : 'solid',
          borderColor: isActive ? '#ca8a04' : isDarkMode ? '#e5e7eb' : '#000',
          backgroundColor: isActive
            ? isDarkMode
              ? '#ca8a04'
              : '#fef08a'
            : isDarkMode
              ? '#1f2937'
              : '#fff',
          color: isActive
            ? isDarkMode
              ? '#fff'
              : '#000'
            : isDarkMode
              ? '#e5e7eb'
              : '#000',
          fontWeight: 'bold',
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
        sourcePosition: 'right',
        targetPosition: 'left',
      };
    });

    const startDummyId = 'start-dummy';
    initialNodes.push({
      id: startDummyId,
      data: { label: 'Start' },
      position: { x: 0, y: 0 },
      style: {
        width: 50,
        height: 20,
        border: 'none',
        background: 'transparent',
        fontSize: 14,
        fontWeight: 'bold',
        color: isDarkMode ? '#9ca3af' : '#666',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      sourcePosition: 'right',
      targetPosition: 'left',
    });

    const edgeMap = new Map<string, string[]>();
    automaton.transitions.forEach((t) => {
      const key = `${t.from}-${t.to}`;
      if (!edgeMap.has(key)) edgeMap.set(key, []);
      edgeMap.get(key)!.push(t.symbol);
    });

    const initialEdges: any[] = Array.from(edgeMap.entries()).map(
      ([key, symbols], index) => {
        const [source, target] = key.split('-');
        const isSelfLoop = source === target;
        const isBidirectional =
          !isSelfLoop && edgeMap.has(`${target}-${source}`);

        return {
          id: `e${index}`,
          source,
          target,
          label: symbols.join(', '),
          data: { isSelfLoop, isBidirectional },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isDarkMode ? '#e5e7eb' : '#000',
          },
          style: { stroke: isDarkMode ? '#e5e7eb' : '#000', strokeWidth: 2 },
          type: 'custom',
        };
      }
    );

    initialEdges.push({
      id: 'e-start',
      source: startDummyId,
      target: automaton.startState,
      label: '',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isDarkMode ? '#e5e7eb' : '#000',
      },
      style: { stroke: isDarkMode ? '#e5e7eb' : '#000', strokeWidth: 2 },
      type: 'custom',
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [automaton, setEdges, isDarkMode]);

  useEffect(() => {
    setNodes((nds: any[]) =>
      nds.map((n: any) => {
        if (n.id === 'start-dummy') {
          return {
            ...n,
            style: {
              ...n.style,
              color: isDarkMode ? '#9ca3af' : '#666',
            },
          };
        }
        const isActive = activeStates.includes(n.id);
        const isAccepting = automaton.states.find(
          (s) => s.id === n.id
        )?.isAccepting;
        return {
          ...n,
          style: {
            ...n.style,
            backgroundColor: isActive
              ? isDarkMode
                ? '#ca8a04'
                : '#fef08a'
              : isDarkMode
                ? '#1f2937'
                : '#fff',
            borderColor: isActive ? '#ca8a04' : isDarkMode ? '#e5e7eb' : '#000',
            color: isActive
              ? isDarkMode
                ? '#fff'
                : '#000'
              : isDarkMode
                ? '#e5e7eb'
                : '#000',
            borderWidth: isAccepting ? 4 : 2,
            borderStyle: isAccepting ? 'double' : 'solid',
          },
        };
      })
    );
    setEdges((eds: any[]) =>
      eds.map((e: any) => {
        return {
          ...e,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isDarkMode ? '#e5e7eb' : '#000',
          },
          style: { stroke: isDarkMode ? '#e5e7eb' : '#000', strokeWidth: 2 },
        };
      })
    );
  }, [activeStates, automaton.states, setNodes, setEdges, isDarkMode]);

  const onDownload = () => {
    const el = document.querySelector('.react-flow') as HTMLElement;
    if (el) {
      toPng(el, { backgroundColor: '#fff' }).then((dataUrl) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'automaton.png';
        a.click();
      });
    }
  };

  const onExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(automaton, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'automaton.json';
    a.click();
  };

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
        nodesDraggable={true}
      >
        <Background
          color={isDarkMode ? '#374151' : '#e5e7eb'}
          gap={16}
          size={1}
        />
        <Controls
          showInteractive={false}
          className={isDarkMode ? 'dark-controls' : ''}
        />
        <MiniMap
          zoomable
          pannable
          nodeColor={(n: any) =>
            (n.style?.backgroundColor as string) ||
            (isDarkMode ? '#1f2937' : '#fff')
          }
          maskColor={
            isDarkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(240, 240, 240, 0.6)'
          }
          style={{ backgroundColor: isDarkMode ? '#111827' : '#fff' }}
        />

        <Panel
          position="top-left"
          className="flex gap-2 bg-white/90 dark:bg-gray-900/90 p-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 backdrop-blur-sm"
        >
          <button
            onClick={() => zoomIn()}
            aria-label="Zoom In"
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1 text-xs font-medium"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
            <span className="hidden sm:inline">Zoom In</span>
          </button>
          <button
            onClick={() => zoomOut()}
            aria-label="Zoom Out"
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1 text-xs font-medium"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
            <span className="hidden sm:inline">Zoom Out</span>
          </button>
          <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1 my-1"></div>
          <button
            onClick={() => fitView()}
            aria-label="Fit View"
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1 text-xs font-medium"
            title="Fit to Screen"
          >
            <Maximize className="w-4 h-4" />
            <span className="hidden sm:inline">Fit View</span>
          </button>
          <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1 my-1"></div>
          <div
            className="p-1.5 text-gray-500 dark:text-gray-400 flex items-center gap-1 text-xs font-medium cursor-help"
            title="Click and drag to pan the graph"
          >
            <Navigation className="w-4 h-4" />
            <span className="hidden sm:inline">Pan: Drag</span>
          </div>
        </Panel>

        <Panel position="top-right" className="flex gap-2">
          <button
            onClick={onDownload}
            aria-label="Export as PNG"
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none"
            title="Export PNG"
          >
            <Download className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={onExportJson}
            aria-label="Export as JSON"
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none"
            title="Export JSON"
          >
            <FileJson className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function GraphViewer({
  automaton,
  activeStates = [],
}: {
  automaton: Automaton;
  activeStates?: string[];
}) {
  return (
    <ReactFlowProvider>
      <GraphViewerInner automaton={automaton} activeStates={activeStates} />
    </ReactFlowProvider>
  );
}
