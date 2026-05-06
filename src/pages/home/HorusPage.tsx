import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Brain, Zap, Shield, Target, Clock, Star, ArrowRight, ChevronRight } from 'lucide-react';
import { CTAButton } from '@/components/common/CTAButton';

const FACE_STATS = [
  { value: '99.2%', label: 'Recognition accuracy', sub: 'clean conditions' },
  { value: '94.8%', label: 'Accuracy under challenge', sub: 'occlusion, low-light, angle' },
  { value: '<150ms', label: 'Per-frame inference', sub: 'on edge hardware' },
  { value: '16+', label: 'Simultaneous camera feeds', sub: 'per edge unit' },
];

const BEHAVIOR_STATS = [
  { value: '91%', label: 'Threat detection accuracy', sub: 'across 8 event categories' },
  { value: '<2s', label: 'Alert to operator', sub: 'from detection to screen' },
  { value: '8+', label: 'Threat categories', sub: 'fights, intrusion, vandalism & more' },
  { value: '24/7', label: 'Continuous monitoring', sub: 'never tired, never distracted' },
];

const FACE_EXAMPLES = [
  'Matches a face in a crowd against a 10,000-person watchlist — in under 200ms',
  'Still works when the person is wearing a mask, hat, or looking away',
  'Handles poor lighting, grainy footage, and off-angle frames',
  'Alerts the operator the moment a match is confirmed — with the frame as evidence',
  'Can verify identity at checkpoints, not just flag — two different modes, two different use cases',
];

const BEHAVIOR_EXAMPLES = [
  'Detects a fight before the first punch lands — based on posture and movement pattern',
  'Flags someone loitering in a restricted zone for longer than your set threshold',
  'Spots vandalism, aggressive behavior, and unauthorized intrusions in real time',
  'Creates an incident automatically — title, timestamp, camera, snapshot, all filled in',
  'Sends an alert to every operator on shift — with the video clip attached',
];

const ABP_FEATURES = [
  { label: 'Baseline learning', desc: 'Studies what "normal" looks like at your specific site over time' },
  { label: 'Drift detection', desc: 'Flags when something shifts — before it becomes an incident' },
  { label: 'Operator feedback loop', desc: 'Gets smarter every time an operator confirms or dismisses an alert' },
  { label: 'Explainability built in', desc: 'Tells you why it flagged something, not just that it did' },
];

export const HorusPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-16">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.04)_1px,transparent_1px)] [background-size:32px_32px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-sm mb-8">
            <Eye className="w-4 h-4" />
            Built in-house. Owned by us. Deployed on your site.
          </div>

          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Horus
            </span>
          </h1>

          <p className="text-2xl text-slate-200 max-w-3xl mx-auto leading-relaxed mb-4">
            We built an AI that sees, understands, and acts — on your cameras, in real time.
          </p>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
            Named after the ancient god of sight. Horus is the vision engine we created from scratch to power every
            camera in the SSSP platform. It recognizes faces. It reads behavior. And soon — it will predict danger
            before it happens.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <CTAButton onClick={() => navigate('/pricing')} icon>
              Get Horus on Your Site
            </CTAButton>
            <CTAButton variant="secondary" onClick={() => navigate('/capabilities')}>
              See All Capabilities
            </CTAButton>
          </div>
        </div>
      </section>

      {/* ── Three Pillars ── */}
      <section className="py-6 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-700/50">
            {[
              { icon: Eye, label: 'Identify', desc: 'Faces, watchlists, identities' },
              { icon: Brain, label: 'Understand', desc: 'Behavior, intent, events' },
              { icon: Target, label: 'Predict', desc: 'Danger before it happens (coming soon)' },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-4 px-8 py-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">{p.label}</div>
                  <div className="text-sm text-slate-400">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Face Recognition ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-6">
                <Eye className="w-3.5 h-3.5" />
                Face Recognition Engine
              </div>
              <h2 className="text-4xl font-bold mb-6">
                We built a face recognition engine that works in the real world — not just in demos.
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                Most face recognition systems are trained on clean, well-lit, front-facing photos.
                The real world isn't like that. People walk fast. Cameras have angles. Lighting is bad.
                We trained our face model specifically for these conditions — and the numbers show it.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                Horus can match a person's face against a watchlist of thousands in under 200 milliseconds.
                It works when they're wearing a mask, looking sideways, or caught on a grainy camera at night.
                The moment a match is confirmed, an alert goes out to every operator on shift — with the evidence frame attached.
              </p>
              <ul className="space-y-3">
                {FACE_EXAMPLES.map((ex, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <ChevronRight className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                    {ex}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {FACE_STATS.map((s, i) => (
                  <StatBlock key={i} {...s} accent="sky" />
                ))}
              </div>
              <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                <h3 className="font-bold mb-3 text-slate-200">Two modes, two use cases</h3>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-200">Watchlist matching</span>
                      <span className="text-slate-400"> — passively scans every frame, alerts when a known face appears anywhere on your camera network</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-200">Identity verification</span>
                      <span className="text-slate-400"> — actively confirms who someone is at a checkpoint before access is granted</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Behavior Detection ── */}
      <section className="py-24 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {BEHAVIOR_STATS.map((s, i) => (
                  <StatBlock key={i} {...s} accent="indigo" />
                ))}
              </div>
              <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                <h3 className="font-bold mb-3 text-slate-200">What Horus detects</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Physical fights', 'Unauthorized intrusion', 'Vandalism', 'Crowd panic', 'Loitering', 'Perimeter breach', 'Unattended objects'].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
                <Brain className="w-3.5 h-3.5" />
                Behavior Understanding Engine
              </div>
              <h2 className="text-4xl font-bold mb-6">
                Horus doesn't just watch. It understands what people are doing — and why it matters.
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                A camera can record a fight. Horus can flag a fight before it fully breaks out —
                based on posture shifts, sudden movements, and spatial patterns we trained it to recognize.
                We built this behavior engine ourselves, trained it on real threat scenarios, and tuned it for
                the kind of environments our buyers actually operate in.
              </p>
              <p className="text-slate-400 leading-relaxed mb-8">
                The moment Horus detects a threat, it doesn't just send an alert — it creates a full incident automatically.
                Title, timestamp, camera ID, snapshot evidence, severity level. The operator gets everything they need
                to act, in under two seconds.
              </p>
              <ul className="space-y-3">
                {BEHAVIOR_EXAMPLES.map((ex, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <ChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Horus Versions ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Horus comes in two versions</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Same core engine. Different power levels. You pick based on your site's risk and hardware.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700 p-8 hover:border-slate-600 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">Horus Legacy</div>
                  <div className="text-xs text-slate-400">Efficient · Proven · Scalable</div>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Optimized for high-throughput deployments — many cameras, tight hardware budgets,
                sites where reliability matters more than pushing every last percent of accuracy.
                Trusted, fast, and battle-tested.
              </p>
              <div className="text-xs text-slate-500">
                Best for: campuses, smart city pilots, public venues
              </div>
            </div>

            <div className="bg-gradient-to-br from-sky-900/30 to-indigo-900/30 rounded-2xl border border-sky-500/30 p-8 hover:border-sky-500/50 transition-all relative">
              <div className="absolute -top-3 right-6 px-3 py-0.5 bg-amber-400 text-amber-900 rounded-full text-xs font-bold">
                Recommended
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg text-sky-300">Horus Plus</div>
                  <div className="text-xs text-sky-400/70">Max accuracy · High-risk sites</div>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Full-power Horus — every capability at its highest accuracy setting.
                For deployments where a missed detection has real consequences.
                Airports, intelligence agencies, border control, critical infrastructure.
              </p>
              <div className="text-xs text-sky-500/70">
                Best for: airports, defense, intelligence, border control
              </div>
            </div>
          </div>

          <p className="text-center text-slate-400 text-sm mt-8">
            Both versions run on your hardware — no cloud dependency. Start with Legacy, upgrade to Plus any time.
          </p>
        </div>
      </section>

      {/* ── ABP Coming Soon ── */}
      <section className="py-24 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row items-start justify-between gap-10">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6">
                  <Clock className="w-3.5 h-3.5" />
                  The Next Step — Future of Horus
                </div>

                <h2 className="text-4xl font-bold mb-4">
                  Horus will predict danger.{' '}
                  <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Not just detect it.
                  </span>
                </h2>

                <p className="text-lg text-slate-300 mb-4 leading-relaxed">
                  Identifying faces and detecting fights is step one. Step two is knowing something bad is about to happen
                  before it does — and we're building that now.
                </p>

                <p className="text-slate-400 leading-relaxed mb-8">
                  We're calling it ABP — Abnormal Behavior Prediction. The idea is straightforward:
                  Horus will learn what "normal" looks like at your site specifically — your traffic patterns,
                  your routines, your busy hours. When something drifts from that baseline, even slightly,
                  it will flag it. Not because a rule was triggered. Because something just feels off.
                  That's the difference between a security system that reacts and one that protects.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {ABP_FEATURES.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
                    >
                      <Star className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-slate-200">{f.label}</div>
                        <div className="text-xs text-slate-400">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:w-72 flex-shrink-0 bg-slate-900/60 rounded-2xl border border-indigo-500/20 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="text-xl font-bold mb-3">Interested in ABP?</div>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  We're running early pilot conversations now. If predicting threats before they happen sounds
                  like something your site needs — let's talk.
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                >
                  Express Interest
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why we built it ── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold mb-8">
            <Zap className="w-3.5 h-3.5" />
            Why we built our own AI
          </div>
          <h2 className="text-4xl font-bold mb-6">
            We didn't want to depend on someone else's model.
          </h2>
          <p className="text-xl text-slate-300 leading-relaxed mb-6 max-w-3xl mx-auto">
            When you buy off-the-shelf AI, you get off-the-shelf results. We wanted something built
            specifically for security deployments — trained on the right data, tuned for the right conditions,
            and owned by us completely.
          </p>
          <p className="text-lg text-slate-400 leading-relaxed mb-12 max-w-3xl mx-auto">
            Horus is the result. Every capability — face recognition, behavior understanding, alert generation —
            is ours. We can improve it, customize it for your environment, and push updates without waiting
            for a third-party to release a new version.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Eye, title: 'We own the models', desc: 'Built from the ground up. No vendor lock-in. No usage fees per recognition.' },
              { icon: Shield, title: 'Runs on your hardware', desc: 'No API calls going out. No data leaving your network. Complete control.' },
              { icon: Brain, title: 'We can customize it', desc: "If your site has specific threat patterns, we can train Horus to recognize them specifically." },
            ].map((item, i) => (
              <div key={i} className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700 text-left">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold mb-2">{item.title}</div>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <CTAButton onClick={() => navigate('/pricing')} icon>
              Deploy Horus at Your Site
            </CTAButton>
            <CTAButton variant="secondary" onClick={() => navigate('/use-cases')}>
              See Use Cases
            </CTAButton>
          </div>
        </div>
      </section>

    </div>
  );
};

const StatBlock: React.FC<{ value: string; label: string; sub: string; accent: 'sky' | 'indigo' }> = ({
  value,
  label,
  sub,
  accent,
}) => {
  const color = accent === 'sky' ? 'text-sky-400' : 'text-indigo-400';
  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-5 text-center">
      <div className={`text-3xl font-bold mb-1 ${color}`}>{value}</div>
      <div className="text-sm font-semibold text-slate-200 mb-0.5">{label}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
};
