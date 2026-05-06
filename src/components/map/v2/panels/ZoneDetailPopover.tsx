import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Camera, Users, X } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';
import { zoneColors } from '@/lib/map/colorPalette';
import { ZoneType } from '@/types';
import type { MapZoneDto, MapCameraDto } from '@/types';

const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  [ZoneType.Public]:     'Public',
  [ZoneType.Restricted]: 'Restricted',
  [ZoneType.Private]:    'Private',
  [ZoneType.Closed]:     'Closed',
};

interface Props {
  zones: MapZoneDto[];
  cameras: MapCameraDto[];
}

export function ZoneDetailPopover({ zones, cameras }: Props) {
  const selectedZoneId = useMapStore(s => s.selectedZoneId);
  const persons = useMapStore(s => s.persons);
  const selectZone = useMapStore(s => s.selectZone);

  const zone = zones.find(z => z.Id === selectedZoneId);
  if (!zone) return null;

  const colors = zoneColors[zone.ZoneType];
  const zoneCameras = cameras.filter(c => c.ZoneId === zone.Id);
  const personsInZone = [...persons.values()].filter(p => p.currentZoneId === zone.Id);

  return (
    <AnimatePresence>
      {zone && (
        <motion.div
          key={zone.Id}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 w-72 rounded-2xl border border-white/10 bg-[#111827]/95 backdrop-blur-md shadow-2xl p-4"
          style={{ borderColor: `${colors.stroke}40` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${colors.stroke}22` }}
              >
                <Shield className="w-4 h-4" style={{ color: colors.stroke }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{zone.Name}</div>
                <div className="text-xs" style={{ color: colors.stroke }}>
                  {ZONE_TYPE_LABELS[zone.ZoneType]}
                </div>
              </div>
            </div>
            <button
              onClick={() => selectZone(null)}
              className="text-slate-500 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Cameras', value: zoneCameras.length, Icon: Camera },
              { label: 'Present', value: personsInZone.length, Icon: Users },
              { label: 'Policies', value: zone.ActivePolicyCount, Icon: Shield },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="rounded-xl bg-white/5 p-2 text-center">
                <Icon className="w-3 h-3 text-slate-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-white">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>

          {zone.Description && (
            <p className="text-xs text-slate-400 mb-3 line-clamp-2">{zone.Description}</p>
          )}

          <a
            href={`/app/zones`}
            className="flex items-center justify-center rounded-xl py-2 text-xs font-medium
              bg-white/5 text-slate-300 hover:bg-white/10 transition border border-white/10"
          >
            Manage Zone
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
