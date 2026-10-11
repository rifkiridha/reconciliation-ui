import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const s = (status || '').toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';

  if (s === 'MATCHED' || s === 'SUCCESS' || s === 'ACTIVE') {
    colorClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
    dotColor = 'bg-emerald-400';
  } else if (s === 'AMOUNT_MISMATCH') {
    colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
    dotColor = 'bg-amber-400';
  } else if (s === 'DATE_MISMATCH') {
    colorClasses = 'bg-sky-950/80 text-sky-300 border-sky-800/80';
    dotColor = 'bg-sky-400';
  } else if (s === 'STATUS_MISMATCH') {
    colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-800/80';
    dotColor = 'bg-rose-400';
  } else if (s === 'SOURCE_ONLY') {
    colorClasses = 'bg-purple-950/80 text-purple-300 border-purple-800/80';
    dotColor = 'bg-purple-400';
  } else if (s === 'TARGET_ONLY') {
    colorClasses = 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80';
    dotColor = 'bg-indigo-400';
  } else if (s === 'DUPLICATE' || s === 'FAILED') {
    colorClasses = 'bg-red-950/80 text-red-300 border-red-850';
    dotColor = 'bg-red-400';
  } else if (s === 'PARTIAL_SUCCESS') {
    colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
    dotColor = 'bg-amber-400';
  } else if (s === 'RUNNING') {
    colorClasses = 'bg-blue-950/80 text-blue-300 border-blue-800/80 animate-pulse';
    dotColor = 'bg-blue-400';
  } else if (s === 'PENDING') {
    colorClasses = 'bg-zinc-800 text-zinc-300 border-zinc-700';
    dotColor = 'bg-zinc-400';
  } else if (s === 'INVALID_DATA') {
    colorClasses = 'bg-orange-950/80 text-orange-300 border-orange-800/80';
    dotColor = 'bg-orange-400';
  }

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1 font-semibold' : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-mono tracking-tight ${colorClasses} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
};
