import React from 'react';
import { MarketCard } from '../cards/MarketCard';
import { TARGET_MARKETS } from '../../data/markets.data';

export const MarketsSection: React.FC = () => {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Built for environments where missing something isn't an option</h2>
          <p className="text-xl text-slate-300">
            One platform. Six deployment types. Configure it for your environment — not the other way around.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TARGET_MARKETS.map((market, i) => (
            <MarketCard key={i} {...market} />
          ))}
        </div>
      </div>
    </section>
  );
};
