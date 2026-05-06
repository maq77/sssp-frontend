const HINTS = [
  { key: '3',     label: '2D/3D' },
  { key: 'Z',     label: 'Fit' },
  { key: '+/-',   label: 'Zoom' },
  { key: 'F',     label: 'Filters' },
  { key: 'M',     label: 'Minimap' },
  { key: 'P',     label: 'Persons' },
  { key: 'Esc',   label: 'Clear' },
];

export function KeyboardHints() {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-3 text-xs text-slate-600">
      {HINTS.map(({ key, label }) => (
        <span key={key} className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono text-slate-400">
            {key}
          </kbd>
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}
