import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, LayoutDashboard, RotateCcw } from 'lucide-react';

const tabs = [
  { key: 'planning', label: 'Planeación', icon: ListTodo, path: 'planning' },
  { key: 'issues', label: 'Kanban', icon: LayoutDashboard, path: 'issues' },
  { key: 'reflection', label: 'Reflexión', icon: RotateCcw, path: 'reflection' },
];

const SprintTabs = ({ activeTab, sprintId }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => navigate(`/sprint/${sprintId}/${tab.path}`)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              isActive
                ? 'bg-[#446E51] text-white shadow-md'
                : 'text-slate-500 hover:bg-gray-50'
            }`}
          >
            <Icon size={18} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default SprintTabs;
