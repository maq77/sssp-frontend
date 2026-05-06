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
    title: 'Identity & Watchlists (Wanted People)',
    icon: UserCheck,
    desc: 'Face recognition workflows for high-security checkpoints and investigations.',
    items: [
      'Real-time face recognition and matching',
      'Watchlist management and alerting',
      'Operator review and evidence capture'
    ]
  },
  {
    title: 'Behavior & Threat Analytics',
    icon: Eye,
    desc: 'Detect suspicious patterns and abnormal events in live streams.',
    items: [
      'Abnormal behavior detection (body language)',
      'Pose estimation and Action recognition',
      'Fighting, Abuse, Vandalism, etc.'
    ]
  },
  {
    title: 'Access & Restricted Zones',
    icon: ShieldAlert,
    desc: 'Reduce breaches with virtual perimeters and policy-driven monitoring.',
    items: [
      'Restricted zone monitoring (geofencing)',
      'Unauthorized access alerts',
    ]
  },
  {
    title: 'Operations & Workflows',
    icon: Workflow,
    desc: 'Centralize monitoring, incidents, and reporting across sites (CI/CD)',
    items: [
      'Operator dashboards for cameras and events',
      'Incident management and tracking',
      'Exports and reporting for stakeholders'
    ]
  },
  {
    title: 'Sustainability Intelligence',
    icon: Leaf,
    desc: 'Bring environmental data into the same operational view.',
    items: [
      'IoT air-quality monitoring (e.g., CO2, PM2.5, VOCs; sensor package may vary)',
      'AQI forecasting and trend analysis',
      'Recommendations for public health and policy'
    ]
  },
  {
    title: 'Air-Quality & Analytics',
    icon: Wind,
    desc: 'Turn sensor readings into actionable insights for city teams and facilities.',
    items: [
      'Dashboards for AQI and emissions indicators',
      'Alerts on threshold breaches',
      'Data-driven mitigation planning support'
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
            <h1 className="text-5xl font-bold mb-6">Capabilities | Features</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              SSSP combines smart cameras, AI, and optional IoT sensors to deliver an end-to-end Security Town System.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {GROUPS.map((g, i) => (
              <div key={i} className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700 hover:border-slate-600 transition-all">
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

          <div className="mt-16 text-center">
            <CTAButton onClick={() => navigate('/pricing')} icon>
              Build Your Plan
            </CTAButton>
          </div>
        </div>
      </section>
    </div>
  );
};
