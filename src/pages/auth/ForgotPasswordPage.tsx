import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => /\S+@\S+\.\S+/.test(email.trim()), [email]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      // Your Swagger does not expose a password reset endpoint yet.
      // When you add it (ex: POST /api/Auth/forgot-password), call it here.
      await new Promise((r) => setTimeout(r, 600));
      toast.success("If this email exists, you’ll receive reset instructions shortly.");
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-indigo-500/12 blur-3xl" />
        <div className="absolute -bottom-56 -right-40 h-[520px] w-[520px] rounded-full bg-sky-500/12 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-3xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.55),0_24px_90px_rgba(0,0,0,0.5)] backdrop-blur"
        >
          <div className="mb-6 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/15 ring-1 ring-sky-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Reset your password</h1>
              <p className="text-sm text-slate-300">We&apos;ll send instructions to your email.</p>
            </div>
          </div>

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-950/40 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500/40"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </Button>

            <div className="text-center text-sm text-slate-300">
              Remembered it?{" "}
              <Link to="/login" className="text-sky-300 hover:text-sky-200">
                Back to sign in
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 text-xs text-slate-300">
              <p>
                <span className="font-semibold text-slate-200">API note:</span> you don&apos;t have a reset endpoint in Swagger yet.
                Add one later and we&apos;ll wire it here.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
