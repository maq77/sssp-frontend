import React, { useState } from 'react';
import { CheckCircle, X, ArrowRight, Loader2 } from 'lucide-react';
import { PRICING_PLANS, HARDWARE_ITEMS } from '@/data/pricing.data';
import { PricingPlan, HardwareItem } from '@/types/pricing.types';

export const PricingPage: React.FC = () => {
  return (
    <div className="pt-16">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">Flexible Pricing</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Start with what you need today. Scale as your deployment grows.
              Every tier includes the core SSSP platform — you choose which modules to activate.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {PRICING_PLANS.map((plan, i) => (
              <PricingCard key={i} {...plan} />
            ))}
          </div>

          <HardwareSection />
          <FAQSection />
          <ContactSalesSection />
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
  popular,
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
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full text-sm font-semibold whitespace-nowrap">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <p className="text-sm text-slate-400 mb-4">{description}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold">{price}</span>
          {period && <span className="text-slate-400">{period}</span>}
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
    <div className="mb-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Hardware Add-ons</h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Optional hardware bundles that integrate directly with SSSP.
          You can also bring your own compatible cameras and sensors.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {HARDWARE_ITEMS.map((item, i) => (
          <HardwareCard key={i} {...item} />
        ))}
      </div>
    </div>
  );
};

const HardwareCard: React.FC<HardwareItem> = ({ name, price, Icon, specs }) => {
  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-all">
      <div className="bg-gradient-to-br from-slate-700/50 to-slate-800 p-12 flex items-center justify-center">
        <Icon className="w-20 h-20 text-sky-400" />
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <div className="text-2xl font-bold text-sky-400 mb-4">{price}</div>

        <div className="space-y-2 mb-6">
          {specs.map((spec, j) => (
            <div key={j} className="flex items-start gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300">{spec}</span>
            </div>
          ))}
        </div>

        <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-all">
          Request Quote
        </button>
      </div>
    </div>
  );
};

const FAQSection: React.FC = () => {
  const faqs = [
    {
      q: 'Can I start with a trial before committing?',
      a: 'Yes. Pilot deployments and live demos are available. Scope depends on your camera count, site complexity, and which modules you want to test.',
    },
    {
      q: 'Do you work with our existing cameras?',
      a: 'Yes — SSSP works with any RTSP/ONVIF-compliant IP camera. We also support integration with legacy CCTV systems. No need to rip and replace.',
    },
    {
      q: 'Can it run completely on-premises?',
      a: 'Absolutely. SSSP is designed for on-prem deployment. AI inference runs on edge hardware. No data needs to leave your site.',
    },
    {
      q: 'Do you offer volume discounts for large deployments?',
      a: 'Yes. Enterprise and multi-site deployments get custom pricing based on camera count, sensor package, and contract scope.',
    },
    {
      q: 'What about support and onboarding?',
      a: 'Every deployment includes an onboarding process: camera setup, module configuration, operator training, and a handover plan. Enterprise includes a dedicated rollout team.',
    },
  ];

  return (
    <div>
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

type ContactState = 'idle' | 'loading' | 'success' | 'error';

const ContactSalesSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [interest, setInterest] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<ContactState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'loading') return;
    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          email,
          organization: org,
          deploymentInterest: interest || undefined,
          message: message || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.title ?? 'Something went wrong.');
      }

      setState('success');
    } catch (err: unknown) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    }
  };

  const inputCls =
    'w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all text-sm';

  return (
    <div className="mt-24">
      <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-3xl p-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* Left: copy */}
          <div>
            <h2 className="text-4xl font-bold mb-4">Not sure which plan fits?</h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Tell us about your site and we'll help you figure it out. Most buyers start with a conversation —
              not a checkout page. We'll map your cameras, recommend the right modules, and put together
              a pilot plan that makes sense for your environment.
            </p>
            <div className="space-y-3 text-sm text-slate-400">
              {[
                'We respond same day — usually within a few hours',
                'No commitment required to have the conversation',
                'NDA available before we discuss anything sensitive',
                'You\'ll talk to the people who actually built this',
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-sky-500 flex-shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right: mini form */}
          <div>
            {state === 'success' ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Got it. We'll be in touch.</h3>
                <p className="text-slate-400 text-sm">
                  Expect to hear from us within 24 hours. Check your inbox for a confirmation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Full Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Work Email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Organization *"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className={inputCls}
                />
                <select
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className={`${inputCls} appearance-none`}
                >
                  <option value="">Deployment interest (optional)…</option>
                  {['Smart City', 'Airport & Border Control', 'Intelligence Agency / Defense', 'Restricted Facility', 'Campus / Hospital', 'Other'].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <textarea
                  rows={3}
                  placeholder="Anything you want us to know? (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${inputCls} resize-none`}
                />

                {state === 'error' && (
                  <p className="text-red-400 text-sm">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={state === 'loading'}
                  className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl font-bold hover:shadow-xl hover:shadow-sky-500/40 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {state === 'loading' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  ) : (
                    <>Send Message <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
