import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Wifi, WifiOff, Video, X } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';
import { cameraColors } from '@/lib/map/colorPalette';
import type { MapCameraDto } from '@/types';

interface Props {
  cameras: MapCameraDto[];
}

export function CameraDetailPopover({ cameras }: Props) {
  const selectedCameraId = useMapStore(s => s.selectedCameraId);
  const cameraRuntime = useMapStore(s => s.cameraRuntime);
  const setLiveFeedCamera = useMapStore(s => s.setLiveFeedCamera);
  const selectCamera = useMapStore(s => s.selectCamera);

  const cam = cameras.find(c => c.Id === selectedCameraId);
  const rt = cam ? cameraRuntime.get(cam.Id) : null;
  const isOnline = rt?.isOnline ?? cam?.IsActive ?? false;

  return (
    <AnimatePresence>
      {cam && (
        <motion.div
          key={cam.Id}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 w-72 rounded-2xl border border-white/10 bg-[#111827]/95 backdrop-blur-md shadow-2xl p-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: isOnline ? `${cameraColors.online}22` : `${cameraColors.offline}22` }}
              >
                <Camera className="w-4 h-4" style={{ color: isOnline ? cameraColors.online : cameraColors.offline }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{cam.Name}</div>
                <div className="text-xs text-slate-400">{cam.ZoneName ?? 'Unassigned'}</div>
              </div>
            </div>
            <button
              onClick={() => selectCamera(null)}
              className="text-slate-500 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 mb-3 text-xs">
            {isOnline
              ? <><Wifi className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Online</span></>
              : <><WifiOff className="w-3.5 h-3.5 text-slate-500" /><span className="text-slate-500">Offline</span></>
            }
            {cam.StreamKey && (
              <span className="ml-auto text-slate-500 font-mono">{cam.StreamKey}</span>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setLiveFeedCamera(cam.Id)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium
                bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition border border-cyan-500/20"
            >
              <Video className="w-3.5 h-3.5" /> Live Feed
            </button>
            <a
              href={`/app/cameras/${cam.Id}`}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium
                bg-white/5 text-slate-300 hover:bg-white/10 transition border border-white/10"
            >
              Details
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
