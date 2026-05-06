import React from 'react';
import { StatMetric } from '../../types/content.types';

export const StatCard: React.FC<StatMetric> = ({ value, label, sublabel }) => {
  return (
    <div className="space-y-2">
      <div className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-slate-500">{sublabel}</div>
    </div>
  );
};
