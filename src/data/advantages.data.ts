import { Zap, Brain, Globe, Database, Shield, Puzzle } from 'lucide-react';
import { CompetitiveAdvantage } from '../types/content.types';

export const COMPETITIVE_ADVANTAGES: CompetitiveAdvantage[] = [
  {
    icon: Puzzle,
    title: 'Security Town System (Modular by Design)',
    desc: 'Enable only what you need per site: identity, behavior, access control, and environmental intelligence.',
    advantage: 'Customize per environment'
  },
  {
    icon: Zap,
    title: 'Real-Time Detection + Incident Workflow',
    desc: 'AI events turn into structured incidents with timestamps and locations, ready for operator action and reporting.',
    advantage: 'Faster response cycles'
  },
  {
    icon: Brain,
    title: 'Security + Sustainability in One Platform',
    desc: 'Combine video analytics with IoT sensor data, AQI dashboards, and recommendation engines for smarter operations.',
    advantage: 'Unique dual capability'
  },
  {
    icon: Database,
    title: 'Hybrid Architecture Ready',
    desc: 'Designed to work with an API backend and an AI inference service, supporting integrations through APIs and service contracts.',
    advantage: 'Integration-friendly'
  },
  {
    icon: Globe,
    title: 'Multi-Domain Use Cases',
    desc: 'Built for airports, smart cities, hospitals, factories, universities, and other critical environments.',
    advantage: 'One product, many verticals'
  },
  {
    icon: Shield,
    title: 'Security-by-Design',
    desc: 'Role-based access (Admin/Operator/User), audit trails, and secure communications are part of the core requirements.',
    advantage: 'Enterprise-grade foundations'
  }
];
