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
    desc: 'Horus matches faces against your watchlist in real time — across every connected camera, simultaneously. If someone on your list walks into frame, the operator knows immediately. Face crop, camera ID, timestamp. All of it.',
    items: [
      'Live face recognition and watchlist matching — every camera at once',
      'Operator alert includes face evidence, camera, and exact timestamp',
      'Watchlist management — add, update, remove entries in the dashboard',
      'Works under partial occlusion and low-light conditions (Horus Plus)'
    ]
  },
  {
    title: 'Behavior & Threat Analytics',
    icon: Eye,
    desc: 'Most cameras just record. Horus understands what\'s happening — body language, movement patterns, interaction dynamics. It flags threats before they escalate, not after.',
    items: [
      'Abnormal behavior detection — loitering, aggression, evasive movement',
      'Action recognition: fights, abuse, vandalism, and more',
      'Pose estimation for detailed behavioral understanding',
      'Video-MAE transformer for long-range temporal patterns (Horus Plus)'
    ]
  },
  {
    title: 'Access & Restricted Zones',
    icon: ShieldAlert,
    desc: 'Draw a virtual perimeter anywhere on any camera feed. The moment someone crosses it, operators get an alert with a snapshot and zone name. No hardware. No delay.',
    items: [
      'Draw zones directly on any camera view — no additional hardware',
      'Instant alert with snapshot evidence on every breach',
      'Multi-zone configurations per camera, per site, or per department'
    ]
  },
  {
    title: 'Operations & Incident Workflows',
    icon: Workflow,
    desc: 'A full SOC workflow built in — not bolted on. From the moment Horus detects a threat to the final compliance export, operators have everything they need in one place.',
    items: [
      'Live dashboards covering all cameras, alerts, and active incidents',
      'Incident workflow — assign, escalate, start, resolve, export',
      'Evidence timeline with snapshots, video clips, and detection metadata',
      'Exportable reports for compliance, stakeholders, and legal review'
    ]
  },
  {
    title: 'Air Quality Monitoring',
    icon: Leaf,
    desc: 'Environmental intelligence in the same system as your security — not a separate tool nobody looks at. Real-time sensor data, trend analysis, and health recommendations, all in the operator view your team already uses.',
    items: [
      'IoT sensor integration: CO₂, PM2.5, VOCs, and optional O₃',
      'Real-time and historical AQI dashboards',
      'Forecasting and trend analysis for planning and response',
      'Recommendations for public health decisions and city policy'
    ]
  },
  {
    title: 'AQI Alerts & Analytics',
    icon: Wind,
    desc: 'Set your thresholds. Get an alert before a spike becomes a health incident. Export the data for compliance. That\'s the whole job — and we made it simple.',
    items: [
      'Configurable threshold alerts for any sensor metric',
      'AQI dashboards for facility managers and city operations teams',
      'Data export for compliance reporting and city system integration'
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
            <h1 className="text-5xl font-bold mb-6">Everything SSSP Runs Today</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Nothing here is a roadmap item. Every capability listed ships in the current platform —
              tested, deployed, and running in real environments.
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
            <h2 className="text-3xl font-bold mb-4">Want to know which modules fit your site?</h2>
            <p className="text-lg text-slate-300 mb-8">
              Tell us your environment. We'll tell you exactly what to turn on — and run a pilot to prove it works.
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
