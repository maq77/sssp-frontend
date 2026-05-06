import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { PRICING_PLANS, HARDWARE_ITEMS } from '@/data/pricing.data';
import { PricingPlan, HardwareItem } from '@/types/pricing.types';


export const PricingPage: React.FC = () => {
  return (
    <div className="pt-16">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">Our Pricing</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Flexible subscription plans + hardware options(Future Works)
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {PRICING_PLANS.map((plan, i) => (
              <PricingCard key={i} {...plan} />
            ))}
          </div>

          <HardwareSection />
          <FAQSection />
        </div>
      </section>
    </div>
  );
};

const PricingCard: React.FC<PricingPlan> = ({ 
  name, 
  price, 
  period, 
  description, 
  features, 
  notIncluded, 
  cta, 
  popular 
}) => {
  return (
    <div 
      className={`rounded-3xl border p-8 relative ${
        popular 
          ? 'border-sky-500 bg-gradient-to-b from-sky-500/10 to-transparent' 
          : 'border-slate-700 bg-slate-800/30'
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full text-sm font-semibold">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <p className="text-sm text-slate-400 mb-4">{description}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold">{price}</span>
          <span className="text-slate-400">{period}</span>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {features.map((feature, j) => (
          <div key={j} className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
        {notIncluded.map((feature, j) => (
          <div key={j} className="flex items-start gap-3 opacity-40">
            <X className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-500">{feature}</span>
          </div>
        ))}
      </div>

      <button 
        className={`w-full py-3 rounded-xl font-semibold transition-all ${
          popular
            ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:shadow-xl hover:shadow-sky-500/50'
            : 'bg-slate-700 hover:bg-slate-600'
        }`}
      >
        {cta}
      </button>
    </div>
  );
};

const HardwareSection: React.FC = () => {
  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Hardware Add-ons</h2>
        <p className="text-lg text-slate-300">Professional-grade equipment with full software integration</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {HARDWARE_ITEMS.map((item, i) => (
          <HardwareCard key={i} {...item} />
        ))}
      </div>
    </div>
  );
};

const HardwareCard: React.FC<HardwareItem> = ({ name, price, image, specs }) => {
  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-12 text-center">
        <div className="text-7xl mb-4">{image}</div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <div className="text-3xl font-bold text-sky-400 mb-4">{price}</div>
        
        <div className="space-y-2 mb-6">
          {specs.map((spec, j) => (
            <div key={j} className="flex items-start gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300">{spec}</span>
            </div>
          ))}
        </div>

        <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-all">
          Add to Quote
        </button>
      </div>
    </div>
  );
};

const FAQSection: React.FC = () => {
  const faqs = [
    {
      q: 'Can I start with a trial before committing?',
      a: 'Yes! Pilot deployments and demos are available; scope depends on your cameras and sensors.'
    },
    {
      q: 'What happens if I exceed my camera limit?',
      a: 'You can upgrade your plan anytime. Upgrades are available; pricing depends on the contract and deployment scope.'
    },
    {
      q: 'Do you offer volume discounts for large deployments?',
      a: 'Absolutely. Enterprise deployments receive custom pricing based on camera and sensor count.'
    },
    {
      q: 'Is there a setup fee or cancellation penalty?',
      a: 'Deployment and onboarding are scoped per project. Cancellation terms are defined in your subscription agreement.'
    },
    {
      q: 'Can I use my existing cameras?',
      a: 'Yes! SSSP works with any RTSP/ONVIF-compliant IP cameras. We also integrate with legacy CCTV systems.'
    }
  ];

  return (
    <div className="mt-24">
      <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
      <div className="max-w-3xl mx-auto space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            <h3 className="font-semibold mb-3">{faq.q}</h3>
            <p className="text-slate-300">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
