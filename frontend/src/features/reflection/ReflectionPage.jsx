import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import SprintTabs from '../../components/ui/SprintTabs';
import { useAuth } from '../auth/hooks/useAuth';
import RetrospectiveForm from './RetrospectiveForm';
import HealthCheckCard from './HealthCheckCard';
import VelocityChart from './VelocityChart';
import StandupParticipationCard from './StandupParticipationCard';
import SprintIndicatorCard from './SprintIndicatorCard';

const ReflectionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, checkPermission } = useAuth();

  const role = (user?.role || 'developer').toLowerCase();
  const isDev = role === 'developer';

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto font-sans">
      {/* Metrics row - only for users with checkPermission('canViewMetrics') */}
        {checkPermission('canViewMetrics') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VelocityChart />
            <SprintIndicatorCard />
          </div>
        )}

        {/* Retrospective + Health Check */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <RetrospectiveForm />
          <HealthCheckCard />
      </div>
    </div>
  );
};

export default ReflectionPage;
