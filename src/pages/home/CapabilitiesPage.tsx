import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Eye, ShieldAlert, Workflow, Leaf, Wind, ArrowRight } from 'lucide-react';

import { CTAButton } from '@/components/common/CTAButton';

type CapabilityGroup = {
  title: string;
  icon: React.ElementType;
  desc: string;
  items: string[];
};

const GROUPS: CapabilityGroup[] = [
  {
    title: 'Identity & Watchlists',
    icon: UserCheck,
    desc: 'Real-time face recognition against your watchlists. Catches who you\'re looking for — at any camera, at any time.',
    items: [
      'Live face recognition and watchlist matching',
      'Alert operators with face evidence attached',
      'Watchlist management — add, update, remove entries',
      'Works even with partial occlusion or low-light conditions (Horus Plus)'
    ]
  },
  {
    title: 'Behavior & Threat Analytics',
    icon: Eye,
    desc: 'Understands what people are doing — not just where they are. Flags threats before they escalate.',
    items: [
      'Abnormal behavior detection (body language, motion patterns)',
      'Action recognition — fights, abuse, vandalism, and more',
      'Pose estimation for detailed behavioral understanding',
      'Video-MAE transformer for long-range temporal patterns (Horus Plus)'
    ]
  },
  {
    title: 'Access & Restricted Zones',
    icon: ShieldAlert,
    desc: 'Define virtual perimeters anywhere on any camera feed. Instant alert when someone crosses.',
    items: [
      'Geofencing — draw zones directly on camera views',
      'Real-time unauthorized access alerts with snapshot',
      'Multi-zone configurations per camera or site'
    ]
  },
  {
    title: 'Operations & Incident Workflows',
    icon: Workflow,
    desc: 'A full SOC workflow built in. Operators have everything they need to respond, track, and report.',
    items: [
      'Live operator dashboards for all cameras and events',
      'Incident management — assign, escalate, resolve with notes',
      'Evidence timeline with video clips and snapshots',
      'Exportable reports for compliance and stakeholder review'
    ]
  },
  {
    title: 'Air Quality Monitoring',
    icon: Leaf,
    desc: 'Environmental intelligence for smart cities and facilities. Health and policy insights in the same operator view.',
    items: [
      'IoT sensor integration (CO₂, PM2.5, VOCs — sensor package may vary)',
      'AQI dashboards with real-time and historical data',
      'Forecasting and trend analysis',
      'Recommendations for public health and policy decisions'
    ]
  },
  {
    title: 'AQI Alerts & Analytics',
    icon: Wind,
    desc: 'Turn raw sensor readings into actionable insights. Alert before thresholds become crises.',
    items: [
      'Configurable threshold alerts for any sensor metric',
      'AQI dashboards for facility and city teams',
      'Data export and integration with existing city systems'
    ]
  }
];

export const CapabilitiesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-16">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">What SSSP Can Do</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Smart cameras, AI analytics, and optional IoT sensors — delivering a complete Security Town System.
              Every capability listed here ships in the current platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {GROUPS.map((g, i) => (
              <div
                key={i}
                className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700 hover:border-sky-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mb-6">
                  <g.icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{g.title}</h2>
                <p className="text-slate-300 mb-6">{g.desc}</p>
                <ul className="space-y-3 text-sm text-slate-300">
                  {g.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-3xl p-10 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to see it in action?</h2>
            <p className="text-lg text-slate-300 mb-8">
              We'll walk you through exactly which capabilities fit your site and set up a pilot plan.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <CTAButton onClick={() => navigate('/pricing')} icon>
                Build Your Plan
              </CTAButton>
              <CTAButton variant="secondary" onClick={() => navigate('/horus')}>
                See Horus AI Models
              </CTAButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
