import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Network, Database, Shield, Eye, ArrowRight, Lock } from 'lucide-react';

import { CTAButton } from '@/components/common/CTAButton';

const STACK = [
  {
    icon: Eye,
    title: 'Horus AI Engine',
    desc: 'Our computer vision stack — YOLOv11 detection, AdaFace face recognition, Video-MAE behavior analysis. TensorRT-optimized for edge inference.'
  },
  {
    icon: Cpu,
    title: 'Edge Inference',
    desc: 'All AI runs on your hardware. No cloud round-trips for detection or recognition. NVIDIA GPU-accelerated, air-gap capable.'
  },
  {
    icon: Network,
    title: 'Real-time Pipelines',
    desc: 'RTSP camera ingestion, gRPC event streaming, SignalR for live alerts to operators. Events arrive in under a second.'
  },
  {
    icon: Database,
    title: 'Evidence & Reporting',
    desc: 'Every alert stores snapshot evidence, timestamps, and metadata. Incidents are fully trackable with export-ready audit trails.'
  },
  {
    icon: Shield,
    title: 'Role-based Security',
    desc: 'Admin, Operator, and User roles with strict permission boundaries. JWT authentication with refresh tokens.'
  },
  {
    icon: Lock,
    title: 'Post-Quantum Encryption',
    desc: 'Data-at-rest and data-in-transit encryption designed for the threat landscape of the next decade — important for defense and intelligence deployments.'
  }
];

export const TechnologyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-16">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">Technology</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              A practical, edge-first architecture: cameras and sensors feed AI analytics, operators get real-time alerts,
              and everything runs on your hardware — with no cloud dependency.
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
                <p className="text-sm text-slate-300">{s.desc}</p>
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
                    desc: 'CCTV/IP cameras stream via RTSP. Optional IoT AQI sensors connect in parallel. Everything lands on your edge hardware.'
                  },
                  {
                    step: '2) Analyze',
                    desc: 'Horus runs face recognition, behavior analysis, and zone breach detection on every frame. No cloud, no latency from upstream APIs.'
                  },
                  {
                    step: '3) Alert',
                    desc: 'Events push to operators in real time via SignalR. Each alert carries a snapshot, timestamp, camera ID, and detection metadata.'
                  },
                  {
                    step: '4) Manage',
                    desc: 'Operators handle incidents through a full workflow — assign, start, resolve, export. Incidents build a complete audit trail.'
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
                    'Which Horus modules run per camera — face, behavior, or zone monitoring',
                    'Watchlists and access policies per site or department',
                    'Restricted zone boundaries — drawn directly on camera feeds',
                    'AQI sensor package (CO₂, PM2.5, VOCs; optional O₃)',
                    'Alert thresholds, suppression rules, and escalation paths',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-3">Built for real environments</h2>
                <p className="text-slate-300 mb-6">
                  Not every site has reliable internet. Not every operator is a data scientist.
                  SSSP was designed for environments where things go wrong — and the system still needs to work.
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
