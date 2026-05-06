import type { ElementType } from 'react';

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  notIncluded: string[];
  cta: string;
  popular: boolean;
}

export interface HardwareItem {
  name: string;
  price: string;
  Icon: ElementType;
  specs: string[];
}
