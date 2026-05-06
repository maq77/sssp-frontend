import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Mail, Building2, Phone, Calendar, Clock,
  ChevronDown, Copy, Check, X, StickyNote, Filter,
  ExternalLink, RefreshCw, Search,
} from "lucide-react";
import { toast } from "sonner";
//CardHeader
import { Card, CardContent} from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api-client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LeadDto {
  id: number;
  fullName: string;
  email: string;
  organization: string;
  role: string | null;
  deploymentInterest: string | null;
  cameraCount: string | null;
  message: string | null;
  submittedAt: string;
  status: string;
  internalNotes: string | null;
  lastContactedAt: string | null;
}

type LeadStatus = "New" | "Contacted" | "Qualified" | "Converted" | "NotInterested";

const STATUS_OPTIONS: LeadStatus[] = ["New", "Contacted", "Qualified", "Converted", "NotInterested"];

const STATUS_STYLE: Record<LeadStatus, string> = {
  New:           "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Contacted:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Qualified:     "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Converted:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  NotInterested: "bg-red-500/15 text-red-400 border-red-500/30",
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  New:           "New",
  Contacted:     "Contacted",
  Qualified:     "Qualified",
  Converted:     "Converted",
  NotInterested: "Not Interested",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function fmtFull(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── StatusDropdown ────────────────────────────────────────────────────────────

function StatusDropdown({ lead, onUpdate }: { lead: LeadDto; onUpdate: (id: number, status: LeadStatus) => void }) {
  const [open, setOpen] = useState(false);
  const current = lead.status as LeadStatus;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all ${STATUS_STYLE[current] ?? "bg-slate-700/50 text-slate-400 border-slate-600"}`}
      >
        {STATUS_LABEL[current] ?? current}
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-full mt-1 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl min-w-[10rem] overflow-hidden"
            >
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { onUpdate(lead.id, s); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-700/60 transition-colors flex items-center gap-2 ${s === current ? "text-sky-400" : "text-slate-300"}`}
                >
                  <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[s]?.includes("blue") ? "bg-blue-400" : STATUS_STYLE[s]?.includes("yellow") ? "bg-yellow-400" : STATUS_STYLE[s]?.includes("sky") ? "bg-sky-400" : STATUS_STYLE[s]?.includes("emerald") ? "bg-emerald-400" : "bg-red-400"}`} />
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── NotesPanel ────────────────────────────────────────────────────────────────

function NotesPanel({ lead, onSave }: { lead: LeadDto; onSave: (id: number, notes: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(lead.internalNotes ?? "");

  useEffect(() => { setVal(lead.internalNotes ?? ""); }, [lead.internalNotes]);

  const save = () => { onSave(lead.id, val); setEditing(false); };
  const cancel = () => { setVal(lead.internalNotes ?? ""); setEditing(false); };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <StickyNote className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Internal Notes</span>
        {!editing && (
          <button onClick={() => setEditing(true)} className="ml-auto text-xs text-sky-400 hover:text-sky-300 transition-colors">
            {val ? "Edit" : "+ Add"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={val}
            onChange={e => setVal(e.target.value)}
            rows={3}
            placeholder="Add private notes about this lead..."
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} className="h-7 text-xs bg-sky-600 hover:bg-sky-500 text-white">Save</Button>
            <Button size="sm" variant="ghost" onClick={cancel} className="h-7 text-xs text-slate-400 hover:text-slate-200">Cancel</Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 leading-relaxed min-h-[1.5rem]">
          {val || <span className="text-slate-600 italic">No notes yet</span>}
        </p>
      )}
    </div>
  );
}

// ── LeadDetailPanel ───────────────────────────────────────────────────────────

function LeadDetailPanel({
  lead,
  onClose,
  onStatusUpdate,
  onNotesUpdate,
}: {
  lead: LeadDto;
  onClose: () => void;
  onStatusUpdate: (id: number, status: LeadStatus) => void;
  onNotesUpdate: (id: number, notes: string) => void;
}) {
  return (
    <motion.div
      key={lead.id}
      initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
      className="bg-slate-900 border border-slate-700/60 rounded-2xl flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-800">
        <div>
          <h3 className="font-bold text-slate-100 text-base leading-tight">{lead.fullName}</h3>
          <p className="text-sm text-slate-400 mt-0.5">{lead.organization}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Status */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Pipeline Status</p>
          <StatusDropdown lead={lead} onUpdate={onStatusUpdate} />
        </div>

        {/* Contact info */}
        <div className="space-y-2.5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Contact</p>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-sm text-slate-200 break-all">{lead.email}</span>
            <CopyButton value={lead.email} />
            <a href={`mailto:${lead.email}`} target="_blank" rel="noreferrer" className="p-1 text-slate-500 hover:text-sky-400 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          {lead.role && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-sm text-slate-300">{lead.role}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-sm text-slate-300">{lead.organization}</span>
          </div>
        </div>

        {/* Inquiry details */}
        <div className="space-y-2.5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Inquiry Details</p>
          {lead.deploymentInterest && (
            <div className="flex gap-2 text-sm">
              <span className="text-slate-500 shrink-0 w-28">Interest</span>
              <span className="text-slate-300">{lead.deploymentInterest}</span>
            </div>
          )}
          {lead.cameraCount && (
            <div className="flex gap-2 text-sm">
              <span className="text-slate-500 shrink-0 w-28">Camera count</span>
              <span className="text-slate-300">{lead.cameraCount}</span>
            </div>
          )}
          {lead.message && (
            <div className="flex gap-2 text-sm">
              <span className="text-slate-500 shrink-0 w-28">Message</span>
              <span className="text-slate-300 leading-relaxed">{lead.message}</span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-2.5">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Timeline</p>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Submitted</span>
            <span className="text-slate-300 ml-auto">{fmtFull(lead.submittedAt)}</span>
          </div>
          {lead.lastContactedAt && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Last contact</span>
              <span className="text-slate-300 ml-auto">{fmtFull(lead.lastContactedAt)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        <NotesPanel lead={lead} onSave={onNotesUpdate} />
      </div>

      {/* Footer action */}
      <div className="p-4 border-t border-slate-800">
        <a
          href={`mailto:${lead.email}?subject=Following up — SSSP Platform&body=Hi ${lead.fullName.split(" ")[0]},`}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold text-sm transition-all"
        >
          <Mail className="w-4 h-4" />
          Send Email
        </a>
      </div>
    </motion.div>
  );
}

// ── LeadRow ───────────────────────────────────────────────────────────────────

function LeadRow({
  lead,
  selected,
  onClick,
  onStatusUpdate,
}: {
  lead: LeadDto;
  selected: boolean;
  onClick: () => void;
  onStatusUpdate: (id: number, status: LeadStatus) => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-b border-slate-800/60 transition-all hover:bg-slate-800/40 ${selected ? "bg-slate-800/60" : ""}`}
    >
      <td className="px-4 py-3.5">
        <div className="font-semibold text-sm text-slate-100">{lead.fullName}</div>
        <div className="text-xs text-slate-400 mt-0.5">{lead.email}</div>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="text-sm text-slate-300">{lead.organization}</div>
        {lead.role && <div className="text-xs text-slate-500 mt-0.5">{lead.role}</div>}
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <span className="text-xs text-slate-400">{lead.deploymentInterest ?? "—"}</span>
      </td>
      <td className="px-4 py-3.5">
        <div onClick={e => e.stopPropagation()}>
          <StatusDropdown lead={lead} onUpdate={onStatusUpdate} />
        </div>
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell text-right">
        <span className="text-xs text-slate-500">{fmt(lead.submittedAt)}</span>
      </td>
    </tr>
  );
}

// ── Main LeadsPage ────────────────────────────────────────────────────────────

const FILTER_TABS: Array<"All" | LeadStatus> = ["All", "New", "Contacted", "Qualified", "Converted", "NotInterested"];

export function LeadsPage() {
  const [leads, setLeads]           = useState<LeadDto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<"All" | LeadStatus>("All");
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<LeadDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "All" ? `?status=${filter}` : "";
      const data = await apiClient.get<LeadDto[]>(`/contact-leads${params}`);
      setLeads(data);
    } catch {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = useCallback(async (id: number, status: LeadStatus) => {
    try {
      const updated = await apiClient.patch<LeadDto>(`/contact-leads/${id}/status`, { status });
      setLeads(prev => prev.map(l => l.id === id ? updated : l));
      if (selected?.id === id) setSelected(updated);
      toast.success(`Status → ${STATUS_LABEL[status]}`);
    } catch {
      toast.error("Failed to update status");
    }
  }, [selected]);

  const updateNotes = useCallback(async (id: number, notes: string) => {
    try {
      const updated = await apiClient.patch<LeadDto>(`/contact-leads/${id}/notes`, { notes });
      setLeads(prev => prev.map(l => l.id === id ? updated : l));
      if (selected?.id === id) setSelected(updated);
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    }
  }, [selected]);

  const filtered = leads.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.fullName.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.organization.toLowerCase().includes(q)
    );
  });

  const counts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-full gap-4 p-4 overflow-hidden">

      {/* ── Left panel ── */}
      <div className={`flex flex-col min-w-0 transition-all duration-200 ${selected ? "flex-[2]" : "flex-1"}`}>

        {/* Page header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              Contact Leads
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{leads.length} total leads</p>
          </div>
          <Button size="sm" variant="ghost" onClick={load} disabled={loading} className="text-slate-400 hover:text-slate-200">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          {FILTER_TABS.map(tab => {
            const count = tab === "All" ? leads.length : (counts[tab] ?? 0);
            const active = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => { setFilter(tab); setSelected(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  active
                    ? "bg-sky-600/20 border-sky-500/40 text-sky-300"
                    : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                }`}
              >
                <Filter className="w-3 h-3 opacity-60" />
                {tab === "NotInterested" ? "Not Interested" : tab}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-sky-500/30 text-sky-300" : "bg-slate-700 text-slate-400"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or organization..."
            className="pl-9 bg-slate-800/50 border-slate-700 text-slate-200 placeholder-slate-500 h-9 text-sm"
          />
        </div>

        {/* Table */}
        <Card className="flex-1 border-slate-800 bg-slate-900/50 overflow-hidden">
          <CardContent className="p-0 h-full overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading leads...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-500">
                <Users className="w-8 h-8 opacity-30" />
                <p className="text-sm">{search ? "No leads match your search" : "No leads yet"}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Organization</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Interest</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      selected={selected?.id === lead.id}
                      onClick={() => setSelected(prev => prev?.id === lead.id ? null : lead)}
                      onStatusUpdate={updateStatus}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Right detail panel ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="w-80 shrink-0 flex flex-col"
          >
            <LeadDetailPanel
              lead={selected}
              onClose={() => setSelected(null)}
              onStatusUpdate={updateStatus}
              onNotesUpdate={updateNotes}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
