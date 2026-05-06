import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Leaf, Users, Handshake, ArrowRight, Eye, Lock } from 'lucide-react';

import { CTAButton } from '@/components/common/CTAButton';

type Value = { icon: React.ElementType; title: string; desc: string };
type Pillar = { title: string; points: string[] };

const VALUES: Value[] = [
  {
    icon: Shield,
    title: 'Security First',
    desc: 'Every product decision starts with the operator. Clear workflows, reliable alerts, and evidence that holds up under review.'
  },
  {
    icon: Eye,
    title: 'AI That Actually Works',
    desc: 'We built Horus to work in real conditions — low light, bad angles, partial occlusion. Accuracy in a lab means nothing if it fails in the field.'
  },
  {
    icon: Leaf,
    title: 'Sustainability Built-In',
    desc: 'Security and environmental intelligence in one system. Because smart cities need both, and operators shouldn\'t have to switch tools.'
  },
  {
    icon: Lock,
    title: 'Privacy by Design',
    desc: 'On-prem deployment, post-quantum encryption, and no mandatory cloud. Your data is yours — especially important for intelligence and defense buyers.'
  },
  {
    icon: Users,
    title: 'Human-in-the-Loop',
    desc: 'AI surfaces alerts. Humans make decisions. We build tools for operators, not systems that try to replace them.'
  },
  {
    icon: Handshake,
    title: 'Integration Friendly',
    desc: 'Works with cameras you already own. Connects to your existing IT setup. We don\'t force you to rebuild what works.'
  }
];

const PILLARS: Pillar[] = [
  {
    title: 'What SSSP delivers today',
    points: [
      'Face recognition and watchlist enforcement across camera networks',
      'Abnormal behavior and threat detection (Horus AI engine)',
      'Restricted zone monitoring with virtual perimeters',
      'AQI environmental monitoring with forecasting and recommendations',
      'Full incident management — assign, track, resolve, export',
      'On-prem and air-gapped deployment options'
    ]
  },
  {
    title: 'How we work with buyers',
    points: [
      'Pilot first — validate accuracy and workflows at your actual site',
      'Module-by-module rollout to minimize disruption to operations',
      'Clear roles and permissions (Admin / Operator / User)',
      'Training and operational handover included',
      'Dedicated rollout plan for enterprise and defense deployments'
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
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              SSSP is a modular AI security platform built for operators who protect critical infrastructure —
              from airports and smart cities to intelligence agencies and defense facilities.
              We combine security analytics and environmental intelligence in one system,
              running on your hardware, under your control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
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
                      <div className="w-2 h-2 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Want a demo tailored to your site?</h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              We'll map your camera coverage, define restricted zones, choose the right Horus tier and modules,
              and set up a pilot deployment. No commitment required to start.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <CTAButton onClick={() => navigate('/pricing')} icon>
                View Pricing & Plans
              </CTAButton>
              <CTAButton variant="secondary" onClick={() => navigate('/horus')}>
                Learn About Horus AI
              </CTAButton>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              {['On-prem deployment', 'Air-gap capable', 'Works with existing cameras', 'Pilot-first approach'].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-sky-500" />
                  {t}
                </div>
              ))}
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
