import React from 'react';
import { AdvantageCard } from '../cards/AdvantageCard';
import { COMPETITIVE_ADVANTAGES } from '../../data/advantages.data';

export const AdvantagesSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why serious buyers choose SSSP</h2>
          <p className="text-xl text-slate-300">Not features. Outcomes. Here's what actually matters in a real deployment.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMPETITIVE_ADVANTAGES.map((advantage, i) => (
            <AdvantageCard key={i} {...advantage} />
          ))}
        </div>
      </div>
    </section>
  );
};