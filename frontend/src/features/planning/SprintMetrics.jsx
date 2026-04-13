import React from 'react';
import CapacityCard from './CapacityCard';
import WorkloadCard from './WorkloadCard';
import AssignedTasksCard from './AssignedTasksCard';
import { useAuth } from '../auth/hooks/useAuth';

const SprintMetrics = ({ role, sprintId, issues }) => {
  const { checkPermission } = useAuth();
  const canViewMetrics = checkPermission('canViewMetrics');

  return (
    <div className="space-y-6 flex-1 min-h-0 overflow-y-auto flex flex-col pb-6 pr-1 -mr-1" style={{ scrollbarWidth: 'thin' }}>
      {canViewMetrics && (
        <>
          <CapacityCard sprintId={sprintId} issues={issues} />
          <WorkloadCard issues={issues} />
        </>
      )}
      <AssignedTasksCard role={role} sprintId={sprintId} issues={issues} />
    </div>
  );
};

export default SprintMetrics;
