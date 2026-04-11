import React from 'react';
import CapacityCard from './CapacityCard';
import PredictionCard from './PredictionCard';
import AssignedTasksCard from './AssignedTasksCard';
import { useAuth } from '../auth/hooks/useAuth';

const SprintMetrics = ({ role, sprintId }) => {
  const { checkPermission } = useAuth();
  const canViewMetrics = checkPermission('canViewMetrics');

  return (
    <div className="space-y-6">
      {canViewMetrics && (
        <>
          <CapacityCard />
          <PredictionCard />
        </>
      )}
      <AssignedTasksCard role={role} sprintId={sprintId} />
    </div>
  );
};

export default SprintMetrics;
