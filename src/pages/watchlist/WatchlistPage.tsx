import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, User, Search, RefreshCw, Clock, AlertTriangle, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SecurityBadge } from "@/components/ui/security-badge";
import { cn } from "@/lib/utils";
import { userApi } from "@/lib/api/userApi";
import type { User as UserType } from "@/types";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  catch { return "—"; }
}

function relTime(iso?: string | null) {
  if (!iso) return "—";
  const diff = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function roleLabel(role: number) {
  const labels = ["", "Admin", "Operator", "User"];
  return labels[role] ?? "Unknown";
}

// ── WatchlistPage ────────────────────────────────────────────────────────────
export function WatchlistPage() {
  const [users,    setUsers]    = useState<UserType[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<UserType | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await userApi.getWatchlist();
      setUsers(rows);
      if (selected) {
        const updated = rows.find(u => u.id === selected.id);
        setSelected(updated ?? null);
      }
    } catch {
      toast.error("Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.userName.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <div className="glass-panel rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/15"><ShieldAlert className="w-5 h-5 text-red-400" /></div>
            <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
            <SecurityBadge variant="critical">{users.length} persons</SecurityBadge>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">
            Persons of interest flagged for enhanced monitoring. Real-time alerts generated on detection.
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border/50 bg-surface-2 hover:bg-surface-3 transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Flagged",  value: users.length,                               icon: ShieldAlert,   bg: "bg-red-500/10 text-red-400"     },
          { label: "Active Users",   value: users.filter(u => u.isActive).length,       icon: User,          bg: "bg-amber-500/10 text-amber-400"  },
          { label: "With Reason",    value: users.filter(u => u.watchlistReason).length, icon: AlertTriangle, bg: "bg-surface-2 text-muted-foreground" },
        ].map(k => (
          <div key={k.label} className={cn("glass-card rounded-xl px-4 py-3 flex items-center gap-3", k.bg.split(" ")[0])}>
            <k.icon className={cn("w-5 h-5 shrink-0", k.bg.split(" ")[1])} />
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</div>
              <div className="text-2xl font-bold tabular font-mono leading-tight">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="glass-panel rounded-2xl px-5 py-3">
        <div className="relative flex items-center w-full sm:w-[380px]">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email…"
            className="pl-9 bg-surface-2 border-border/50 h-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Split: list + detail */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">

        {/* List */}
        <Card className="glass-card">
          <CardHeader className="pb-2 pt-4 px-5 border-b border-border/30">
            <div className="font-semibold text-sm">Watchlisted Persons</div>
            <div className="text-xs text-muted-foreground">{filtered.length} entries</div>
          </CardHeader>
          <CardContent className="pt-3 px-5 pb-5 space-y-2 max-h-[640px] overflow-y-auto scrollbar-thin">
            <AnimatePresence>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 border border-dashed border-border/40 rounded-xl text-muted-foreground">
                  {loading ? (
                    <RefreshCw className="w-7 h-7 mb-2 opacity-30 animate-spin" />
                  ) : (
                    <CheckCircle className="w-7 h-7 mb-2 opacity-30" />
                  )}
                  <p className="text-sm">{loading ? "Loading…" : "No watchlisted persons found."}</p>
                </div>
              ) : (
                filtered.map((u, i) => (
                  <motion.button
                    key={u.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelected(selected?.id === u.id ? null : u)}
                    className={cn(
                      "w-full text-left rounded-xl border p-3.5 transition-all border-l-[3px] border-l-red-500",
                      selected?.id === u.id
                        ? "bg-surface-3 border-primary/30"
                        : "bg-surface-1 border-border/40 hover:bg-surface-2 hover:border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
                        {u.fullName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{u.fullName}</span>
                          <SecurityBadge variant={u.isActive ? "high" : "neutral"}>
                            {u.isActive ? "Active" : "Inactive"}
                          </SecurityBadge>
                          <SecurityBadge variant="critical">Watchlist</SecurityBadge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {u.email} · {roleLabel(u.role)}
                        </div>
                        {u.watchlistReason && (
                          <div className="text-xs text-red-400/80 mt-0.5 truncate">{u.watchlistReason}</div>
                        )}
                      </div>
                      {u.watchlistAddedAt && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                          <Clock className="w-3 h-3" />
                          {relTime(u.watchlistAddedAt)}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Detail panel */}
        <div>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                {/* Profile header */}
                <div className="px-5 py-4 border-b border-border/30 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400 font-bold text-lg">
                      {selected.fullName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="font-bold text-base">{selected.fullName}</div>
                      <div className="text-xs text-muted-foreground">{selected.email}</div>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Watchlist reason */}
                  {selected.watchlistReason && (
                    <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Watchlist Reason</span>
                      </div>
                      <p className="text-sm font-medium text-red-300/90">{selected.watchlistReason}</p>
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Role",          value: roleLabel(selected.role)               },
                      { label: "Status",        value: selected.isActive ? "Active" : "Inactive" },
                      { label: "Username",      value: selected.userName || "—"               },
                      { label: "User ID",       value: selected.id.slice(0, 8) + "…"          },
                      { label: "Added",         value: fmtDate(selected.watchlistAddedAt)     },
                      { label: "Added By",      value: selected.watchlistAddedBy || "—"       },
                    ].map(f => (
                      <div key={f.label} className="rounded-xl border border-border/40 bg-surface-2 p-3">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</div>
                        <div className="text-sm font-semibold mt-0.5 truncate">{f.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <SecurityBadge variant="critical">Watchlisted</SecurityBadge>
                    <SecurityBadge variant={selected.isActive ? "high" : "neutral"}>
                      {selected.isActive ? "Account Active" : "Account Inactive"}
                    </SecurityBadge>
                  </div>

                  <div className="text-xs text-muted-foreground border-t border-border/30 pt-3">
                    All detections of this person in camera feeds will generate a critical alert.
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center border border-dashed border-border/40"
              >
                <User className="w-10 h-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">Select a person to view their profile</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
