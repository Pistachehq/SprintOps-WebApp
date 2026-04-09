import React from 'react';
import CapacityCard from './CapacityCard';
import PredictionCard from './PredictionCard';
import AssignedTasksCard from './AssignedTasksCard';

const SprintMetrics = ({ role, sprintId }) => {
  const isDev = role === 'developer';
  const isScrum = role === 'scrumMaster';
  const isOwner = role === 'productOwner';

  return (
    <div className="space-y-6">
      {(isScrum || isOwner) && (
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
