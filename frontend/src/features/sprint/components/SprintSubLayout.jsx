import React, { useState, useEffect } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Plus, Target } from 'lucide-react';
import BackButton from '../../../components/ui/BackButton';
import SprintTabs from '../../../components/ui/SprintTabs';
import Modal from '../../../components/Modal';
import CreateIssueModal from '../../issues/CreateIssueModal';
import VelocityChart from '../../reflection/VelocityChart';
import SprintIndicatorCard from '../../reflection/SprintIndicatorCard';
import { useAuth } from '../../auth/hooks/useAuth';
import { useIssues } from '../../issues/hooks/useIssues';
import { sprintsRepository } from '../../../data/repositories/sprintsRepository';

const SprintSubLayout = () => {
  const { id } = useParams();
  const location = useLocation();
  const { checkPermission, refreshPermissionsForProject } = useAuth();
  const { issues, addIssue } = useIssues(id);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [velocityModalOpen, setVelocityModalOpen] = useState(false);
  const [sprintIndicatorModalOpen, setSprintIndicatorModalOpen] = useState(false);

  useEffect(() => {
    setSprintName('');
    setProjectId(null);
    sprintsRepository.getById(id).then(sprint => {
      if (sprint?.name) setSprintName(sprint.name);
      if (sprint?.projectId != null) setProjectId(sprint.projectId);
      if (sprint?.projectId) {
        refreshPermissionsForProject(sprint.projectId);
      }
    }).catch(() => {});
  }, [id]);

  /**
   * Determine page-specific header content based on route
   */
  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path.includes('/planning')) {
      return { title: 'Planeación', showButton: true, tab: 'planning' };
    }
    if (path.includes('/issues')) {
      return { title: 'Kanban', showButton: true, tab: 'issues' };
    }
    if (path.includes('/reflection')) {
      return { title: 'Reflexión', showButton: false, tab: 'reflection' };
    }
    return { title: 'Sprint', showButton: false, tab: '' };
  };

  const { title, showButton, tab } = getHeaderInfo();
  const canCreateIssue = checkPermission('canCreateIssue');
  const canViewMetrics = checkPermission('canViewMetrics');

  useEffect(() => {
    if (tab !== 'reflection') {
      setVelocityModalOpen(false);
      setSprintIndicatorModalOpen(false);
    }
  }, [tab]);

  const handleCreateIssue = (newIssue) => {
    addIssue({
      ...newIssue,
      sprintId: id,
      status: 'todo'
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-10 bg-oracle-bg">
      <div className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col overflow-hidden">
        {/* ── Static Header (Does not move during transitions) ── */}
        <header className="mb-10 grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <BackButton to={`/sprint/${id}`} />
            <h1 className="truncate text-4xl font-black tracking-tight text-slate-800 transition-all duration-300">
              {title === 'Kanban' ? `${sprintName || `Sprint ${id}`}: ${title}` : title}
            </h1>
          </div>

          <div className="flex justify-center">
            <SprintTabs activeTab={tab} sprintId={id} />
          </div>

          <div className="flex min-w-0 flex-nowrap items-center justify-end gap-2 sm:gap-3">
            <AnimatePresence mode="popLayout">
              {showButton && canCreateIssue && (
                <motion.button
                  key="create-button"
                  initial={{ opacity: 0, scale: 0.9, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 10 }}
                  onClick={() => setShowCreateIssue(true)}
                  className="btn-primary flex shrink-0 items-center gap-2"
                >
                  <Plus size={16} /> Crear Issue
                </motion.button>
              )}
            </AnimatePresence>
            {tab === 'reflection' && canViewMetrics && (
              <div className="flex shrink-0 flex-nowrap items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setVelocityModalOpen(true)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 sm:gap-2 sm:px-3 sm:text-xs"
                >
                  <Activity size={15} className="shrink-0 text-oracle-red sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Velocidad histórica</span>
                  <span className="sm:hidden">Velocidad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSprintIndicatorModalOpen(true)}
                  title="Issues y story points enviados al siguiente sprint desde el Kanban"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 sm:gap-2 sm:px-3 sm:text-xs"
                >
                  <Target size={15} className="shrink-0 text-oracle-red sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Estimación de deuda</span>
                  <span className="sm:hidden">Deuda</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ── Animated Content Area ── */}
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ 
                duration: 0.5, 
                ease: [0.16, 1, 0.3, 1] // Custom ease-out cubic
              }}
              className="flex h-full min-h-0 flex-1 flex-col"
            >
              <Outlet context={{ setShowCreateIssue }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CreateIssueModal
        isOpen={showCreateIssue}
        onClose={() => setShowCreateIssue(false)}
        onCreate={handleCreateIssue}
        sprintIssues={issues}
      />

      {canViewMetrics && (
        <>
          <Modal
            isOpen={velocityModalOpen}
            onClose={() => setVelocityModalOpen(false)}
            title="Velocidad histórica"
            maxWidthClass="max-w-4xl"
            bodyClassName="p-4 sm:p-6"
          >
            <VelocityChart embedded projectId={projectId} currentSprintId={id} />
          </Modal>
          <Modal
            isOpen={sprintIndicatorModalOpen}
            onClose={() => setSprintIndicatorModalOpen(false)}
            title="Estimación de deuda"
            maxWidthClass="max-w-lg"
            bodyClassName="p-4 sm:p-6"
          >
            <SprintIndicatorCard
              embedded
              projectId={projectId}
              currentSprintId={id}
              refreshWhenOpen={sprintIndicatorModalOpen}
            />
          </Modal>
        </>
      )}
    </div>
  );
};

export default SprintSubLayout;
