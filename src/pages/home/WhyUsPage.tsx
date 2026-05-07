import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, ShieldCheck, Leaf, Wrench, Eye } from 'lucide-react';

import { CTAButton } from '@/components/common/CTAButton';

export const WhyUsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-16">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-sm mb-6">
              <Layers className="w-4 h-4" />
              Security Town System (STS) — one platform for every environment
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              One platform that actually works for
              <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent"> airports, smart cities, agencies</span>
              — and the environments most vendors won't touch.
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Most platforms make you choose. SSSP gives you AI security and environmental intelligence
              in one system — and you enable only what your site actually needs.
              Nothing you don't. Everything you do.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <CTAButton icon onClick={() => navigate('/use-cases')}>See Use Cases</CTAButton>
              <CTAButton variant="secondary" onClick={() => navigate('/horus')}>Meet Horus AI</CTAButton>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Pillar
              icon={ShieldCheck}
              title="Built for operators"
              desc="Face recognition, behavior detection, unauthorized access alerts, and a full SOC workflow. Everything an operator needs — in one place, not five different tools."
            />
            <Pillar
              icon={Eye}
              title="AI we built and own"
              desc="Horus is our engine — YOLOv11, AdaFace R101, Video-MAE. We trained it, we tune it, we run it on your hardware. 99.2% face match accuracy in real conditions."
            />
            <Pillar
              icon={Leaf}
              title="Security and sustainability"
              desc="Smart cities need both. We built both. AQI monitoring, forecasting, and policy recommendations — in the same dashboard as your security operations."
            />
            <Pillar
              icon={Wrench}
              title="Works with what you have"
              desc="RTSP/ONVIF cameras, IoT sensors, your existing IT — we plug in. No rip-and-replace. Most sites are running within a week."
            />
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works — start to finish</h2>
            <p className="text-xl text-slate-300">Camera feed in. Actionable intelligence out. Under two seconds.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Step
              step="01"
              title="Plug in your cameras"
              desc="Any RTSP/ONVIF camera works — the ones you already own. Add AQI sensors if you need environmental monitoring. We don't ask you to buy hardware you don't need."
            />
            <Step
              step="02"
              title="Horus runs on your hardware"
              desc="Every stream gets processed at the edge. No cloud round-trip. No upstream latency. Face recognition, behavior analysis, and zone monitoring — locally, in real time."
            />
            <Step
              step="03"
              title="Operators respond. Leadership reports."
              desc="Every detection becomes a structured incident — title, severity, camera, snapshot evidence. Operators handle it through a built-in workflow. Everything is exportable for compliance."
            />
          </div>

          <div className="mt-16 bg-slate-800/30 border border-slate-700 rounded-3xl p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <h3 className="text-2xl font-bold mb-3">One product. Multiple markets.</h3>
                <p className="text-slate-300">
                  SSSP is a subscription platform with optional hardware bundles. Security and sustainability
                  modules open airports, intelligence agencies, smart city governments, and defense buyers —
                  all from one codebase. One product, many buyer types, predictable recurring revenue.
                </p>
              </div>
              <button
                onClick={() => navigate('/capabilities')}
                className="inline-flex items-center gap-2 text-sky-400 font-semibold hover:text-sky-300 whitespace-nowrap"
              >
                See all capabilities <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const Pillar: React.FC<{ icon: React.ElementType; title: string; desc: string }> = ({
  icon: Icon,
  title,
  desc,
}) => (
  <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-all">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="font-semibold mb-2">{title}</div>
    <p className="text-sm text-slate-400">{desc}</p>
  </div>
);

const Step: React.FC<{ step: string; title: string; desc: string }> = ({ step, title, desc }) => (
  <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
    <div className="text-sky-400 font-bold text-lg mb-3">{step}</div>
    <h3 className="text-2xl font-bold mb-3">{title}</h3>
    <p className="text-slate-300">{desc}</p>
  </div>
);
