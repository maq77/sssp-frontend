import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Leaf, Users, Handshake, ArrowRight } from 'lucide-react';

import { CTAButton } from '@/components/common/CTAButton';

type Value = { icon: React.ElementType; title: string; desc: string };

type Pillar = { title: string; points: string[] };

const VALUES: Value[] = [
  { icon: Shield, title: 'Security First', desc: 'Clear operator workflows and incident tracking for mission-critical sites.' },
  { icon: Leaf, title: 'Sustainability Built-In', desc: 'Environmental intelligence (AQI + insights) alongside security analytics.' },
  { icon: Users, title: 'Human-in-the-Loop', desc: 'AI assists operators with alerts, evidence, and recommended actions.' },
  { icon: Handshake, title: 'Integration Friendly', desc: 'Works with existing camera infrastructure and scales by site.' }
];

const PILLARS: Pillar[] = [
  {
    title: 'What SSSP delivers',
    points: [
      'Face recognition workflows (wanted-person & identity verification)',
      'Abnormal behavior detection and threat awareness',
      'Restricted-zone monitoring (virtual perimeters)',
      'Air-quality monitoring (AQI) with insights and recommendations',
      'Incident management (create, review, export) and auditability'
    ]
  },
  {
    title: 'How we work with you',
    points: [
      'Pilot first—validate accuracy and workflows at your site',
      'Module-by-module rollout to minimize disruption',
      'Clear roles and permissions (Admin / Operator / User)',
      'Training and operational handover'
    ]
  }
];

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-16">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">About SSSP</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              SSSP (Smart Security &amp; Sustainability Platform) brings security analytics and environmental intelligence into one modular system.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {VALUES.map((v, i) => (
              <ValueCard key={i} {...v} />
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {PILLARS.map((p, i) => (
              <div key={i} className="bg-slate-800/30 rounded-2xl border border-slate-700 p-8">
                <h2 className="text-2xl font-bold mb-4">{p.title}</h2>
                <ul className="space-y-3 text-slate-300">
                  {p.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-sky-400 mt-2" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Want a demo tailored to your site?</h2>
            <p className="text-lg text-slate-300 mb-8">
              We will map your camera coverage, define restricted zones, choose the right modules, and set up a pilot deployment.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <CTAButton onClick={() => navigate('/pricing')} icon>
                View Pricing
              </CTAButton>
              <CTAButton variant="secondary" onClick={() => navigate('/technology')}>
                Explore Technology
              </CTAButton>
            </div>
            <div className="mt-6 text-sm text-slate-400 inline-flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Contact &amp; integration details can be added to this page when you are ready.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ValueCard: React.FC<Value> = ({ icon: Icon, title, desc }) => {
  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700 p-6 hover:border-slate-600 transition-all">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="font-semibold mb-2">{title}</div>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  );
};
