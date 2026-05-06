import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AqiRecommendations } from "@/lib/api/aqiApi";
import {
  Building2, Truck, Factory, Wheat, HeartPulse, GraduationCap,
  Users, Baby, Leaf, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#FF0000",
  high:     "#FF7E00",
  medium:   "#FFFF00",
  low:      "#00E400",
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high:     "High Priority",
  medium:   "Medium Priority",
  low:      "Advisory",
};

const DOMAIN_ICONS: Record<string, typeof Building2> = {
  transport:   Truck,
  industry:    Factory,
  health:      HeartPulse,
  agriculture: Wheat,
  education:   GraduationCap,
  default:     Building2,
};

const GROUP_ICONS: Record<string, typeof Users> = {
  general:   Users,
  sensitive: HeartPulse,
  children:  Baby,
  elderly:   Leaf,
};

interface Props {
  recommendations: AqiRecommendations | null;
  isLoading?: boolean;
}

export function SmartRecommendations({ recommendations, isLoading }: Props) {
  const [govExpanded, setGovExpanded] = useState(true);
  const [citExpanded, setCitExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!recommendations) return null;

  const criticalGov = recommendations.governmentPolicies.filter((p) => p.priority === "critical");
  const hasCritical = criticalGov.length > 0;

  return (
    <div className="space-y-4">
      {/* AI badge */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs text-violet-300 font-medium">AI-Generated Recommendations</span>
        </div>
        <span className="text-xs text-zinc-500">
          Context-aware · Updated{" "}
          {new Date(recommendations.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Government / Policy */}
      <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors"
          onClick={() => setGovExpanded((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Government Policy Actions</span>
            {hasCritical && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                {criticalGov.length} CRITICAL
              </span>
            )}
          </div>
          {govExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        <AnimatePresence initial={false}>
          {govExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {recommendations.governmentPolicies.map((rec, i) => {
                  const DomainIcon = DOMAIN_ICONS[rec.domain] ?? DOMAIN_ICONS.default;
                  const pColor = PRIORITY_COLORS[rec.priority] ?? "#fff";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex gap-3 p-3 rounded-xl border bg-white/3 hover:bg-white/6 transition-colors"
                      style={{ borderColor: pColor + "25" }}
                    >
                      <div
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: pColor + "15" }}
                      >
                        <DomainIcon className="w-4 h-4" style={{ color: pColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                            style={{ backgroundColor: pColor + "20", color: pColor }}
                          >
                            {PRIORITY_LABELS[rec.priority] ?? rec.priority}
                          </span>
                          <span className="text-[10px] text-zinc-500 capitalize">{rec.domain}</span>
                        </div>
                        <p className="text-sm text-white font-medium leading-snug">{rec.action}</p>
                        <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{rec.rationale}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Citizens Health */}
      <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors"
          onClick={() => setCitExpanded((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-white">Citizen Health Advisories</span>
          </div>
          {citExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        <AnimatePresence initial={false}>
          {citExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recommendations.citizenAdvisories.map((rec, i) => {
                  const GroupIcon = GROUP_ICONS[rec.group] ?? GROUP_ICONS.general;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex gap-3 p-3 rounded-xl border border-white/6 bg-white/3 hover:bg-white/6 transition-colors"
                    >
                      <div className="text-xl shrink-0 leading-none mt-0.5">{rec.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <GroupIcon className="w-3 h-3 text-zinc-400" />
                          <span className="text-[10px] text-zinc-400 capitalize font-medium">{rec.group}</span>
                        </div>
                        <p className="text-sm text-white font-medium leading-snug">{rec.advisory}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{rec.detail}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
