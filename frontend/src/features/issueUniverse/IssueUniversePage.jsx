import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, X, Orbit } from 'lucide-react';
import IssueNode from './IssueNode';
import { issuesRepository } from '../../data/repositories/issuesRepository';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';

const nodeTypes = { issueNode: IssueNode };

function getSubtreeWidth(id, childMap, depthSizes) {
  const children = childMap[id] || [];
  if (children.length === 0) return depthSizes(0);
  let total = 0;
  children.forEach(c => {
    total += getSubtreeWidth(c.id, childMap, depthSizes);
  });
  return Math.max(total, depthSizes(0));
}

function buildGraph(issues, selectedId) {
  const childMap = {};
  issues.forEach(issue => {
    if (issue.parentIssueId) {
      if (!childMap[issue.parentIssueId]) childMap[issue.parentIssueId] = [];
      childMap[issue.parentIssueId].push(issue);
    }
  });

  const rootIssues = issues.filter(i => !i.parentIssueId);
  const hasChildren = (id) => (childMap[id]?.length || 0) > 0;

  const getSize = (depth) => {
    const sizes = [120, 85, 65, 50, 40];
    return sizes[Math.min(depth, sizes.length - 1)];
  };

  const nodes = [];
  const edges = [];

  function layoutNode(issue, x, y, depth, availableWidth) {
    const size = getSize(depth);

    nodes.push({
      id: String(issue.id),
      type: 'issueNode',
      position: { x: x - size / 2, y },
      data: {
        label: `#${issue.displayIndex || issue.id}`,
        size,
        depth,
        isSelected: issue.id === selectedId,
        hasChildren: hasChildren(issue.id),
      },
    });

    const children = childMap[issue.id] || [];
    if (children.length === 0) return;

    const VERTICAL_GAP = 120 + size * 0.5;
    const childY = y + VERTICAL_GAP;

    const subtreeWidths = children.map(c => {
      const cSize = getSize(depth + 1);
      const stw = getSubtreeWidth(c.id, childMap, () => cSize * 2.2);
      return Math.max(stw, cSize * 2.2);
    });
    const totalWidth = subtreeWidths.reduce((a, b) => a + b, 0);

    let startX = x - totalWidth / 2;

    children.forEach((child, ci) => {
      const childX = startX + subtreeWidths[ci] / 2;
      startX += subtreeWidths[ci];

      layoutNode(child, childX, childY, depth + 1, subtreeWidths[ci]);

      edges.push({
        id: `e-${issue.id}-${child.id}`,
        source: String(issue.id),
        target: String(child.id),
        type: 'default',
        style: {
          stroke: `rgba(140,200,160,${Math.max(0.2, 0.6 - depth * 0.1)})`,
          strokeWidth: Math.max(1, 3 - depth * 0.5),
        },
        animated: depth < 2,
      });
    });
  }

  const ROOT_GAP = 500;
  const rootSubtreeWidths = rootIssues.map(r => {
    const stw = getSubtreeWidth(r.id, childMap, () => getSize(1) * 2.2);
    return Math.max(stw, getSize(0) * 3);
  });
  const totalRootWidth = rootSubtreeWidths.reduce((a, b) => a + b, 0)
    + (rootIssues.length - 1) * ROOT_GAP;

  let rootStartX = -totalRootWidth / 2;

  rootIssues.forEach((issue, idx) => {
    const w = rootSubtreeWidths[idx];
    const cx = rootStartX + w / 2;
    rootStartX += w + ROOT_GAP;

    layoutNode(issue, cx, 0, 0, w);
  });

  return { nodes, edges };
}

const UniverseFlow = ({ issues, sprintNames }) => {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const { setCenter } = useReactFlow();

  const { nodes, edges } = useMemo(
    () => buildGraph(issues, selectedIssue?.id),
    [issues, selectedIssue]
  );

  const onNodeClick = useCallback((_event, node) => {
    const issue = issues.find(i => String(i.id) === node.id);
    if (!issue) return;
    setSelectedIssue(issue);

    const size = node.data.size || 80;
    setCenter(
      node.position.x + size / 2,
      node.position.y + size / 2,
      { zoom: 1.5, duration: 800 }
    );
  }, [issues, setCenter]);

  const getSprintName = (sprintId) => {
    if (!sprintId) return 'Sin sprint';
    return sprintNames[sprintId] || `Sprint ${sprintId}`;
  };

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedIssue(null)}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.05}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Controls
          showInteractive={false}
          className="!bg-white/10 !backdrop-blur-md !border-white/20 !rounded-2xl !shadow-2xl [&>button]:!bg-white/10 [&>button]:!border-white/10 [&>button]:!text-white [&>button:hover]:!bg-white/20"
        />
      </ReactFlow>

      {selectedIssue && (
        <div
          className="absolute top-24 right-8 w-80 z-50"
          style={{ animation: 'cardIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-6 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, #446E51, #6B9F7B, #446E51)' }}
            />

            <button
              onClick={() => setSelectedIssue(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-gray-500" />
            </button>

            <p className="text-5xl font-black text-[#446E51] mb-1 tracking-tight">
              #{selectedIssue.displayIndex || selectedIssue.id}
            </p>
            <h3 className="text-lg font-bold text-gray-800 mb-4 leading-snug pr-6">
              {selectedIssue.title}
            </h3>

            {selectedIssue.purpose && (
              <div className="mb-4 p-3 bg-[#446E51]/5 rounded-xl">
                <p className="text-[10px] font-bold text-[#446E51] uppercase tracking-widest mb-1">Propósito</p>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedIssue.purpose}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sprint</p>
                <p className="text-sm font-bold text-gray-700">{getSprintName(selectedIssue.sprintId)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Story Points</p>
                <p className="text-sm font-bold text-[#446E51]">{selectedIssue.storyPoints || 0} SP</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const IssueUniversePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [sprintNames, setSprintNames] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const sprintsData = await sprintsRepository.getByProjectId(projectId);
        const names = {};
        (sprintsData || []).forEach(s => { names[String(s.id)] = s.name; });
        setSprintNames(names);

        const allIssues = [];
        const seenIds = new Set();

        for (const sprint of (sprintsData || [])) {
          const sprintIssues = await issuesRepository.getBySprintId(sprint.id).catch(() => []);
          (sprintIssues || []).forEach(issue => {
            if (!seenIds.has(issue.id)) {
              seenIds.add(issue.id);
              allIssues.push(issue);
            }
          });
        }

        const indexed = allIssues.map((issue, idx) => ({
          ...issue,
          displayIndex: idx + 1,
        }));
        setIssues(indexed);
      } catch (err) {
        console.error('Error fetching universe data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1a14 0%, #1a2e22 30%, #0d1910 70%, #162319 100%)' }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.02); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateX(20px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.8; }
        }
        .react-flow__edge path {
          filter: drop-shadow(0 0 6px rgba(140,200,160,0.4));
        }
      `}</style>

      <div className="h-16 px-6 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/10 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={18} className="text-white/80" />
          </button>
          <div className="flex items-center gap-2">
            <Orbit size={20} className="text-[#6B9F7B]" />
            <h1 className="text-xl font-black text-white tracking-tight">Universo de Issues</h1>
          </div>
        </div>
        <p className="text-sm font-medium text-white/40">
          {issues.length} issue{issues.length !== 1 ? 's' : ''} en el proyecto
        </p>
      </div>

      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2.5 + 0.5,
                height: Math.random() * 2.5 + 0.5,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.3 + 0.05,
                animation: `twinkle ${2 + Math.random() * 5}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {isLoading ? (
          <div className="h-full flex items-center justify-center relative z-10">
            <div className="text-center">
              <div className="w-14 h-14 border-4 border-white/10 border-t-[#6B9F7B] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/50 font-bold">Cargando universo...</p>
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="h-full flex items-center justify-center relative z-10">
            <div className="text-center">
              <Orbit size={48} className="text-white/20 mx-auto mb-4" />
              <p className="text-white/40 font-bold text-lg">No hay issues en este proyecto</p>
              <p className="text-white/20 text-sm mt-2">Crea issues para verlos aquí.</p>
            </div>
          </div>
        ) : (
          <ReactFlowProvider>
            <UniverseFlow issues={issues} sprintNames={sprintNames} />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
};

export default IssueUniversePage;
