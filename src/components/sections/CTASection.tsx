import React from 'react';
import { CheckCircle } from 'lucide-react';
import { CTAButton } from '../common/CTAButton';


interface CTASectionProps {
  onNavigate: (path: string) => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onNavigate }) => {
  return (
    <section className="py-24 bg-slate-900/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-3xl p-12">
          <h2 className="text-4xl font-bold mb-4">See it on your actual site. Not just a demo stage.</h2>
          <p className="text-xl text-slate-300 mb-8">
            We run pilots. Bring your cameras, your environment, your edge cases.
            We'll show you what Horus catches — and what most systems miss.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <CTAButton onClick={() => onNavigate('/pricing')}>
              Start a Pilot
            </CTAButton>
            <CTAButton variant="secondary">
              Schedule a Live Demo
            </CTAButton>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-700 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Works with cameras you already own
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Fully on-prem — air-gap capable
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              No commitment to start
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};