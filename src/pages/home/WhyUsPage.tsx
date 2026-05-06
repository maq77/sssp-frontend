import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, ShieldCheck, Leaf, Wrench } from 'lucide-react';

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
              Security Town System (STS) — customizable for any environment
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              One platform that adapts to
              <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent"> airports, smart cities, campuses</span>
              — and more.
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              SSSP combines AI security analytics and sustainability intelligence in a single, modular system.
              Enable only the modules you need, integrate your existing infrastructure, and scale across sites.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <CTAButton icon onClick={() => navigate('/use-cases')}>Explore Use Cases</CTAButton>
              <CTAButton variant="secondary" onClick={() => navigate('/pricing')}>Request a Quote</CTAButton>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Pillar
              icon={ShieldCheck}
              title="Security-first"
              desc="Face recognition, abnormal behavior detection, unauthorized access alerts, and incident workflows."
            />
            <Pillar
              icon={Leaf}
              title="Eco-ready"
              desc="AQI monitoring with forecasting and recommendations (health & policy) for smart city deployments."
            />
            <Pillar
              icon={Wrench}
              title="Integrates fast"
              desc="Works with RTSP/ONVIF cameras and IoT sensors, with dashboards and real-time alerts."
            />
            <Pillar
              icon={Layers}
              title="Modular"
              desc="A Security Town System approach: configure capabilities per site, risk, and budget."
            />
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our approach</h2>
            <p className="text-xl text-slate-300">From sensors → intelligence → actions</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Step
              step="01"
              title="Connect cameras & sensors"
              desc="Bring your existing cameras (RTSP/ONVIF) and optionally add smart cameras (IR sensors) and an AQI device (e.g., PM2.5 / CO2 / VOCs / O3 depending on package)."
            />
            <Step
              step="02"
              title="Run AI analytics"
              desc="SSSP processes streams and signals to detect wanted people, suspicious behavior, unauthorized entry, and environmental risks."
            />
            <Step
              step="03"
              title="Act & report"
              desc="Operators receive real-time alerts with evidence, manage incidents, and export reports for compliance and decision-making."
            />
          </div>

          <div className="mt-16 bg-slate-800/30 border border-slate-700 rounded-3xl p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-2">Designed for investors and operators</h3>
                <p className="text-slate-300">
                  A clear product story: a configurable platform sold via subscription, with optional hardware bundles.
                  Security and sustainability modules open multiple markets — from airports to smart cities.
                </p>
              </div>
              <button
                onClick={() => navigate('/capabilities')}
                className="inline-flex items-center gap-2 text-sky-400 font-semibold hover:text-sky-300"
              >
                See capabilities <ArrowRight className="w-4 h-4" />
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
  <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="font-semibold mb-2">{title}</div>
    <p className="text-sm text-slate-400">{desc}</p>
  </div>
);

const Step: React.FC<{ step: string; title: string; desc: string }> = ({ step, title, desc }) => (
  <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
    <div className="text-sky-400 font-bold mb-3">{step}</div>
    <h3 className="text-2xl font-bold mb-3">{title}</h3>
    <p className="text-slate-300">{desc}</p>
  </div>
);
