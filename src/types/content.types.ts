import type { LucideIcon } from 'lucide-react';

export interface StatMetric {
  value: string;
  label: string;
  sublabel: string;
}

export interface ProblemSolution {
  icon: LucideIcon;
  title: string;
  cost: string;
  problem: string;
  solution: string;
  stats: string[];
  color: string; // e.g. "from-red-500 to-orange-500"
}

export interface CompetitiveAdvantage {
  icon: LucideIcon;
  title: string;
  desc: string;
  advantage: string;
}

export interface Market {
  icon: LucideIcon;
  label: string;
  stats: string;
  color: string; // e.g. "from-sky-500 to-indigo-600"
  desc: string;
}
