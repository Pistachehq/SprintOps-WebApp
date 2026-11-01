import React from 'react';
import CapacityCard from './CapacityCard';
import WorkloadCard from './WorkloadCard';
import AssignedTasksCard from './AssignedTasksCard';
import DeveloperKpisPanel from './DeveloperKpisPanel';
import EdgeSuckScroll from '../../components/EdgeSuckScroll';
import { useAuth } from '../auth/hooks/useAuth';

const SprintMetrics = ({ role, sprintId, issues }) => {
  const { checkPermission } = useAuth();
  const canViewMetrics = checkPermission('canViewMetrics');

  return (
    <EdgeSuckScroll className="space-y-6 flex-1 min-h-0 flex flex-col pb-6 pr-1 -mr-1">
      {canViewMetrics && (
        <>
          <CapacityCard sprintId={sprintId} issues={issues} />
          <WorkloadCard issues={issues} />
        </>
      )}
      {canViewMetrics && sprintId && <DeveloperKpisPanel sprintId={sprintId} />}
      <AssignedTasksCard role={role} sprintId={sprintId} issues={issues} />
    </EdgeSuckScroll>
  );
};

export default SprintMetrics;
