import { Zap, Brain, Globe, Database, Shield, Puzzle } from 'lucide-react';
import { CompetitiveAdvantage } from '../types/content.types';

export const COMPETITIVE_ADVANTAGES: CompetitiveAdvantage[] = [
  {
    icon: Puzzle,
    title: 'Turn off what you don\'t need',
    desc: 'Deploy identity, behavior, access control, and environmental monitoring — all of it, or just the modules your site actually needs. Per camera. Per zone. Per site.',
    advantage: 'Zero waste in the deployment'
  },
  {
    icon: Zap,
    title: 'Detection to incident in under 2 seconds',
    desc: 'Horus detects a threat. SSSP creates the incident automatically — title, severity, camera ID, snapshot evidence. Operators respond. No manual logging, no copy-paste.',
    advantage: 'Operators act, not administrate'
  },
  {
    icon: Brain,
    title: 'Security and sustainability. One system.',
    desc: 'Every other vendor makes you manage a separate tool for environmental monitoring. We built both into one platform — same operator view, same alert queue, same dashboard.',
    advantage: 'Two problems. One deployment.'
  },
  {
    icon: Database,
    title: 'Works with what you already have',
    desc: 'REST and gRPC APIs. Connects to your SIEM, your access control system, your city data platform. We don\'t ask you to replace infrastructure that works.',
    advantage: 'No rip-and-replace'
  },
  {
    icon: Globe,
    title: 'One product. Six buyer types.',
    desc: 'Airports, smart cities, intelligence agencies, defense facilities, campuses, factories. The same platform — configured differently for each environment and procurement requirement.',
    advantage: 'Wide market, single codebase'
  },
  {
    icon: Shield,
    title: 'Audit-ready from day one',
    desc: 'Admin, Operator, and User roles with hard permission boundaries. Every action logged. Every decision traceable. Post-quantum encryption for sites that can\'t afford to get it wrong.',
    advantage: 'Enterprise and defense-grade'
  }
];
