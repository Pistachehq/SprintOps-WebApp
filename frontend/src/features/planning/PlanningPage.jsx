import React from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import TaskList from './TaskList';
import SprintMetrics from './SprintMetrics';
import DevTasksView from './DevTasksView';
import { useAuth } from '../auth/hooks/useAuth';
import { useIssues } from '../issues/hooks/useIssues';

const PlanningPage = () => {
  const { id } = useParams();
  const { user, checkPermission } = useAuth();
  const issuesData = useIssues(id);
  const role = user?.role || 'developer';

  const canViewAllIssues = checkPermission('canViewAllIssues');
  const { setShowCreateIssue } = useOutletContext();

  const gridClass =
    'grid min-h-0 flex-1 grid-cols-1 gap-10 lg:h-full lg:min-h-0 lg:grid-cols-3 lg:items-stretch lg:gap-10 lg:overflow-hidden lg:[grid-template-rows:minmax(0,1fr)]';

  const colMain =
    'flex min-h-[min(420px,50vh)] flex-col max-lg:overflow-y-auto lg:col-span-2 lg:h-full lg:max-h-full lg:min-h-0 lg:overflow-hidden';
  const colSide =
    'flex min-h-[min(320px,40vh)] flex-col max-lg:overflow-y-auto lg:h-full lg:max-h-full lg:min-h-0 lg:overflow-hidden';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto font-sans lg:h-full lg:overflow-hidden">
        {!canViewAllIssues ? (
          <div className={gridClass}>
            <div className={colMain}>
              <DevTasksView sprintId={id} issuesData={issuesData} />
            </div>
            <div className={colSide}>
              <SprintMetrics role={role} sprintId={id} issues={issuesData.issues} />
            </div>
          </div>
        ) : (
          <div className={gridClass}>
            <div className={colMain}>
              <TaskList role={role} sprintId={id} issuesData={issuesData} />
            </div>
            <div className={colSide}>
              <SprintMetrics role={role} sprintId={id} issues={issuesData.issues} />
            </div>
          </div>
        )}
    </div>
  );
};

export default PlanningPage;
