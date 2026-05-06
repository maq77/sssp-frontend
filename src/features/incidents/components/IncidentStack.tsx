import { AnimatePresence } from "framer-motion";
import { useIncidentStore } from "@/store/useIncidentStore";
import { IncidentCard } from "./IncidentCard";

/**
 * Fixed top-right incident stack — renders up to 3 active alerts.
 * Mount this once near the app root (inside IncidentProvider).
 */
export function IncidentStack() {
  const active = useIncidentStore((s) => s.active);

  if (active.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="assertive"
      aria-label="Incident alerts"
    >
      <AnimatePresence mode="sync">
        {active.map((alert) => (
          <IncidentCard key={alert.id} alert={alert} />
        ))}
      </AnimatePresence>
    </div>
  );
}
