import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';
import { ZoneType } from '@/types';
import type { PersonStatus } from '@/types';

const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  [ZoneType.Public]:     'Public',
  [ZoneType.Restricted]: 'Restricted',
  [ZoneType.Private]:    'Private',
  [ZoneType.Closed]:     'Closed',
};

const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  known: 'Known', unknown: 'Unknown', watchlist: 'Watchlist', unauthorized: 'Unauthorized',
};

export function FilterPanel() {
  const panelsOpen = useMapStore(s => s.panelsOpen);
  const filters = useMapStore(s => s.filters);
  const setFilter = useMapStore(s => s.setFilter);
  const togglePanel = useMapStore(s => s.togglePanel);

  return (
    <AnimatePresence>
      {panelsOpen.filters && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="absolute top-14 right-4 z-30 w-64 rounded-2xl border border-white/10 bg-[#111827]/95 backdrop-blur-md shadow-2xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">Map Filters</span>
            </div>
            <button onClick={() => togglePanel('filters')} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Zone types */}
            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">Zone Types</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(ZONE_TYPE_LABELS) as unknown as ZoneType[]).map(zt => {
                  const active = filters.zoneTypes.size === 0 || filters.zoneTypes.has(zt);
                  return (
                    <button
                      key={zt}
                      onClick={() => {
                        const next = new Set(filters.zoneTypes);
                        if (next.has(zt)) next.delete(zt); else next.add(zt);
                        setFilter('zoneTypes', next);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border
                        ${active ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-slate-500 border-white/8 hover:border-white/20'}`}
                    >
                      {ZONE_TYPE_LABELS[zt]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Person status */}
            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">Person Status</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(PERSON_STATUS_LABELS) as PersonStatus[]).map(ps => {
                  const active = filters.personStatuses.size === 0 || filters.personStatuses.has(ps);
                  return (
                    <button
                      key={ps}
                      onClick={() => {
                        const next = new Set(filters.personStatuses);
                        if (next.has(ps)) next.delete(ps); else next.add(ps);
                        setFilter('personStatuses', next);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border
                        ${active ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-slate-500 border-white/8 hover:border-white/20'}`}
                    >
                      {PERSON_STATUS_LABELS[ps]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hide offline cameras */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hideOfflineCameras}
                onChange={e => setFilter('hideOfflineCameras', e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-cyan-500"
              />
              <span className="text-sm text-slate-300">Hide offline cameras</span>
            </label>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
