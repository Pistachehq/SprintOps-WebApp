import React from 'react';
import CapacityCard from './CapacityCard';
import PredictionCard from './PredictionCard';
import AssignedTasksCard from './AssignedTasksCard';
import { useAuth } from '../auth/hooks/useAuth';

const SprintMetrics = ({ role, sprintId, issues }) => {
  const { checkPermission } = useAuth();
  const canViewMetrics = checkPermission('canViewMetrics');

  return (
    <div className="space-y-6">
      {canViewMetrics && (
        <>
          <CapacityCard sprintId={sprintId} issues={issues} />
          <PredictionCard />
        </>
      )}
      <AssignedTasksCard role={role} sprintId={sprintId} issues={issues} />
    </div>
  );
};

export default SprintMetrics;
