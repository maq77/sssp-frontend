import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Building2, ShieldAlert, Users, Eye, ArrowRight } from 'lucide-react';

import { CTAButton } from '@/components/common/CTAButton';

type UseCase = {
  icon: React.ElementType;
  title: string;
  summary: string;
  bullets: string[];
  highlight?: boolean;
};

const USE_CASES: UseCase[] = [
  {
    icon: Plane,
    title: 'Airports & Border Control',
    summary: "Where a missed identity verification isn't just a security failure — it's a national incident. SSSP helps screening teams move faster and catch more.",
    bullets: [
      'Real-time watchlist matching across all cameras simultaneously',
      'Identity verification support at checkpoints and gates',
      'Incident creation, review, and full audit trail for compliance',
      'Video evidence attached to every alert automatically'
    ]
  },
  {
    icon: Building2,
    title: 'Smart Cities',
    summary: 'City safety and environmental health in one system. Deploy across public spaces, transit hubs, and parks without managing a dozen separate tools.',
    bullets: [
      'Abnormal behavior and suspicious activity detection in public spaces',
      'AQI monitoring + forecasting for public health planning',
      'Actionable recommendations for city policy and emergency response',
      'Unified dashboard for security and sustainability operators'
    ]
  },
  {
    icon: Eye,
    title: 'Intelligence Agencies',
    summary: 'Built for environments where discretion, accuracy, and forensic-grade evidence matter more than speed. Horus Plus is the right choice here.',
    bullets: [
      'High-accuracy face recognition (AdaFace R101 — works on low-quality frames)',
      'Watchlist enforcement across multiple camera feeds',
      'Covert site monitoring with configurable alert suppression',
      'On-prem and air-gapped deployment — data never leaves your network'
    ],
    highlight: true
  },
  {
    icon: ShieldAlert,
    title: 'Restricted Facilities',
    summary: 'Detect unauthorized access before it becomes a breach. Virtual perimeters, instant alerts, and an evidence trail that holds up in review.',
    bullets: [
      'Restricted zone monitoring with configurable virtual perimeters',
      'Immediate operator alerts with snapshot evidence',
      'Multi-site dashboards for centralized security oversight',
      'Role-based access — only the right people see sensitive feeds'
    ]
  },
  {
    icon: Users,
    title: 'Campuses & Public Venues',
    summary: 'Events, hospitals, universities — places where incident reporting and daily operational monitoring matter as much as threat detection.',
    bullets: [
      'Live operator dashboards for all cameras and zones',
      'Incident tracking, resolution workflows, and reporting',
      'Configurable modules per building or area',
      'Works with your existing camera infrastructure'
    ]
  }
];

export const UseCasesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-16">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">Use Cases</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              SSSP is built as a <span className="text-sky-400 font-semibold">Security Town System</span> — one platform you configure differently for each environment and buyer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {USE_CASES.map((u, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 border transition-all ${
                  u.highlight
                    ? 'bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30 hover:border-purple-500/50'
                    : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    u.highlight
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                      : 'bg-gradient-to-br from-sky-500 to-indigo-600'
                  }`}>
                    <u.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{u.title}</h2>
                    <p className="text-slate-300 mt-2 leading-relaxed">{u.summary}</p>
                  </div>
                </div>

                <ul className="space-y-3 text-sm text-slate-300">
                  {u.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <ArrowRight className={`w-4 h-4 mt-0.5 flex-shrink-0 ${u.highlight ? 'text-purple-400' : 'text-sky-400'}`} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Don't see your use case?</h3>
              <p className="text-slate-300">
                Tell us your environment and requirements. We'll map your risks to the right modules
                and deliver a pilot plan specific to your site.
              </p>
            </div>
            <CTAButton onClick={() => navigate('/pricing')} icon>
              Request a Quote
            </CTAButton>
          </div>
        </div>
      </section>
    </div>
  );
};
