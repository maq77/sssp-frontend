import { Camera, Wind, Server } from 'lucide-react';
import { PricingPlan, HardwareItem } from '../types/pricing.types';

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Starter',
    price: 'Silver',
    period: '',
    description: 'Great for pilots and single-site deployments',
    features: [
      'Camera onboarding + live monitoring',
      'Face recognition module',
      'Basic incidents & alerts',
      'Role-based access (Admin / Operator / User)',
      'Email support'
    ],
    notIncluded: [
      'Abnormal behavior detection',
      'Geofencing / restricted zones',
      'AQI monitoring & recommendations',
      'Custom integrations'
    ],
    cta: 'Start a Pilot',
    popular: false
  },
  {
    name: 'Professional',
    price: 'Gold',
    period: '',
    description: 'Best for airports, campuses and growing city deployments',
    features: [
      'Everything in Starter',
      'Abnormal behavior detection',
      'Geofencing / restricted zones',
      'Advanced incident management',
      'API access for integrations',
      'Priority support'
    ],
    notIncluded: [
      'Enterprise multi-tenant / white-label options',
      'Dedicated AI model customization'
    ],
    cta: 'Schedule a Demo',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'deployment',
    description: 'For multi-site, nationwide, or defense-grade requirements',
    features: [
      'Everything in Professional',
      'AQI monitoring + policy/health recommendations (optional module)',
      'On-prem and air-gapped deployment options',
      'Custom integrations and workflows',
      'Dedicated onboarding and rollout plan',
      'SLA and compliance documentation'
    ],
    notIncluded: [],
    cta: 'Contact Sales',
    popular: false
  }
];

export const HARDWARE_ITEMS: HardwareItem[] = [
  {
    name: 'Smart Camera Package',
    price: 'Request quote',
    Icon: Camera,
    specs: [
      'Smart IP cameras for real-time video analytics',
      'Infrared / low-light options available',
      'Works with SSSP out of the box (RTSP/ONVIF)',
      'Also compatible with your existing camera infrastructure'
    ]
  },
  {
    name: 'AQI Sensor Device',
    price: 'Request quote',
    Icon: Wind,
    specs: [
      'Monitors CO₂, PM2.5, VOCs (optional O₃ depending on package)',
      'Feeds AQI dashboards and real-time threshold alerts',
      'Designed for smart city environmental monitoring',
      'Small form-factor, easy to deploy'
    ]
  },
  {
    name: 'Edge Compute Unit',
    price: 'Request quote',
    Icon: Server,
    specs: [
      'NVIDIA GPU-accelerated inference at the edge',
      'Supports offline / limited-connectivity deployments',
      'No cloud dependency — your data stays on-site',
      'Enables air-gapped and secure facility deployments'
    ]
  }
];
