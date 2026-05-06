import { UserCheck, Eye, ShieldAlert, Wind } from 'lucide-react';
import { ProblemSolution } from '../types/content.types';

export const PROBLEMS_DATA: ProblemSolution[] = [
  {
    icon: UserCheck,
    title: 'Identity Fraud & Watchlist Evasion',
    cost: 'High-risk security gap',
    problem:
      'Wanted individuals can pass checkpoints by using forged or stolen documents, changing appearance, or exploiting manual verification limits.',
    solution:
      'SSSP adds real-time face recognition and watchlist matching to your existing checkpoints, creating an immediate alert when a match is detected.',
    stats: [
      'Flag wanted/unauthorized individuals at critical entry points',
      'Centralized watchlists & audit trail for investigations',
      'Integrates with camera streams and operator workflows'
    ],
    color: 'from-red-500 to-orange-500'
  },
  {
    icon: Eye,
    title: 'Abnormal & Suspicious Behavior',
    cost: 'Threats noticed too late',
    problem:
      'Suspicious behavior (loitering, evasive movements, aggression patterns) is hard to monitor across many cameras—operators get overwhelmed.',
    solution:
      'Abnormal behavior detection continuously analyzes video streams to detect early warning signals and escalates only high-confidence events to operators.',
    stats: [
      'Reduce operator overload by prioritizing actionable incidents',
      'Create incidents automatically with time & location context',
      'Support rapid response and evidence collection'
    ],
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: ShieldAlert,
    title: 'Unauthorized Access & Restricted Zones',
    cost: 'Access control failures',
    problem:
      'Facilities and cities need a clear way to define restricted areas and detect unauthorized people/vehicles entering those zones.',
    solution:
      'SSSP supports geofencing and restricted-zone monitoring, generating real-time alerts and incident logs when breaches happen.',
    stats: [
      'Define zones (gates, perimeters, critical rooms, lanes)',
      'Detect entry/exit events with location context',
      'Works across airports, campuses, factories, and smart cities'
    ],
    color: 'from-sky-500 to-indigo-600'
  },
  {
    icon: Wind,
    title: 'Air Quality, Public Health & Compliance',
    cost: 'Environmental risk & poor response',
    problem:
      'Air quality issues can create health incidents and regulatory problems. Traditional monitoring can be fragmented or not connected to operational decisions.',
    solution:
      'SSSP integrates IoT air-quality sensors, computes AQI on dashboards, and generates health recommendations for citizens plus policy suggestions for operators.',
    stats: [
      'Sensor inputs (e.g., CO₂, PM2.5, VOCs, O₃ depending on sensor package)',
      'Threshold-based alerts with recommended actions',
      'Export reports for operations and governance'
    ],
    color: 'from-green-500 to-emerald-500'
  },
];
