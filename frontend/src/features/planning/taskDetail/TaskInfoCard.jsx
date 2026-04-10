import React from 'react';
import TeamAvatars from './TeamAvatars';

const TaskInfoCard = ({ task, role, members = [], onAssign }) => {
  const assignedMembers = members.filter(m => task.assigneeIds?.includes(m.userId));

  return (
    <div className="bg-white rounded-[24px] p-10 shadow-sm border border-gray-100 w-full space-y-8">
      {/* Propósito */}
      <section>
        <h3 className="text-lg font-bold text-[#446E51] mb-3">Propósito</h3>
        <div className="border-l-4 border-[#446E51] bg-gray-50 rounded-r-xl p-5 text-sm text-gray-600 leading-relaxed">
          {task.purpose || 'Sin propósito definido.'}
        </div>
      </section>

      {/* Descripción */}
      <section>
        <h3 className="text-lg font-bold text-[#446E51] mb-3">Descripción</h3>
        <div className="border-l-4 border-[#446E51] bg-gray-50 rounded-r-xl p-5 text-sm text-gray-600 leading-relaxed">
          {task.description}
        </div>
      </section>

      {/* Equipo */}
      <section>
        <h3 className="text-lg font-bold text-[#446E51] mb-3">Equipo Asignado</h3>
        <TeamAvatars
          assignedMembers={assignedMembers}
          allMembers={members}
          assigneeIds={task.assigneeIds || []}
          taskId={task.id}
          canAdd={role === 'scrumMaster' || role === 'productOwner'}
          onAssign={onAssign}
        />
      </section>
    </div>
  );
};

export default TaskInfoCard;
