import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Activity, Sparkles } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const chartData = [
  { t: "00", v: 22 },
  { t: "04", v: 26 },
  { t: "08", v: 24 },
  { t: "12", v: 31 },
  { t: "16", v: 29 },
  { t: "20", v: 35 },
  { t: "24", v: 33 },
];

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute -bottom-56 -right-40 h-[520px] w-[520px] rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-stretch gap-6 px-4 py-10 md:grid-cols-2 md:px-8">
        {/* Left visual panel */}
        <motion.aside
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative hidden overflow-hidden rounded-3xl border border-slate-800/70 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-8 shadow-[0_0_0_1px_rgba(15,23,42,0.6),0_20px_80px_rgba(0,0,0,0.45)] md:block"
        >
          <div className="flex items-center gap-2 text-slate-200">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/15 ring-1 ring-sky-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide">SSSP</div>
              <div className="text-xs text-slate-400">Enterprise Monitoring & AI Events</div>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <h1 className="text-3xl font-semibold leading-tight">
              Secure access to your <span className="text-sky-300">real-time</span> operations
            </h1>
            <p className="text-sm leading-relaxed text-slate-300">
              Live incident streams, camera status, and face recognition — unified in a clean dark dashboard.
            </p>
          </div>

          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <Activity className="h-4 w-4 text-sky-300" />
                  <span>System load</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200 ring-1 ring-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Stable
                </span>
              </div>

              <div className="mt-3 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(2,6,23,0.95)",
                        border: "1px solid rgba(51,65,85,0.6)",
                        borderRadius: 12,
                        color: "#e2e8f0",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Line type="monotone" dataKey="v" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Last 24h</span>
                <span className="inline-flex items-center gap-1 text-sky-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI-ready
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
                <div className="text-xs text-slate-400">Incidents</div>
                <div className="mt-1 text-xl font-semibold">24</div>
                <div className="mt-1 text-xs text-emerald-200">+6 today</div>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
                <div className="text-xs text-slate-400">Cameras</div>
                <div className="mt-1 text-xl font-semibold">18</div>
                <div className="mt-1 text-xs text-sky-200">15 online</div>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
                <div className="text-xs text-slate-400">Latency</div>
                <div className="mt-1 text-xl font-semibold">82ms</div>
                <div className="mt-1 text-xs text-slate-300">avg</div>
              </div>
            </div>
          </div>

          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        </motion.aside>

        {/* Right form panel */}
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center justify-center"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.55),0_24px_90px_rgba(0,0,0,0.5)] backdrop-blur">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
            </div>

            {children}

            <p className="mt-6 text-center text-xs text-slate-400">
              By continuing, you agree to the system security policies.
            </p>
          </div>
        </motion.main>
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const canSubmit = useMemo(() => {
    const emailOk = /\S+@\S+\.\S+/.test(username.trim());
    return emailOk && password.trim().length >= 6;
  }, [username, password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Please enter a valid email and a 6+ char password.");
      return;
    }

    try {
      await login({username, password}); // <-- your API connection is here
      toast.success("Welcome back!");
      /*const u = useAuthStore.getState().user;
      const target =
      u?.role === UserRole.Admin
      ? "/app/admin"
      : u?.role === UserRole.Operator
      ? "/app/dashboard"
      : "/app/user/dashboard";


      navigate(target, { replace: true });*/
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your account to access monitoring dashboards and real-time events."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10 bg-slate-950/40 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500/40"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-200">
              Password
            </Label>
            <Link to="/forgot-password" className="text-xs text-sky-300 hover:text-sky-200">
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 bg-slate-950/40 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500/40"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!canSubmit || isLoading}
          className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold disabled:opacity-60"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>

        <div className="text-center text-sm text-slate-300">
          Don&apos;t have access yet?{" "}
          <Link to="/signup" className="text-sky-300 hover:text-sky-200">
            Create an account
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
