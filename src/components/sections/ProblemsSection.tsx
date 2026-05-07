import React from 'react';
import { ProblemSolutionCard } from '../cards/ProblemSolutionCard';
import { PROBLEMS_DATA } from '../../data/problems.data';

export const ProblemsSection: React.FC = () => {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">The problems that actually cost lives and careers</h2>
          <p className="text-xl text-slate-300">Every one of these happens daily. Most systems catch them after the fact — if at all.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PROBLEMS_DATA.map((problem, i) => (
            <ProblemSolutionCard key={i} {...problem} />
          ))}
        </div>
      </div>
    </section>
  );
};
