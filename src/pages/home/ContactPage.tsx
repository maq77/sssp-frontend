import React, { useState } from 'react';
import { CheckCircle, ArrowRight, Mail, Clock, Shield, Loader2 } from 'lucide-react';

type FormState = 'idle' | 'loading' | 'success' | 'error';

interface FormData {
  fullName: string;
  email: string;
  organization: string;
  role: string;
  deploymentInterest: string;
  cameraCount: string;
  message: string;
}

const DEPLOYMENT_OPTIONS = [
  'Smart City',
  'Airport & Border Control',
  'Intelligence Agency / Defense',
  'Restricted Facility',
  'Campus / Hospital',
  'Other / Just exploring',
];

const CAMERA_OPTIONS = [
  'Under 10 cameras',
  '10 – 50 cameras',
  '50 – 200 cameras',
  '200+ cameras',
  "Not sure yet",
];

const ROLE_OPTIONS = [
  'CEO / Founder',
  'CTO / Technical Lead',
  'Security Director / CISO',
  'Procurement / Contracts',
  'Government Official',
  'Investor',
  'Other',
];

const WHAT_HAPPENS = [
  {
    step: '01',
    title: 'We read your request — same day',
    desc: 'A person, not a bot. Not a BDR reading from a script. Someone who actually knows the platform.',
  },
  {
    step: '02',
    title: 'We get on a call within 24 hours',
    desc: "We'll ask what your site looks like, what's gone wrong before, and what you need the system to catch.",
  },
  {
    step: '03',
    title: 'We run a live demo on your terms',
    desc: "Your cameras, your environment, your edge cases — not a rehearsed stage demo with ideal conditions.",
  },
];

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    organization: '',
    role: '',
    deploymentInterest: '',
    cameraCount: '',
    message: '',
  });
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
          fullName: form.fullName,
          email: form.email,
          organization: form.organization,
          role: form.role || undefined,
          deploymentInterest: form.deploymentInterest || undefined,
          cameraCount: form.cameraCount || undefined,
          message: form.message || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.title ?? 'Something went wrong. Please try again.');
      }

      setState('success');
    } catch (err: unknown) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="pt-16">
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="max-w-3xl mb-16">
            <h1 className="text-5xl font-bold mb-4">Let's talk.</h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Tell us what you're securing and what you need it to catch. We'll map the right modules,
              walk you through a live demo on your actual site, and put together a pilot plan.
              No commitment. No pressure. Just one honest conversation.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-12">

            {/* Form — 3 cols */}
            <div className="lg:col-span-3">
              {state === 'success' ? (
                <SuccessState name={form.fullName.split(' ')[0]} />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Row 1: Name + Email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full Name" required>
                      <input
                        name="fullName"
                        type="text"
                        required
                        placeholder="Mohamed Amin"
                        value={form.fullName}
                        onChange={handleChange}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Work Email" required>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="you@organization.gov"
                        value={form.email}
                        onChange={handleChange}
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  {/* Row 2: Organization + Role */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Organization" required>
                      <input
                        name="organization"
                        type="text"
                        required
                        placeholder="City of Cairo / GCHQ / Heathrow"
                        value={form.organization}
                        onChange={handleChange}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Your Role">
                      <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className={selectCls}
                      >
                        <option value="">Select your role…</option>
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Row 3: Deployment + Cameras */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="What are you deploying for?">
                      <select
                        name="deploymentInterest"
                        value={form.deploymentInterest}
                        onChange={handleChange}
                        className={selectCls}
                      >
                        <option value="">Select environment…</option>
                        {DEPLOYMENT_OPTIONS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Approx. camera count">
                      <select
                        name="cameraCount"
                        value={form.cameraCount}
                        onChange={handleChange}
                        className={selectCls}
                      >
                        <option value="">Select range…</option>
                        {CAMERA_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Message */}
                  <Field label="Anything you'd like us to know?">
                    <textarea
                      name="message"
                      rows={4}
                      placeholder="Tell us about your site, your current setup, or specific challenges you're trying to solve…"
                      value={form.message}
                      onChange={handleChange}
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                  {/* Error */}
                  {state === 'error' && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={state === 'loading'}
                    className="w-full py-4 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-sky-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {state === 'loading' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        Send Message
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-slate-500 text-center">
                    We respond within 24 hours. No spam, no unsolicited follow-ups. Just one conversation.
                  </p>
                </form>
              )}
            </div>

            {/* Sidebar — 2 cols */}
            <div className="lg:col-span-2 space-y-6">

              {/* What happens next */}
              <div className="bg-slate-800/30 rounded-2xl border border-slate-700 p-8">
                <h3 className="text-xl font-bold mb-6">What happens next</h3>
                <div className="space-y-6">
                  {WHAT_HAPPENS.map((item) => (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="text-sky-400 font-bold text-sm w-6 flex-shrink-0 mt-0.5">{item.step}</div>
                      <div>
                        <div className="font-semibold mb-1">{item.title}</div>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust */}
              <div className="bg-slate-800/30 rounded-2xl border border-slate-700 p-6 space-y-4">
                {[
                  { icon: Shield, text: 'NDA available on request — before anything sensitive is discussed' },
                  { icon: Clock, text: 'Same-day response. Usually within a few hours.' },
                  { icon: Mail, text: "You're talking to the people who built this. Not a sales rep reading from a deck." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <item.icon className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-300">{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Alternative */}
              <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-2xl p-6">
                <h4 className="font-bold mb-2">Prefer to reach out directly?</h4>
                <p className="text-sm text-slate-400 mb-3">
                  Skip the form. Email us and you'll get a human response — same day.
                </p>
                <a
                  href="mailto:maqmohamed8@gmail.com"
                  className="text-sky-400 hover:text-sky-300 font-semibold text-sm flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  maqmohamed8@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const SuccessState: React.FC<{ name: string }> = ({ name }) => (
  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-3xl p-12 text-center">
    <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
      <CheckCircle className="w-8 h-8 text-green-400" />
    </div>
    <h2 className="text-3xl font-bold mb-3">We got it, {name}.</h2>
    <p className="text-lg text-slate-300 mb-4">
      Your message is with us. We'll reach out within 24 hours — usually much faster.
    </p>
    <p className="text-slate-400 text-sm">
      Check your inbox for a confirmation. And if you don't hear from us by tomorrow, email us directly at{' '}
      <a href="mailto:maqmohamed8@gmail.com" className="text-sky-400 hover:underline">
        maqmohamed8@gmail.com
      </a>
    </p>
  </div>
);

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">
      {label}
      {required && <span className="text-sky-400 ml-1">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  'w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all';

const selectCls =
  'w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all appearance-none';
