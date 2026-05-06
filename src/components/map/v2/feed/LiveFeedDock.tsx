import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, Video } from 'lucide-react';
import { useState } from 'react';
import { useMapStore } from '@/store/mapStore';
import { LiveFeedPlayer } from './LiveFeedPlayer';

export function LiveFeedDock() {
  const liveFeedCameraId = useMapStore(s => s.liveFeedCameraId);
  const cameras = useMapStore(s => s.cameras);
  const setLiveFeedCamera = useMapStore(s => s.setLiveFeedCamera);
  const [expanded, setExpanded] = useState(false);

  const cam = cameras.find(c => c.Id === liveFeedCameraId);
  const w = expanded ? 480 : 320;
  const h = expanded ? 270 : 180;

  return (
    <AnimatePresence>
      {liveFeedCameraId != null && (
        <motion.div
          key={liveFeedCameraId}
          drag
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          style={{ width: w }}
          className="absolute bottom-16 right-4 z-30 rounded-2xl overflow-hidden border border-white/15 bg-[#0a0f1c] shadow-2xl cursor-grab active:cursor-grabbing"
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#111827] border-b border-white/8">
            <div className="flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-white truncate max-w-[120px]">
                {cam?.Name ?? `Camera ${liveFeedCameraId}`}
              </span>
              {cam?.ZoneName && (
                <span className="text-xs text-slate-500 truncate">· {cam.ZoneName}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setExpanded(e => !e)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition"
              >
                {expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setLiveFeedCamera(null)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Video */}
          <div style={{ height: h }} className="relative bg-black">
            {cam?.StreamKey ? (
              <LiveFeedPlayer streamKey={cam.StreamKey} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Stream unavailable
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
