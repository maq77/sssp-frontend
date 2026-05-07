import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Network, Database, Shield, Eye, ArrowRight, Lock, ExternalLink, type LucideIcon } from 'lucide-react';

import { CTAButton } from '@/components/common/CTAButton';

const RESEARCH_PAPER_URL = 'https://www.researchgate.net/publication/398822641_A_Practical_Hybrid_Post-Quantum_Encryption_Framework_Based_on_ML-KEM-512_and_AES-256-GCM_Design_Implementation_and_Performance_Analysis';

type StackItem = {
  icon: LucideIcon;
  title: string;
  desc: string;
  paperUrl?: string;
};

const STACK: StackItem[] = [
  {
    icon: Eye,
    title: 'Horus AI Engine',
    desc: 'We built our own computer vision stack — detection, face recognition, behavior analysis. 99.2% match accuracy in real conditions. Not a third-party API wrapped in our branding.'
  },
  {
    icon: Cpu,
    title: 'Edge Inference',
    desc: 'Every frame is processed on your hardware. No cloud round-trip. No upstream latency killing your response time. The AI runs where your cameras are — and stays there.'
  },
  {
    icon: Network,
    title: 'Real-time Pipelines',
    desc: 'From Camera to alert in under a second. gRPC for AI event streaming. The architecture was built for speed'
  },
  {
    icon: Database,
    title: 'Evidence & Reporting',
    desc: 'Every alert writes a full record — snapshot, timestamp, camera ID, detection metadata. Incidents are fully trackable and export-ready. If you ever need to prove what happened, it\'s there.'
  },
  {
    icon: Shield,
    title: 'Role-based Security',
    desc: 'Complete Secure end-t-end'
  },
  {
    icon: Lock,
    title: 'Post-Quantum Encryption (Coming Soon)',
    desc: 'Next-era Encryption Technology that will protect your data against future quantum attacks. We\'re integrating post-quantum algorithms to ensure your data remains secure for decades to come.',
    paperUrl: RESEARCH_PAPER_URL
  }
];

export const TechnologyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-16">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">Our Technology</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Not a black box. Not a cloud service that holds your data hostage.
              An edge-first architecture where cameras feed our AI locally, operators get alerts in under a second,
              and every component runs on hardware you control — not ours.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {STACK.map((s, i) => (
              <div
                key={i}
                className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700 hover:border-sky-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-slate-300">
                  {s.desc}
                  {s.paperUrl && (
                    <>
                      {' '}
                      <a
                        href={s.paperUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-sky-300 underline underline-offset-4 transition-colors hover:text-sky-200"
                      >
                        Click here to view paper
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">How it flows — end to end</h2>
              <div className="space-y-4 text-slate-300">
                {[
                  {
                    step: '1) Ingest',
                    desc: 'Your cameras stream over RTSP. Optional IoT AQI sensors connect in parallel. Everything lands and stays on your edge hardware — nothing touches an external server.'
                  },
                  {
                    step: '2) Analyze',
                    desc: 'Horus runs face recognition, behavior analysis, and zone breach detection on every frame in real time. No cloud call. No upstream API adding latency. Just your hardware, running our models.'
                  },
                  {
                    step: '3) Alert',
                    desc: 'Events push to operators in under a second via SignalR. Every alert includes a snapshot, timestamp, camera ID, detection type, and confidence. Operators get everything — before they even ask.'
                  },
                  {
                    step: '4) Manage',
                    desc: 'Operators work through a full incident workflow — assign, escalate, start, resolve, export. Every action is logged. The audit trail builds itself.'
                  }
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700">
                    <div className="font-semibold text-sky-300 mb-1">{item.step}</div>
                    <div className="text-sm text-slate-400">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-4">What you can configure</h2>
                <ul className="space-y-3 text-slate-300">
                  {[
                    'Which Horus modules run per camera — face, behavior, zone, or all three',
                    'Watchlists and access policies scoped per site, department, or camera group',
                    'Restricted zone boundaries — drawn directly on any camera feed, no hardware changes',
                    'AQI sensor package — CO₂, PM2.5, VOCs, with optional O₃ for outdoor environments',
                    'Alert thresholds, suppression windows, and escalation paths per incident type',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-3">Built for environments where failure isn't an option</h2>
                <p className="text-slate-300 mb-6">
                  Not every site has reliable internet. Not every operator has an engineering background.
                  SSSP runs fully offline, deploys on hardware you already own, and surfaces what operators need — without the manual setup that makes most systems fail in the field.
                </p>
                <CTAButton onClick={() => navigate('/pricing')} icon>
                  Request Architecture Walkthrough
                </CTAButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
