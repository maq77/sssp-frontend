import { personColors, zoneColors, cameraColors } from '@/lib/map/colorPalette';
import { ZoneType } from '@/types';

const ZONE_LABELS: Record<ZoneType, string> = {
  [ZoneType.Public]:     'Public',
  [ZoneType.Restricted]: 'Restricted',
  [ZoneType.Private]:    'Private',
  [ZoneType.Closed]:     'Closed',
};

export function LegendOverlay() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-4 rounded-2xl border border-white/10 bg-[#0d1526]/90 backdrop-blur-md px-5 py-2.5 text-xs text-slate-400">
      {/* Zones */}
      <div className="flex items-center gap-2">
        <span className="text-slate-500 mr-1">Zones:</span>
        {(Object.values(ZoneType).filter(v => typeof v === 'number') as ZoneType[]).map(zt => (
          <span key={zt} className="flex items-center gap-1">
            <span
              className="w-3 h-2 rounded-sm border inline-block"
              style={{ background: `${zoneColors[zt].fill}66`, borderColor: zoneColors[zt].stroke }}
            />
            {ZONE_LABELS[zt]}
          </span>
        ))}
      </div>

      <div className="w-px bg-white/10" />

      {/* Persons */}
      <div className="flex items-center gap-2">
        <span className="text-slate-500 mr-1">Persons:</span>
        {[
          { key: 'known',        label: 'Known' },
          { key: 'unknown',      label: 'Unknown' },
          { key: 'watchlist',    label: 'Watchlist' },
          { key: 'unauthorized', label: 'Unauth.' },
        ].map(({ key, label }) => (
          <span key={key} className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: personColors[key as keyof typeof personColors] }}
            />
            {label}
          </span>
        ))}
      </div>

      <div className="w-px bg-white/10" />

      {/* Cameras */}
      <div className="flex items-center gap-2">
        <span className="text-slate-500 mr-1">Cameras:</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: cameraColors.online }} />
          Online
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: cameraColors.offline }} />
          Offline
        </span>
      </div>
    </div>
  );
}
