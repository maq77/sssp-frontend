import { ZoneType, IncidentSeverity, PersonStatus } from '@/types';

export const mapTheme = {
  bg:       '#0a0f1c',
  bgPanel:  '#111827',
  grid:     '#1e293b',
  border:   '#1f2937',
  text:     '#e5e7eb',
  muted:    '#94a3b8',
  accent:   '#22d3ee',
};

export const zoneColors: Record<ZoneType, { fill: string; stroke: string; fillAlpha: number }> = {
  [ZoneType.Public]:     { fill: '#1e3a8a', stroke: '#3b82f6', fillAlpha: 0.25 },
  [ZoneType.Restricted]: { fill: '#78350f', stroke: '#f59e0b', fillAlpha: 0.28 },
  [ZoneType.Private]:    { fill: '#581c87', stroke: '#a855f7', fillAlpha: 0.25 },
  [ZoneType.Closed]:     { fill: '#7f1d1d', stroke: '#ef4444', fillAlpha: 0.28 },
};

export const cameraColors = {
  online:   '#22c55e',
  offline:  '#6b7280',
  incident: '#ef4444',
};

export const personColors: Record<PersonStatus, string> = {
  known:        '#22d3ee',
  unknown:      '#eab308',
  watchlist:    '#f97316',
  unauthorized: '#ef4444',
};

export const severityColors: Record<IncidentSeverity, string> = {
  [IncidentSeverity.Low]:      '#facc15',
  [IncidentSeverity.Medium]:   '#f97316',
  [IncidentSeverity.High]:     '#ef4444',
  [IncidentSeverity.Critical]: '#dc2626',
};

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
