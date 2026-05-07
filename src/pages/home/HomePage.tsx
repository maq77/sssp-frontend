import React from 'react';
import { useNavigate } from 'react-router-dom';

import { HeroSection } from '@/components/sections/HeroSection';
import { VideoDemoSection } from '@/components/sections/VideoDemoSection';
import { ProblemsSection } from '@/components/sections/ProblemsSection';
import { AdvantagesSection } from '@/components/sections/AdvantagesSection';
import { MarketsSection } from '@/components/sections/MarketsSection';
import { CTASection } from '@/components/sections/CTASection';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="pt-16">
      <div className="bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border-y border-sky-500/30 py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-sm">New: Horus is live — </span>
          <button
            onClick={() => navigate('/horus')}
            className="text-sky-400 hover:text-sky-300 font-semibold underline"
          >
            see what our AI engine actually does
          </button>
        </div>
      </div>
      <HeroSection onNavigate={handleNavigate} />
      <VideoDemoSection />
      <ProblemsSection />
      <AdvantagesSection />
      <MarketsSection />
      <CTASection onNavigate={handleNavigate} />
    </div>
  );
};
