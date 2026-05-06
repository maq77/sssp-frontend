import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';
import { severityColors } from '@/lib/map/colorPalette';
import { IncidentStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export function IncidentsTickerPanel() {
  const panelsOpen = useMapStore(s => s.panelsOpen);
  const incidents = useMapStore(s => s.incidents);
  const togglePanel = useMapStore(s => s.togglePanel);

  const active = [...incidents.values()]
    .filter(i => i.status !== IncidentStatus.Closed && i.status !== IncidentStatus.Resolved)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 20);

  if (!panelsOpen.incidents) return null;

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className="absolute left-0 top-0 h-full w-60 flex flex-col bg-[#0d1526]/90 backdrop-blur-md border-r border-white/8 z-10"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Incidents</span>
          {active.length > 0 && (
            <span className="bg-red-500/20 text-red-400 text-xs rounded-full px-2 py-0.5 font-mono">
              {active.length}
            </span>
          )}
        </div>
        <button onClick={() => togglePanel('incidents')} className="text-slate-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
            <AlertTriangle className="w-8 h-8 mb-2 opacity-30" />
            No active incidents
          </div>
        ) : (
          active.map(incident => {
            const color = severityColors[incident.severity];
            return (
              <div key={incident.id} className="rounded-xl px-3 py-2 hover:bg-white/5 transition cursor-pointer">
                <div className="flex items-start gap-2">
                  <div
                    className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                    style={{ background: color, boxShadow: `0 0 4px ${color}` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{incident.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatDistanceToNow(new Date(incident.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
