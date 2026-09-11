import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: string;
  highlight?: boolean;
}

export default function StatCard({ title, value, subtitle, icon, highlight }: StatCardProps) {
  return (
    <div
      className={`p-6 rounded-2xl border transition-all ${
        highlight
          ? 'bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/30 shadow-lg shadow-indigo-500/10'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
