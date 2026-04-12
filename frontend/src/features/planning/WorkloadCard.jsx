import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Scale, UserX } from 'lucide-react';
import apiClient from '../../data/api/apiClient';

const WorkloadCard = ({ issues = [] }) => {
  const [userCache, setUserCache] = useState({});

  const { workload, unassignedSP, unassignedCount } = useMemo(() => {
    const wl = {};
    let uSP = 0;
    let uCount = 0;

    issues.forEach(issue => {
      const sp = issue.storyPoints || 0;
      if (!issue.assigneeIds?.length) {
        uSP += sp;
        uCount++;
        return;
      }
      const spPerUser = sp / issue.assigneeIds.length;
      issue.assigneeIds.forEach(uid => {
        wl[uid] = (wl[uid] || 0) + spPerUser;
      });
    });

    return { workload: wl, unassignedSP: uSP, unassignedCount: uCount };
  }, [issues]);

  const userIds = useMemo(() => Object.keys(workload).map(Number), [workload]);

  useEffect(() => {
    if (userIds.length === 0) return;

    const idsToFetch = userIds.filter(id => !userCache[id]);
    if (idsToFetch.length === 0) return;

    Promise.all(
      idsToFetch.map(id =>
        apiClient.get(`/usuarios/${id}`)
          .then(u => ({
            id,
            name: u.name || `Usuario ${id}`,
            avatarUrl: u.avatarUrl || null,
          }))
          .catch(() => ({ id, name: `Usuario ${id}`, avatarUrl: null }))
      )
    ).then(results => {
      setUserCache(prev => {
        const next = { ...prev };
        results.forEach(r => {
          next[r.id] = { name: r.name, avatarUrl: r.avatarUrl };
        });
        return next;
      });
    });
  }, [userIds, userCache]);

  const sortedUsers = useMemo(() => {
    return userIds
      .map(id => {
        const u = userCache[id];
        return {
          id,
          name: u?.name || `Usuario ${id}`,
          avatarUrl: u?.avatarUrl || null,
          sp: Math.round(workload[id] * 10) / 10,
        };
      })
      .sort((a, b) => b.sp - a.sp);
  }, [userIds, userCache, workload]);

  const maxSP = sortedUsers.length > 0 ? sortedUsers[0].sp : 0;
  const minSP = sortedUsers.length > 0 ? sortedUsers[sortedUsers.length - 1].sp : 0;
  const totalAssigned = sortedUsers.reduce((sum, u) => sum + u.sp, 0);
  const avgSP = sortedUsers.length > 0 ? Math.round((totalAssigned / sortedUsers.length) * 10) / 10 : 0;

  const getInitial = (name) => name.charAt(0).toUpperCase();

  const getUserPercent = (userSP) => {
    if (totalAssigned === 0) return 0;
    return Math.round((userSP / totalAssigned) * 100);
  };

  const isHighConcentration = (userSP) => {
    if (totalAssigned === 0 || sortedUsers.length < 2) return false;
    return getUserPercent(userSP) > 40;
  };

  const isLowLoad = (userSP) => {
    if (sortedUsers.length < 2) return false;
    return userSP > 0 && userSP <= avgSP * 0.4;
  };

  const warnings = useMemo(() => {
    if (sortedUsers.length < 2) return [];
    const msgs = [];

    const overloaded = sortedUsers.filter(u => isHighConcentration(u.sp));
    overloaded.forEach(u => {
      msgs.push({
        type: 'warning',
        icon: Scale,
        bg: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-700',
        message: `Desequilibrio: ${u.name} concentra el ${getUserPercent(u.sp)}% de la carga (${u.sp} SP). Considera redistribuir.`
      });
    });

    if (maxSP > 0 && minSP > 0 && maxSP >= minSP * 3) {
      const topUser = sortedUsers[0];
      const bottomUser = sortedUsers[sortedUsers.length - 1];
      msgs.push({
        type: 'imbalance',
        icon: Scale,
        bg: 'bg-red-50 border-red-200',
        textColor: 'text-red-700',
        message: `Carga muy desigual: ${topUser.name} tiene ${topUser.sp} SP vs ${bottomUser.name} con ${bottomUser.sp} SP (${Math.round(maxSP / minSP)}x más).`
      });
    }

    const underloaded = sortedUsers.filter(u => isLowLoad(u.sp));
    if (underloaded.length > 0) {
      const names = underloaded.map(u => u.name).join(', ');
      msgs.push({
        type: 'underload',
        icon: UserX,
        bg: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-700',
        message: `Baja carga: ${names} ${underloaded.length === 1 ? 'tiene' : 'tienen'} muy pocos SP asignados. ${underloaded.length === 1 ? 'Podría' : 'Podrían'} asumir más trabajo.`
      });
    }

    return msgs;
  }, [sortedUsers, maxSP, minSP, avgSP, totalAssigned]);

  if (issues.length === 0 || sortedUsers.length === 0) {
    return (
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">
          Distribución de Carga
        </h3>
        <p className="text-sm text-gray-400 text-center py-4">No hay asignaciones aún</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">
        Distribución de Carga
      </h3>

      <div className="space-y-3">
        {sortedUsers.map(user => {
          const barPercent = maxSP > 0 ? Math.round((user.sp / maxSP) * 100) : 0;
          const highLoad = isHighConcentration(user.sp);
          const lowLoad = isLowLoad(user.sp);

          return (
            <div key={user.id} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full shrink-0 overflow-hidden ring-2 ring-offset-1 ring-offset-white ${
                  highLoad ? 'ring-yellow-400' : lowLoad ? 'ring-blue-300' : 'ring-[#446E51]/35'
                }`}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center text-xs font-bold text-white ${
                      highLoad ? 'bg-yellow-500' : lowLoad ? 'bg-blue-400' : 'bg-[#446E51]'
                    }`}
                  >
                    {getInitial(user.name)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 truncate">{user.name}</span>
                  <span className={`text-xs font-bold shrink-0 ml-2 ${
                    highLoad ? 'text-yellow-600' : lowLoad ? 'text-blue-500' : 'text-gray-600'
                  }`}>
                    {user.sp} SP ({getUserPercent(user.sp)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      highLoad ? 'bg-yellow-400' : lowLoad ? 'bg-blue-300' : 'bg-[#446E51]'
                    }`}
                    style={{ width: `${barPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(warnings.length > 0 || unassignedSP > 0) && (
        <div className="mt-4 space-y-2">
          {warnings.map((w, i) => {
            const Icon = w.icon;
            return (
              <div key={i} className={`p-3 rounded-xl border flex items-start gap-2 ${w.bg}`}>
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${w.textColor}`} />
                <p className={`text-xs font-medium ${w.textColor}`}>{w.message}</p>
              </div>
            );
          })}

          {unassignedSP > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-orange-700">
                {unassignedSP} SP sin asignar ({unassignedCount} {unassignedCount === 1 ? 'issue' : 'issues'})
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkloadCard;
