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
              — and more.
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Most security platforms make you choose between features. SSSP gives you AI-powered security analytics
              and environmental intelligence in one system — and you enable only what your site actually needs.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <CTAButton icon onClick={() => navigate('/use-cases')}>See Use Cases</CTAButton>
              <CTAButton variant="secondary" onClick={() => navigate('/horus')}>Meet Horus AI</CTAButton>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Pillar
              icon={ShieldCheck}
              title="Security-first"
              desc="Face recognition, abnormal behavior detection, unauthorized access alerts, and full incident workflows. Everything operators need in one place."
            />
            <Pillar
              icon={Eye}
              title="AI that sees clearly"
              desc="Powered by Horus — our computer vision engine built on YOLOv11, AdaFace, and Video-MAE. Accuracy that holds up in real conditions, not just demos."
            />
            <Pillar
              icon={Leaf}
              title="Eco-ready"
              desc="AQI monitoring with forecasting and recommendations for health and policy. Smart cities get security and sustainability in one deployment."
            />
            <Pillar
              icon={Wrench}
              title="Integrates fast"
              desc="Works with RTSP/ONVIF cameras you already own, IoT sensors, and your existing IT setup. No rip-and-replace."
            />
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-xl text-slate-300">From sensors to intelligence to action — in real time</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Step
              step="01"
              title="Connect your cameras & sensors"
              desc="Bring your existing cameras (RTSP/ONVIF) or use our smart camera package. Add AQI sensors optionally. We work with what you have."
            />
            <Step
              step="02"
              title="AI analytics run on your hardware"
              desc="SSSP processes every stream on the edge — no cloud needed. Horus detects wanted people, suspicious behavior, unauthorized entry, and environmental risks in real time."
            />
            <Step
              step="03"
              title="Operators act. Leadership reports."
              desc="Alerts go to operators with evidence attached. Incidents are tracked, reviewed, and exportable for compliance and stakeholder reporting."
            />
          </div>

          <div className="mt-16 bg-slate-800/30 border border-slate-700 rounded-3xl p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <h3 className="text-2xl font-bold mb-3">A clear investment story</h3>
                <p className="text-slate-300">
                  SSSP is a subscription platform with optional hardware bundles. Security and sustainability modules
                  open multiple markets — from airports to intelligence agencies to smart city governments.
                  One product, many buyer types, predictable recurring revenue.
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
