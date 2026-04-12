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
import SunNode from './SunNode';
import { issuesRepository } from '../../data/repositories/issuesRepository';
import { sprintsRepository } from '../../data/repositories/sprintsRepository';
import { projectsRepository } from '../../data/repositories/projectsRepository';

const nodeTypes = { issueNode: IssueNode, sunNode: SunNode };

function getSubtreeLeafCount(id, childMap) {
  const children = childMap[id] || [];
  if (children.length === 0) return 1;
  return children.reduce((sum, c) => sum + getSubtreeLeafCount(c.id, childMap), 0);
}

function buildGraph(issues, selectedId, projectName) {
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
    const sizes = [110, 80, 60, 46, 36];
    return sizes[Math.min(depth, sizes.length - 1)];
  };

  const SUN_SIZE = 180;
  const nodes = [];
  const edges = [];

  nodes.push({
    id: 'sun',
    type: 'sunNode',
    position: { x: -SUN_SIZE / 2, y: -SUN_SIZE / 2 },
    data: { label: projectName || 'Proyecto', size: SUN_SIZE },
    draggable: false,
    selectable: false,
  });

  function layoutBranch(issue, originX, originY, angle, dist, depth) {
    const size = getSize(depth);
    const x = originX + Math.cos(angle) * dist;
    const y = originY + Math.sin(angle) * dist;

    nodes.push({
      id: String(issue.id),
      type: 'issueNode',
      position: { x: x - size / 2, y: y - size / 2 },
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

    const childDist = 100 + size * 0.8 + getSize(depth + 1) * 0.5;
    const fanSpread = Math.min(Math.PI * 0.6, children.length * 0.35);
    const startAngle = angle - fanSpread / 2;

    const leafCounts = children.map(c => getSubtreeLeafCount(c.id, childMap));
    const totalLeaves = leafCounts.reduce((a, b) => a + b, 0);

    let accumulated = 0;
    children.forEach((child, ci) => {
      const frac = (accumulated + leafCounts[ci] / 2) / totalLeaves;
      accumulated += leafCounts[ci];
      const childAngle = startAngle + frac * fanSpread;

      layoutBranch(child, x, y, childAngle, childDist, depth + 1);

      edges.push({
        id: `e-${issue.id}-${child.id}`,
        source: String(issue.id),
        target: String(child.id),
        type: 'straight',
        style: {
          stroke: `rgba(140,200,160,${Math.max(0.15, 0.55 - depth * 0.1)})`,
          strokeWidth: Math.max(1, 2.5 - depth * 0.4),
        },
        animated: depth < 1,
      });
    });
  }

  const ORBIT_RADIUS = 280;
  const angleStep = (2 * Math.PI) / Math.max(rootIssues.length, 1);
  const startOffset = -Math.PI / 2;

  rootIssues.forEach((issue, idx) => {
    const angle = startOffset + idx * angleStep;

    layoutBranch(issue, 0, 0, angle, ORBIT_RADIUS, 0);

    edges.push({
      id: `e-sun-${issue.id}`,
      source: 'sun',
      target: String(issue.id),
      type: 'straight',
      style: {
        stroke: 'rgba(232,112,42,0.35)',
        strokeWidth: 2.5,
      },
      animated: true,
    });
  });

  return { nodes, edges };
}

const UniverseFlow = ({ issues, sprintNames, projectName }) => {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const { setCenter } = useReactFlow();

  const { nodes, edges } = useMemo(
    () => buildGraph(issues, selectedIssue?.id, projectName),
    [issues, selectedIssue, projectName]
  );

  const onNodeClick = useCallback((_event, node) => {
    if (node.id === 'sun') return;
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
        fitViewOptions={{ padding: 0.25 }}
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
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [sprintsData, projectData] = await Promise.all([
          sprintsRepository.getByProjectId(projectId),
          projectsRepository.getById(projectId).catch(() => null),
        ]);

        setProjectName(projectData?.name || 'Proyecto');

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
        @keyframes sunPulse {
          0%, 100% { box-shadow: 0 0 60px rgba(232,112,42,0.6), 0 0 120px rgba(232,112,42,0.3), 0 0 200px rgba(192,57,43,0.2), inset 0 0 30px rgba(255,255,255,0.15); }
          50% { box-shadow: 0 0 80px rgba(232,112,42,0.7), 0 0 160px rgba(232,112,42,0.4), 0 0 250px rgba(192,57,43,0.25), inset 0 0 40px rgba(255,255,255,0.2); }
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
          filter: drop-shadow(0 0 6px rgba(140,200,160,0.3));
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
            <UniverseFlow issues={issues} sprintNames={sprintNames} projectName={projectName} />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
};

export default IssueUniversePage;
