import React from 'react';
import { CheckCircle } from 'lucide-react';
import { ProblemSolution } from '../../types/content.types';

export const ProblemSolutionCard: React.FC<ProblemSolution> = ({
  icon: Icon,
  title,
  cost,
  problem,
  solution,
  stats,
  color,
}) => {
  return (
    <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700 hover:border-slate-600 transition-all group">
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" />
      </div>

      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <div className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-semibold mb-4">
        {cost}
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-xs font-bold text-red-400 mb-2">THE PROBLEM:</div>
          <p className="text-sm text-slate-400">{problem}</p>
        </div>

        <div>
          <div className="text-xs font-bold text-green-400 mb-2">OUR SOLUTION:</div>
          <p className="text-sm text-slate-300">{solution}</p>
        </div>

        <div>
          <div className="text-xs font-bold text-sky-400 mb-3">WHAT YOU GET:</div>
          <div className="space-y-2">
            {stats.map((stat, j) => (
              <div key={j} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">{stat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
