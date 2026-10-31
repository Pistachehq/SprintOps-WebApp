import { priorityClass, priorityLabel } from '../../domain/priority';

const PriorityBadge = ({ priority, className = '' }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${priorityClass(priority)} ${className}`}>
    {priorityLabel(priority)}
  </span>
);

export default PriorityBadge;
