import { UserCheck, Eye, ShieldAlert, Wind } from 'lucide-react';
import { ProblemSolution } from '../types/content.types';

export const PROBLEMS_DATA: ProblemSolution[] = [
  {
    icon: UserCheck,
    title: 'Wanted people walking through your checkpoints',
    cost: 'The most expensive miss in security',
    problem:
      'Manual verification fails. One operator watches 40+ cameras at once. A wanted individual walks through while attention is on a different feed. Nobody catches it until after.',
    solution:
      'Horus matches faces against your watchlist in real time — across every camera, simultaneously. The operator gets an alert with the face crop, camera ID, and timestamp. In under two seconds.',
    stats: [
      'Runs across all cameras at once — no blind spots',
      'Alert includes face evidence and full incident record',
      'Audit trail ready for investigation or compliance review'
    ],
    color: 'from-red-500 to-orange-500'
  },
  {
    icon: Eye,
    title: 'Threats that don\'t announce themselves',
    cost: 'Noticed too late — or not at all',
    problem:
      'By the time an operator spots suspicious behavior, the moment has passed. Twenty cameras. One operator. It\'s not a people problem — it\'s an impossible job without the right tools.',
    solution:
      'Horus watches every feed at once. It flags loitering, aggressive movement, and abnormal patterns the moment they happen. Operators get a prioritized alert — not a wall of video to monitor.',
    stats: [
      'Detects behavior anomalies before escalation',
      'Creates incidents automatically with time and location',
      'Operators focus on response — not surveillance'
    ],
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: ShieldAlert,
    title: 'A fence isn\'t a security system',
    cost: 'Access control failures that cost more than fixes',
    problem:
      'Physical perimeters fail. Tailgating happens. People enter areas they shouldn\'t be in, and nobody gets an alert until after — if at all.',
    solution:
      'We let you draw virtual perimeters directly on any camera feed. The second someone crosses, the operator gets an alert — with a snapshot, the zone name, and the exact time.',
    stats: [
      'Draw zones on any camera — no hardware required',
      'Instant snapshot alert on every breach',
      'Works across airports, campuses, factories, and smart cities'
    ],
    color: 'from-sky-500 to-indigo-600'
  },
  {
    icon: Wind,
    title: 'Air quality data nobody acts on',
    cost: 'Environmental risk invisible to operators',
    problem:
      'AQI data exists somewhere — usually in a separate system that security teams never see. When a pollution spike happens, the right people find out too late.',
    solution:
      'We put environmental monitoring in the same operator view as security. Real-time sensor readings, threshold alerts, and policy recommendations — in the dashboard your team already uses.',
    stats: [
      'CO₂, PM2.5, VOCs, O₃ — configurable per sensor package',
      'Threshold alerts before spikes become health incidents',
      'Export reports for compliance and governance'
    ],
    color: 'from-green-500 to-emerald-500'
  },
];
