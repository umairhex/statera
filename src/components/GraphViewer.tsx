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
  Maximize,
  Map as MapIcon,
  HelpCircle,
  Zap,
  Info,
  Loader,
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

const isDeadState = (stateId: string, acceptStates: string[], transitions: any[]): boolean => {
  if (acceptStates.includes(stateId)) return false;
  const visited = new Set<string>();
  const queue = [stateId];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (acceptStates.includes(current)) return false;
    if (visited.has(current)) continue;
    visited.add(current);
    
    const reachable = transitions
      .filter(t => t.from === current)
      .map(t => t.to)
      .filter(to => !visited.has(to));
    queue.push(...reachable);
  }
  return true;
};

const isStateUnreachable = (stateId: string, startState: string, transitions: any[]): boolean => {
  if (stateId === startState) return false;
  const visited = new Set<string>();
  const queue = [startState];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === stateId) return false;
    if (visited.has(current)) continue;
    visited.add(current);
    
    const reachable = transitions
      .filter(t => t.from === current)
      .map(t => t.to)
      .filter(to => !visited.has(to));
    queue.push(...reachable);
  }
  return true;
};

const getStateStyle = (
  stateId: string,
  isStartState: boolean,
  isAccepting: boolean,
  isActive: boolean,
  isDead: boolean,
  isDarkMode: boolean
) => {
 
  let bgColor: string;
  let borderColor: string;
  let textColor: string;

  if (isDead) {
   
    bgColor = isDarkMode ? '#7f1d1d' : '#ffe4e6';
    borderColor = isDarkMode ? '#dc2626' : '#fb7185';
    textColor = isDarkMode ? '#fca5ac' : '#be123c';
  } else if (isActive) {
   
    bgColor = isDarkMode ? '#ca8a04' : '#fef08a';
    borderColor = '#ca8a04';
    textColor = isDarkMode ? '#fff' : '#000';
  } else if (isStartState && isAccepting) {
   
    bgColor = isDarkMode ? '#0d9488' : '#ccfbf1';
    borderColor = isDarkMode ? '#14b8a6' : '#06b6d4';
    textColor = isDarkMode ? '#fff' : '#000';
  } else if (isStartState) {
   
    bgColor = isDarkMode ? '#0c4a6e' : '#dbeafe';
    borderColor = isDarkMode ? '#0284c7' : '#0284c7';
    textColor = isDarkMode ? '#fff' : '#000';
  } else if (isAccepting) {
   
    bgColor = isDarkMode ? '#6d28d9' : '#f3e8ff';
    borderColor = isDarkMode ? '#a78bfa' : '#a78bfa';
    textColor = isDarkMode ? '#fff' : '#000';
  } else {
   
    bgColor = isDarkMode ? '#1f2937' : '#fff';
    borderColor = isDarkMode ? '#4b5563' : '#d1d5db';
    textColor = isDarkMode ? '#e5e7eb' : '#000';
  }

  return {
    bgColor,
    borderColor,
    textColor,
    borderWidth: isAccepting ? 3 : 2,
    borderStyle: isAccepting ? 'solid' : 'solid',
  };
};

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
  const [showMinimap, setShowMinimap] = useState(true);
  const [exportingPng, setExportingPng] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const { zoomIn, zoomOut, getZoom } = useReactFlow();

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
      const isStart = state.id === automaton.startState;
      const isDead = isDeadState(state.id, automaton.acceptStates, automaton.transitions);
      
      const styling = getStateStyle(
        state.id,
        isStart,
        state.isAccepting,
        isActive,
        isDead,
        isDarkMode
      );

      return {
        id: state.id,
        data: { 
          label: state.id,
          isStart,
          isAccepting: state.isAccepting,
          isDead,
        },
        position: { x: 0, y: 0 },
        className: `${isDead ? 'state-dead' : ''} ${state.isAccepting && !isStart && !isDead ? 'state-accepting-pattern' : ''} ${isStart && state.isAccepting ? 'state-start-accepting-pattern' : ''}`,
        style: {
          borderRadius: '50%',
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: styling.borderWidth,
          borderStyle: styling.borderStyle,
          borderColor: styling.borderColor,
          backgroundColor: styling.bgColor,
          color: styling.textColor,
          fontWeight: 'bold',
          fontSize: '13px',
          boxShadow:
            '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          transition: 'all 200ms ease-in-out',
          cursor: 'grab',
        },
        sourcePosition: 'right',
        targetPosition: 'left',
      };
    });

    initialNodes.push({
      id: 'start-dummy',
      data: { label: '⟶ START' },
      position: { x: 0, y: 0 },
      style: {
        width: 80,
        height: 28,
        border: '2px solid #0284c7',
        background: isDarkMode ? 'rgba(2, 132, 199, 0.1)' : 'rgba(2, 132, 199, 0.05)',
        fontSize: 11,
        fontWeight: 'bold',
        color: isDarkMode ? '#06b6d4' : '#0284c7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '0.5px',
        borderRadius: '4px',
        backdropFilter: 'blur(4px)',
      },
      sourcePosition: 'right',
      targetPosition: 'left',
    });

    const edgeMap = new Map();
    automaton.transitions.forEach((t) => {
      const key = `${t.from}-${t.to}`;
      if (!edgeMap.has(key)) edgeMap.set(key, []);
      edgeMap.get(key)!.push(t.symbol);
    });

    const initialEdges: any[] = Array.from(edgeMap.entries()).map(
      (entry: any, index: number) => {
        const [key, symbols] = entry as [string, string[]];
        const [source, target] = key.split('-');
        const isSelfLoop = source === target;
        const isBidirectional =
          !isSelfLoop && edgeMap.has(`${target}-${source}`);
        const labelText = symbols.join(', ');

        return {
          id: `e${index}`,
          source,
          target,
          label: labelText,
          data: { isSelfLoop, isBidirectional, symbols },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isDarkMode ? '#e5e7eb' : '#000',
          },
          style: {
            stroke: isDarkMode ? '#e5e7eb' : '#000',
            strokeWidth: 2,
            textAlign: 'center',
          },
          labelStyle: {
            backgroundColor: isDarkMode ? '#1f2937' : '#fff',
            color: isDarkMode ? '#e5e7eb' : '#000',
            fontSize: '12px',
            fontWeight: 500,
            padding: '2px 4px',
            borderRadius: '4px',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
          },
          type: 'custom',
        };
      }
    );

    initialEdges.push({
      id: 'e-start',
      source: 'start-dummy',
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
  }, [automaton, isDarkMode]);

  useEffect(() => {
    setNodes((nds: any[]) =>
      nds.map((n: any) => {
        if (n.id === 'start-dummy') {
          return {
            ...n,
            style: {
              ...n.style,
              background: isDarkMode ? 'rgba(2, 132, 199, 0.1)' : 'rgba(2, 132, 199, 0.05)',
              color: isDarkMode ? '#06b6d4' : '#0284c7',
            },
          };
        }

        const isActive = activeStates.includes(n.id);
        const stateData = automaton.states.find((s) => s.id === n.id);
        if (!stateData) return n;

        const isStart = n.data.isStart;
        const isDead = isDeadState(n.id, automaton.acceptStates, automaton.transitions);
        
        const styling = getStateStyle(
          n.id,
          isStart,
          stateData.isAccepting,
          isActive,
          isDead,
          isDarkMode
        );

        return {
          ...n,
          className: `${isDead ? 'state-dead' : ''} ${stateData.isAccepting && !isStart && !isDead ? 'state-accepting-pattern' : ''} ${isStart && stateData.isAccepting ? 'state-start-accepting-pattern' : ''}`,
          style: {
            ...n.style,
            borderRadius: '50%',
            borderWidth: styling.borderWidth,
            borderStyle: styling.borderStyle,
            borderColor: styling.borderColor,
            backgroundColor: styling.bgColor,
            color: styling.textColor,
            height: 50,
            width: 50,
            fontSize: '13px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isActive
              ? '0 0 20px rgba(202, 138, 4, 0.5), 0 4px 12px rgba(0, 0, 0, 0.15)'
              : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            transition: 'all 200ms ease-in-out',
            cursor: 'grab',
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
          style: {
            stroke: isDarkMode ? '#e5e7eb' : '#000',
            strokeWidth: 2,
            transition: 'all 200ms ease-in-out',
          },
          labelStyle: {
            backgroundColor: isDarkMode ? '#1f2937' : '#fff',
            color: isDarkMode ? '#e5e7eb' : '#000',
            fontSize: '12px',
            fontWeight: 500,
            padding: '2px 4px',
            borderRadius: '4px',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
          },
        };
      })
    );
  }, [activeStates, automaton, isDarkMode]);

  const onDownload = async () => {
    setExportingPng(true);
    try {
      const el = document.querySelector('.react-flow') as HTMLElement;
      if (el) {
        const dataUrl = await toPng(el, { backgroundColor: '#fff' });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'automaton.png';
        a.click();
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 2000);
      }
    } catch (err) {
      console.error('LOG: PNG export failed', err);
    } finally {
      setExportingPng(false);
    }
  };

  const onExportJson = () => {
    try {
      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(automaton, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = 'automaton.json';
      a.click();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (err) {
      console.error('ERROR: JSON export failed', err);
    }
  };

    const SymbolLegend = () => {
    const symbolsSet = new Set<string>();
    edges.forEach((edge) => {
      if (edge.data?.symbols) {
        (edge.data.symbols as string[]).forEach((s) => symbolsSet.add(s));
      }
    });
    
    const symbols = Array.from(symbolsSet).sort();
    if (symbols.length === 0) return null;
    
   
    const getSymbolColor = (symbol: string, isDark: boolean): string => {
      const colors = isDark ? [
        '#60a5fa', '#34d399', '#fbbf24', '#f87171',
        '#a78bfa', '#06b6d4', '#fb923c', '#ec4899',
      ] : [
        '#2563eb', '#059669', '#d97706', '#dc2626',
        '#7c3aed', '#0891b2', '#ea580c', '#db2777',
      ];
      let hash = 0;
      for (let i = 0; i < symbol.length; i++) {
        hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
        hash = hash & hash;
      }
      return colors[Math.abs(hash) % colors.length];
    };
    
    return (
      <div className="flex gap-3 flex-wrap">
        {symbols.map((symbol) => (
          <div key={symbol} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shadow-md"
              style={{ backgroundColor: getSymbolColor(symbol, isDarkMode) }}
              title={`Symbol: ${symbol}`}
            />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{symbol}</span>
          </div>
        ))}
      </div>
    );
  };

  

    const StatsPanel = () => {
    if (!automaton || automaton.states.length === 0) return null;
    const transitionCount = automaton.transitions.length;
    const acceptingCount = automaton.states.filter((s) => s.isAccepting).length;
    return (
      <div className="bg-white/90 dark:bg-gray-900/90 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 backdrop-blur-sm text-xs">
        <div className="flex gap-3 text-gray-700 dark:text-gray-300">
          <div>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {automaton.states.length}
            </span>{' '}
            states
          </div>
          <div>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {acceptingCount}
            </span>{' '}
            accept
          </div>
          <div>
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {transitionCount}
            </span>{' '}
            transitions
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    >
      {(!automaton || automaton.states.length === 0) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none">
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              No automaton generated
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter a valid regular expression to visualize
            </p>
          </div>
        </div>
      )}
     
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onMove={() => setCurrentZoom(getZoom())}
        fitView
        attributionPosition="bottom-right"
        nodesDraggable={true}
        edgesReconnectable={false}
        minZoom={0.1}
        maxZoom={4}
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
        {showMinimap && (
          <MiniMap
            zoomable
            pannable
            nodeColor={(n: any) => {
              if (n.id === 'start-dummy') {
                return '#0284c7';
              }
              const state = automaton.states.find((s) => s.id === n.id);
              const isDead = isDeadState(n.id, automaton.acceptStates, automaton.transitions);
              
              if (isDead) {
                return isDarkMode ? '#dc2626' : '#fb7185';
              }
              if (n.id === automaton.startState && state?.isAccepting) {
                return isDarkMode ? '#0d9488' : '#ccfbf1';
              }
              if (n.id === automaton.startState) {
                return isDarkMode ? '#0c4a6e' : '#dbeafe';
              }
              if (state?.isAccepting) {
                return isDarkMode ? '#6d28d9' : '#f3e8ff';
              }
              return isDarkMode ? '#1f2937' : '#fff';
            }}
            maskColor={
              isDarkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(240, 240, 240, 0.6)'
            }
            style={{ 
              backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
              border: `2px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
              borderRadius: '6px',
              boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          />
        )}

        <Panel position="top-left" className="flex gap-2 items-center">
          <div className="flex gap-2 bg-white/90 dark:bg-gray-900/90 p-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 backdrop-blur-sm">
            <button
              onClick={() => setShowMinimap(!showMinimap)}
              aria-label="Toggle Minimap"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1 text-xs font-medium hover:text-blue-600 dark:hover:text-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              title={showMinimap ? 'Hide Minimap (M)' : 'Show Minimap (M)'}
            >
              <MapIcon className="w-4 h-4" />
              <span className="hidden sm:inline">
                {showMinimap ? 'Hide' : 'Show'} Map
              </span>
            </button>
          </div>

          <StatsPanel />
        </Panel>

        <Panel position="top-right" className="flex gap-2">
          <div className="px-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {(currentZoom * 100).toFixed(0)}%
          </div>

          <div className="flex gap-2">
            <button
              onClick={onDownload}
              disabled={exportingPng}
              aria-label="Export as PNG"
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:text-blue-600 dark:hover:text-blue-400"
              title="Export PNG"
            >
              {exportingPng ? (
                <Loader className="w-4 h-4 text-gray-700 dark:text-gray-300 animate-spin" />
              ) : exportSuccess ? (
                <span className="text-green-600 dark:text-green-400 font-bold">
                  ✓
                </span>
              ) : (
                <Download className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              )}
            </button>
            <button
              onClick={onExportJson}
              aria-label="Export as JSON"
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors hover:text-blue-600 dark:hover:text-blue-400"
              title="Export JSON"
            >
              {exportSuccess ? (
                <span className="text-green-600 dark:text-green-400 font-bold">
                  ✓
                </span>
              ) : (
                <FileJson className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </Panel>

        <Panel position="bottom-center" className="flex gap-2 bg-white/90 dark:bg-gray-900/90 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 backdrop-blur-sm">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap pt-0.5">Symbols:</span>
          <SymbolLegend />
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
