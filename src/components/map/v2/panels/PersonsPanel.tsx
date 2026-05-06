import { motion } from 'framer-motion';
import { Users, MapPin, X } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';
import { personColors } from '@/lib/map/colorPalette';
import type { MapPerson } from '@/types';

function statusLabel(status: MapPerson['status']): string {
  switch (status) {
    case 'known':        return 'Known';
    case 'unknown':      return 'Unknown';
    case 'watchlist':    return 'WATCHLIST';
    case 'unauthorized': return 'UNAUTHORIZED';
  }
}

export function PersonsPanel() {
  const panelsOpen = useMapStore(s => s.panelsOpen);
  const persons = useMapStore(s => s.persons);
  const selectedPersonId = useMapStore(s => s.selectedPersonId);
  const followedPersonId = useMapStore(s => s.followedPersonId);
  const selectPerson = useMapStore(s => s.selectPerson);
  const followPerson = useMapStore(s => s.followPerson);
  const togglePanel = useMapStore(s => s.togglePanel);

  const sorted = [...persons.values()].sort((a, b) => {
    const order = { unauthorized: 0, watchlist: 1, unknown: 2, known: 3 };
    return order[a.status] - order[b.status];
  });

  if (!panelsOpen.persons) return null;

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="absolute right-0 top-0 h-full w-64 flex flex-col bg-[#0d1526]/90 backdrop-blur-md border-l border-white/8 z-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">Active Persons</span>
          {sorted.length > 0 && (
            <span className="bg-cyan-500/20 text-cyan-400 text-xs rounded-full px-2 py-0.5 font-mono">
              {sorted.length}
            </span>
          )}
        </div>
        <button
          onClick={() => togglePanel('persons')}
          className="text-slate-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/8"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
            <Users className="w-8 h-8 mb-2 opacity-30" />
            No persons tracked
          </div>
        ) : (
          sorted.map(person => {
            const color = personColors[person.status];
            const isSelected = selectedPersonId === person.id;
            const isFollowed = followedPersonId === person.id;

            return (
              <div
                key={person.id}
                onClick={() => selectPerson(person.id)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer transition
                  ${isSelected ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}`}
              >
                {/* Status dot */}
                <div className="relative">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
                  />
                  {(person.status === 'watchlist' || person.status === 'unauthorized') && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-50"
                      style={{ background: color }}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{person.displayName}</div>
                  <div className="text-xs truncate" style={{ color }}>
                    {statusLabel(person.status)}
                  </div>
                </div>

                {/* Follow button */}
                <button
                  onClick={e => { e.stopPropagation(); followPerson(isFollowed ? null : person.id); }}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition text-xs
                    ${isFollowed ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:bg-white/8 hover:text-white'}`}
                  title={isFollowed ? 'Unfollow' : 'Follow on map'}
                >
                  <MapPin className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
