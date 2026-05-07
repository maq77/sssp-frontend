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
    desc: 'Every decision starts with the operator — not the algorithm, not the dashboard. Reliable alerts, clear workflows, and evidence that holds up under review.'
  },
  {
    icon: Eye,
    title: 'AI That Works in the Real World',
    desc: 'We built Horus for real conditions — low light, bad angles, partial occlusion, crowded frames. Lab accuracy means nothing when it fails at the gate.'
  },
  {
    icon: Leaf,
    title: 'Sustainability Built In',
    desc: 'Smart cities need security and environmental intelligence in one place. We built that. One system. One operator view. One deployment.'
  },
  {
    icon: Lock,
    title: 'Privacy by Design',
    desc: 'On-prem by default. Post-quantum encryption. No mandatory cloud. Your data is yours — especially important for defense and intelligence buyers.'
  },
  {
    icon: Users,
    title: 'Humans Make the Decisions',
    desc: 'AI surfaces the threat. Operators decide what to do. We build tools that help people respond faster — not systems that try to replace them.'
  },
  {
    icon: Handshake,
    title: 'Works With What You Have',
    desc: 'Plug into your existing RTSP/ONVIF cameras. Connect to your IT setup. We don\'t ask you to rebuild infrastructure that already works.'
  }
];

const PILLARS: Pillar[] = [
  {
    title: 'What ships today — nothing on this list is a roadmap item',
    points: [
      'Face recognition and watchlist enforcement — across every connected camera',
      'Abnormal behavior and threat detection (Horus AI engine, our model)',
      'Virtual perimeter monitoring — draw zones on any camera feed',
      'AQI monitoring with real-time dashboards, forecasting, and recommendations',
      'Full incident workflow — assign, escalate, resolve, export',
      'On-prem and air-gapped deployment — no cloud required'
    ]
  },
  {
    title: 'How we work with buyers — no pressure, no guesswork',
    points: [
      'Pilot first — validate accuracy and workflows at your real site, not a demo environment',
      'Module-by-module rollout so operations aren\'t disrupted',
      'Roles built in: Admin, Operator, and User — permissions enforced, not just suggested',
      'Operator training and handover included in every deployment',
      'Dedicated rollout plan for enterprise, multi-site, and defense buyers'
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
              We built SSSP for the operators who can't afford to miss anything — airports, smart cities,
              intelligence agencies, defense facilities. AI security and environmental intelligence in one system,
              running on your hardware, under your control. Not ours.
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
            <h2 className="text-3xl font-bold mb-4">Want to see it on your actual site?</h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              We'll map your camera coverage, define your zones, choose the right Horus tier,
              and run a pilot deployment. Bring your hardest environment. No commitment to start.
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
