import { Plane, Shield, Building2, Stethoscope, Factory, Eye } from 'lucide-react';
import { Market } from '../types/content.types';

export const TARGET_MARKETS: Market[] = [
  {
    icon: Plane,
    label: 'Airports & Border Control',
    stats: 'Watchlist + behavior + perimeter',
    color: 'from-sky-500 to-blue-600',
    desc: 'One missed match at a checkpoint is a national incident. SSSP runs face recognition across every gate, simultaneously — not just the ones someone\'s watching.'
  },
  {
    icon: Building2,
    label: 'Smart Cities',
    stats: 'Public safety + AQI monitoring',
    color: 'from-indigo-500 to-purple-600',
    desc: 'Thousands of cameras. Environmental sensors across districts. All feeding one operator view. SSSP runs at city scale — without requiring a city-sized team.'
  },
  {
    icon: Shield,
    label: 'Defense & Critical Facilities',
    stats: 'Restricted zones + air-gap capable',
    color: 'from-red-500 to-orange-600',
    desc: 'Virtual perimeters on every camera. No cloud dependency. Post-quantum encryption. Built for environments where a breach has consequences beyond the facility.'
  },
  {
    icon: Eye,
    label: 'Intelligence Agencies',
    stats: 'Watchlist enforcement + forensic evidence',
    color: 'from-purple-500 to-indigo-600',
    desc: 'Discretion, accuracy, and audit-grade evidence. Horus Plus runs AdaFace R101 — the model that works on low-quality frames, not just clean studio shots.'
  },
  {
    icon: Stethoscope,
    label: 'Hospitals & Campuses',
    stats: 'Safety + incident management',
    color: 'from-pink-500 to-red-600',
    desc: 'Restricted area monitoring, daily incident workflows, and AI-assisted threat detection — built for sites where the staff and visitors both need protection.'
  },
  {
    icon: Factory,
    label: 'Factories & Infrastructure',
    stats: 'Access control + hazard monitoring',
    color: 'from-yellow-500 to-orange-600',
    desc: 'Unauthorized access detection, environmental sensor alerts, and operational safety — in one system that works with the cameras and infrastructure you already have.'
  }
];
