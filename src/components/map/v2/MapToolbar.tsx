import { ZoomIn, ZoomOut, Maximize, Box, Square, Filter, Map as MapIcon, Users, Radio } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';
import type { ReactNode } from 'react';

interface Props {
  onFitView: () => void;
}

export function MapToolbar({ onFitView }: Props) {
  const viewMode   = useMapStore(s => s.viewMode);
  const panelsOpen = useMapStore(s => s.panelsOpen);
  const viewport   = useMapStore(s => s.viewport);
  const setViewMode  = useMapStore(s => s.setViewMode);
  const setViewport  = useMapStore(s => s.setViewport);
  const togglePanel  = useMapStore(s => s.togglePanel);

  const zoom = (factor: number) => {
    const next = Math.min(4, Math.max(0.15, viewport.scale * factor));
    setViewport({ scale: next });
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-2xl border border-white/12 bg-[#0d1526]/90 backdrop-blur-md px-2 py-1.5 shadow-2xl">
      {/* Zoom controls */}
      <ToolBtn title="Zoom in (+)" onClick={() => zoom(1.25)}>
        <ZoomIn className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn title="Zoom out (-)" onClick={() => zoom(0.8)}>
        <ZoomOut className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn title="Fit view (Z)" onClick={onFitView}>
        <Maximize className="w-3.5 h-3.5" />
      </ToolBtn>

      <Divider />

      {/* 2D / 3D toggle */}
      <div className="flex rounded-xl overflow-hidden border border-white/10">
        <ModeBtn active={viewMode === '2d'} onClick={() => setViewMode('2d')} title="2D view (3)">
          <Square className="w-3.5 h-3.5" />
          <span>2D</span>
        </ModeBtn>
        <ModeBtn active={viewMode === '3d'} onClick={() => setViewMode('3d')} title="3D view (3)">
          <Box className="w-3.5 h-3.5" />
          <span>3D</span>
        </ModeBtn>
      </div>

      <Divider />

      {/* Panel toggles */}
      <ToolBtn
        title="Persons panel (P)"
        active={panelsOpen.persons}
        onClick={() => togglePanel('persons')}
      >
        <Users className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Incidents ticker"
        active={panelsOpen.incidents}
        onClick={() => togglePanel('incidents')}
      >
        <Radio className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Minimap (M)"
        active={panelsOpen.minimap}
        onClick={() => togglePanel('minimap')}
      >
        <MapIcon className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Filters (F)"
        active={panelsOpen.filters}
        onClick={() => togglePanel('filters')}
      >
        <Filter className="w-3.5 h-3.5" />
      </ToolBtn>

      {/* Scale readout */}
      <Divider />
      <span className="px-2 text-[10px] font-mono text-slate-500 select-none w-12 text-center">
        {Math.round(viewport.scale * 100)}%
      </span>
    </div>
  );
}

function ToolBtn({
  children,
  title,
  active,
  onClick,
}: {
  children: ReactNode;
  title: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={
        'flex items-center justify-center w-7 h-7 rounded-xl transition text-xs ' +
        (active
          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
          : 'text-slate-400 hover:text-white hover:bg-white/8')
      }
    >
      {children}
    </button>
  );
}

function ModeBtn({
  children,
  active,
  onClick,
  title,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={
        'flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition ' +
        (active
          ? 'bg-cyan-500/20 text-cyan-400'
          : 'text-slate-500 hover:text-slate-300 bg-transparent')
      }
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-white/10 mx-0.5" />;
}
