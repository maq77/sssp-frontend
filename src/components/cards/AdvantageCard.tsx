import React from 'react';
import { CompetitiveAdvantage } from '../../types/content.types';

export const AdvantageCard: React.FC<CompetitiveAdvantage> = ({
  icon: Icon,
  title,
  desc,
  advantage,
}) => {
  return (
    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 hover:bg-slate-800/50 transition-all">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold mb-1">{title}</h3>
          <div className="inline-block px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs font-semibold">
            {advantage}
          </div>
        </div>
      </div>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  );
};
