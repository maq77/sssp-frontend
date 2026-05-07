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
    summary: "One missed match at a checkpoint is a national incident. SSSP gives screening teams real-time watchlist hits across every camera — with face evidence, camera ID, and timestamp before the operator even reaches for the radio.",
    bullets: [
      'Simultaneous watchlist matching across every connected camera',
      'Checkpoint and gate coverage with face crop evidence on every alert',
      'Full audit trail — incident creation, review, export, compliance-ready',
      'Under 2 seconds from detection to operator notification'
    ]
  },
  {
    icon: Building2,
    title: 'Smart Cities',
    summary: "City operations teams shouldn't have to switch between a security platform and an environmental dashboard. We built both into one. One operator view. One incident workflow. One deployment.",
    bullets: [
      'Behavior and threat detection in public spaces, transit hubs, and parks',
      'Real-time AQI monitoring with forecasting and health recommendations',
      'Unified dashboard for security and sustainability teams',
      'Configurable per district, per zone, per camera'
    ]
  },
  {
    icon: Eye,
    title: 'Intelligence Agencies',
    summary: "Most platforms aren't built for environments where discretion matters as much as accuracy. Ours is. Horus Plus runs on air-gapped hardware, stores nothing externally, and gives investigators forensic-grade evidence.",
    bullets: [
      'AdaFace R101 — 99.2% accuracy on low-quality, partial, and obscured faces',
      'Watchlist enforcement across multiple feeds with configurable suppression',
      'On-prem and air-gapped deployment — zero external data exposure',
      'Covert operation support with role-scoped alert visibility'
    ],
    highlight: true
  },
  {
    icon: ShieldAlert,
    title: 'Restricted Facilities',
    summary: "A perimeter is only a perimeter if someone knows when it's been crossed. Draw virtual zones on any camera feed. The moment someone enters, operators get an alert — snapshot attached, zone name included, no hardware changes.",
    bullets: [
      'Virtual perimeter zones drawn directly on live camera feeds',
      'Instant alerts with snapshot evidence on every breach',
      'Multi-zone configs per camera — no limit on zone count',
      'Role-based access so only the right operators see sensitive feeds'
    ]
  },
  {
    icon: Users,
    title: 'Campuses & Public Venues',
    summary: "Hospitals, universities, stadiums — environments where you need daily operational monitoring, not just emergency response. Incident tracking, zone management, and reporting built for teams that run these spaces 24/7.",
    bullets: [
      'Live dashboards covering all cameras, zones, and active incidents',
      'Full incident workflow — assign, start, resolve, export for compliance',
      'Configurable modules per building, floor, or department',
      'Plugs into cameras you already own — no rip and replace'
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
            <h1 className="text-5xl font-bold mb-6">Where SSSP Gets Deployed</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Six environments. One platform. You configure it for your site —
              not the other way around. And you only enable what you actually need.
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
              <h3 className="text-2xl font-bold mb-2">Your environment not listed?</h3>
              <p className="text-slate-300">
                Tell us what you're securing and what's gone wrong before. We'll map the right modules,
                design a pilot plan, and show you what Horus catches in your specific setup.
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
