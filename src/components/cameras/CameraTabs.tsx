import { motion } from "framer-motion";
import { Activity, BarChart2, List, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabKey } from "@/types/camera";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "live",     label: "Live",     icon: Activity    },
  { key: "metrics",  label: "Metrics",  icon: BarChart2   },
  { key: "events",   label: "Events",   icon: List        },
  { key: "settings", label: "Settings", icon: Settings    },
];

export function CameraTabs({ tab, setTab }: { tab: TabKey; setTab: (t: TabKey) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-1 border border-border/30 w-fit">
      {TABS.map(t => {
        const active = tab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.div
                layoutId="camera-tab-active"
                className="absolute inset-0 bg-surface-3 rounded-lg border border-border/50 shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <t.icon className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
