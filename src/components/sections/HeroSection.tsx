import React from 'react';
import { Eye } from 'lucide-react';
import { CTAButton } from '../common/CTAButton';
import { TrustIndicator } from '../common/TrustIndicator';
import { StatCard } from '../common/StatCard';
import { TRUST_INDICATORS } from '../../constants/trust-indicators.constants';
import { KEY_METRICS } from '../../constants/metrics.constants';

interface HeroSectionProps {
  onNavigate: (path: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-sm">
            <Eye className="w-4 h-4" />
            Security Town System — one platform, every environment
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            AI Security for
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Smart Cities, Airports & Critical Sites
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Other systems record what happened. SSSP tells operators before it becomes an incident —
            face matches, behavior flags, zone breaches, in under two seconds.
            On your hardware. No cloud. No excuses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <CTAButton onClick={() => onNavigate('/pricing')} icon>
              View Pricing
            </CTAButton>
            <CTAButton onClick={() => onNavigate('/horus')} variant="secondary">
              Meet Horus AI
            </CTAButton>
          </div>

          <div className="pt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400">
            {TRUST_INDICATORS.map((indicator, i) => (
              <TrustIndicator key={i} text={indicator.text} />
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16">
            {KEY_METRICS.map((stat, i) => (
              <StatCard key={i} {...stat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
