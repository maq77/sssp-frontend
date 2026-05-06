import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { UserRole, type CreateUserWithRoleDTO } from "@/types";

function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-56 -right-40 h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.55),0_24px_90px_rgba(0,0,0,0.5)] backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  );
}

export function SignUpPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [operatorId, setOperatorId] = useState(""); // optional
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const emailOk = /\S+@\S+\.\S+/.test(email.trim());
    return fullName.trim().length >= 3 && emailOk && password.trim().length >= 6;
  }, [fullName, email, password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Please fill the form correctly.");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateUserWithRoleDTO = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        operatorId: operatorId ? Number(operatorId) : null,
        role: UserRole.User,
      };

      await apiClient.post("/Admin/users", payload);

      toast.success("Account created. You can now sign in.");
      navigate("/login");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        toast.error("Signup requires Admin approval. Please contact your administrator.");
      } else {
        toast.error(err?.message || "Signup failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/15 ring-1 ring-sky-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Create account</h1>
            <p className="text-sm text-slate-300">Join SSSP monitoring workspace.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-slate-200">
              Full name
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Mohamed Amin"
                className="pl-10 bg-slate-950/40 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="pl-10 bg-slate-950/40 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operatorId" className="text-slate-200">
              Operator ID <span className="text-slate-500">(optional)</span>
            </Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="operatorId"
                inputMode="numeric"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="e.g. 12"
                className="pl-10 bg-slate-950/40 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-sky-500/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
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
            <p className="text-xs text-slate-400">
              Minimum 6 characters. Consider using a long passphrase.
            </p>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </Button>

          <div className="text-center text-sm text-slate-300">
            Already have an account?{" "}
            <Link to="/login" className="text-sky-300 hover:text-sky-200">
              Sign in
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-sky-300" />
              <p>
                If you don&apos;t have an Admin token, this may be blocked by the API (401/403). Ask your Admin to
                create your account from the Users page.
              </p>
            </div>
          </div>
        </form>
      </motion.div>
    </AuthFrame>
  );
}
