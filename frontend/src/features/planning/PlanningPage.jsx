import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import SprintTabs from '../../components/ui/SprintTabs';
import TaskList from './TaskList';
import SprintMetrics from './SprintMetrics';
import DevTasksView from './DevTasksView';
import CreateIssueModal from '../issues/CreateIssueModal';
import { useAuth } from '../auth/hooks/useAuth';
import { useIssues } from '../issues/hooks/useIssues';

const PlanningPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, checkPermission } = useAuth();
  const { addIssue } = useIssues(id);
  const role = user?.role || 'developer';

  const isDev = role === 'developer';
  const canCreateIssue = checkPermission('canCreateIssue');
  const { setShowCreateIssue } = useOutletContext();

  return (
    <div className="h-full font-sans">

        {isDev ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <DevTasksView sprintId={id} />
            </div>
            <div>
              <SprintMetrics role={role} sprintId={id} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <TaskList role={role} sprintId={id} />
            </div>
            <div>
              <SprintMetrics role={role} sprintId={id} />
            </div>
          </div>
        )}
    </div>
  );
};

export default PlanningPage;
