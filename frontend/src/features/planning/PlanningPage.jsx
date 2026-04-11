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

  return (
    <div className="h-full font-sans">

        {!canViewAllIssues ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <DevTasksView sprintId={id} issuesData={issuesData} />
            </div>
            <div>
              <SprintMetrics role={role} sprintId={id} issues={issuesData.issues} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <TaskList role={role} sprintId={id} issuesData={issuesData} />
            </div>
            <div>
              <SprintMetrics role={role} sprintId={id} issues={issuesData.issues} />
            </div>
          </div>
        )}
    </div>
  );
};

export default PlanningPage;
