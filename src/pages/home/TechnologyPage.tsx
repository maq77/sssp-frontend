import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Network, Database, Shield, ArrowRight } from 'lucide-react';

import { CTAButton } from '@/components/common/CTAButton';

const STACK = [
  { icon: Cpu, title: 'AI Analytics', desc: 'Computer vision modules (face recognition, abnormal behavior, ...)' },
  { icon: Network, title: 'Integration', desc: 'RTSP camera ingestion, event pipelines, and APIs for dashboard + notifications' },
  { icon: Database, title: 'Data & Reporting', desc: 'Event storage, incident management workflows, and evidence-ready exports' },
  { icon: Shield, title: 'Security', desc: 'Role-based access (Admin/Operator/User) and Refresh Token, Post-Quantum Encryption' }
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
              A practical, modular architecture: cameras and sensors feed AI analytics, operators get real-time alerts, and leadership gets measurable reports.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {STACK.map((s, i) => (
              <div key={i} className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all">
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
              <h2 className="text-2xl font-bold mb-4">High-level flow</h2>
              <div className="space-y-4 text-slate-300">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700">
                  <div className="font-semibold">1) Ingest</div>
                  <div className="text-sm text-slate-400">CCTV cameras  and optional IoT air-quality sensors.</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700">
                  <div className="font-semibold">2) Analyze</div>
                  <div className="text-sm text-slate-400">AI modules for face recognition, abnormal behavior detection, unauthorized access monitoring, and AQI forecasting.</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700">
                  <div className="font-semibold">3) Act</div>
                  <div className="text-sm text-slate-400">Real-time alerts to operators</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700">
                  <div className="font-semibold">4) Report</div>
                  <div className="text-sm text-slate-400">Export Incidents Data</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4">What you can configure</h2>
              <ul className="space-y-3 text-slate-300">
                {[
                  'Which modules run per camera (face / behavior / access)',
                  'Watchlists and access policies',
                  'Restricted zones (geofencing) and alert thresholds',
                  'AQI sensor package (e.g., CO2, PM2.5, VOCs; optional O3 depending on hardware)',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
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
