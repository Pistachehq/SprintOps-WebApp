import React, { useState, useEffect } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import BackButton from '../../../components/ui/BackButton';
import SprintTabs from '../../../components/ui/SprintTabs';
import CreateIssueModal from '../../issues/CreateIssueModal';
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

  useEffect(() => {
    sprintsRepository.getById(id).then(sprint => {
      if (sprint?.name) setSprintName(sprint.name);
      if (sprint?.projectId) {
        refreshPermissionsForProject(sprint.projectId);
      }
    }).catch(() => {});
  }, [id]);

  const canCreateIssue = checkPermission('canCreateIssue');

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

  const handleCreateIssue = (newIssue) => {
    addIssue({
      ...newIssue,
      sprintId: id,
      status: 'todo'
    });
  };

  return (
    <div className="h-full flex flex-col p-10 bg-oracle-bg overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
        {/* ── Static Header (Does not move during transitions) ── */}
        <header className="grid grid-cols-3 items-center mb-10">
          <div className="flex items-center gap-4">
            <BackButton to={`/sprint/${id}`} />
            <h1 className="text-4xl font-black text-slate-800 tracking-tight transition-all duration-300">
              {title === 'Kanban' ? `${sprintName || `Sprint ${id}`}: ${title}` : title}
            </h1>
          </div>

          <div className="flex justify-center">
            <SprintTabs activeTab={tab} sprintId={id} />
          </div>

          <div className="flex justify-end items-center gap-4 h-11">
            <AnimatePresence>
              {showButton && canCreateIssue && (
                <motion.button
                  key="create-button"
                  initial={{ opacity: 0, scale: 0.9, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 10 }}
                  onClick={() => setShowCreateIssue(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={16} /> Crear Issue
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* ── Animated Content Area ── */}
        <main className="flex-1 relative">
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
              className="h-full"
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
    </div>
  );
};

export default SprintSubLayout;
