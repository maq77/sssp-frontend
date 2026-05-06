import React from 'react';
import { Market } from '../../types/content.types';

export const MarketCard: React.FC<Market> = ({
  icon: Icon,
  label,
  stats,
  color,
  desc,
}) => {
  return (
    <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all group cursor-pointer">
      <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="font-semibold text-center mb-2">{label}</h3>
      <div className="text-xs text-center text-sky-400 font-semibold mb-3">{stats}</div>
      <p className="text-xs text-slate-400 text-center">{desc}</p>
    </div>
  );
};
