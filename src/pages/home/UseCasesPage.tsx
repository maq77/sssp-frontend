import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Building2, ShieldAlert, Users, ArrowRight } from 'lucide-react';

import { CTAButton } from '@/components/common/CTAButton';

type UseCase = {
  icon: React.ElementType;
  title: string;
  summary: string;
  bullets: string[];
};

const USE_CASES: UseCase[] = [
  {
    icon: Plane,
    title: 'Airports & Border Control',
    summary: 'Reduce identity fraud risk and strengthen screening with face recognition + operator workflows.',
    bullets: [
      'Watchlist matching and alerts',
      'Identity verification support for checkpoints',
      'Incident creation, review, and audit trail'
    ]
  },
  {
    icon: Building2,
    title: 'Smart Cities',
    summary: 'Monitor safety and sustainability with camera analytics and IoT air-quality sensing.',
    bullets: [
      'Abnormal behavior and suspicious activity detection',
      'AQI monitoring + forecasting for planning',
      'Actionable recommendations for public health and policy'
    ]
  },
  {
    icon: ShieldAlert,
    title: 'Restricted Facilities',
    summary: 'Detect unauthorized access and respond faster with geofencing and real-time alerts.',
    bullets: [
      'Restricted zone monitoring (virtual perimeters)',
      'Unauthorized access alerts and operator actions',
      'Centralized dashboards for multi-site monitoring'
    ]
  },
  {
    icon: Users,
    title: 'Campuses & Public Venues',
    summary: 'Support daily operations with incident workflows and evidence-ready reporting.',
    bullets: [
      'Operator dashboards for live monitoring',
      'Incident tracking and reporting',
      'Configurable modules per building or area'
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
              SSSP is built as a <span className="text-sky-400 font-semibold">Security Town System</span>: one platform you can tailor to airports, smart cities, campuses, and more.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {USE_CASES.map((u, i) => (
              <div key={i} className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                    <u.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{u.title}</h2>
                    <p className="text-slate-300 mt-2">{u.summary}</p>
                  </div>
                </div>

                <ul className="space-y-3 text-sm text-slate-300">
                  {u.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Want a tailored scenario?</h3>
              <p className="text-slate-300">
                We can map your risks to modules (face, behavior, access, AQI) and deliver a pilot plan.
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
