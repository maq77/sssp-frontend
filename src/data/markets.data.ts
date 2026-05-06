import { Plane, Shield, Building2, Stethoscope, Factory, Eye } from 'lucide-react';
import { Market } from '../types/content.types';

export const TARGET_MARKETS: Market[] = [
  {
    icon: Plane,
    label: 'Airports & Border Control',
    stats: 'Identity + behavior analytics',
    color: 'from-sky-500 to-blue-600',
    desc: 'Passenger screening, access control, perimeter monitoring — where a missed person matters'
  },
  {
    icon: Building2,
    label: 'Smart Cities',
    stats: 'Public safety + AQI',
    color: 'from-indigo-500 to-purple-600',
    desc: 'City-scale monitoring, environmental insights, public health alerts and citizen safety'
  },
  {
    icon: Shield,
    label: 'Defense & Critical Facilities',
    stats: 'Restricted zones + threat detection',
    color: 'from-red-500 to-orange-600',
    desc: 'Perimeter security, unauthorized access detection, incident response for sensitive sites'
  },
  {
    icon: Eye,
    label: 'Intelligence Agencies',
    stats: 'Watchlist enforcement + surveillance',
    color: 'from-purple-500 to-indigo-600',
    desc: 'Identity tracking, covert site monitoring, forensic-grade evidence collection'
  },
  {
    icon: Stethoscope,
    label: 'Hospitals & Campuses',
    stats: 'Safety + compliance',
    color: 'from-pink-500 to-red-600',
    desc: 'Restricted areas, incident reporting, safer public spaces for staff and visitors'
  },
  {
    icon: Factory,
    label: 'Factories & Infrastructure',
    stats: 'Operational safety',
    color: 'from-yellow-500 to-orange-600',
    desc: 'Access control, hazard monitoring, and environmental readiness for industrial sites'
  }
];
