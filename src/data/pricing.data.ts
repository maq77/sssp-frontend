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
      'Role-based access (Admin/Operator/User)',
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
      'All Starter features',
      'Abnormal behavior detection',
      'Geofencing / restricted zones',
      'Advanced incident management',
      'API access for integrations',
      'Priority support'
    ],
    notIncluded: [
      'Enterprise multi-tenant / white-label options',
      'Dedicated AI customization'
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
      'All Professional features',
      'AQI monitoring + policy/health recommendations (optional module)',
      'On-prem and hybrid deployment options',
      'Custom integrations and workflows',
      'Dedicated onboarding and rollout plan'
    ],
    notIncluded: [],
    cta: 'Contact Sales',
    popular: false
  }
];
/// Future Work
export const HARDWARE_ITEMS: HardwareItem[] = [
  {
    name: 'Smart Camera Package',
    price: 'Request quote',
    image: '📷',
    specs: [
      'Smart cameras for real-time monitoring',
      'Infrared / low-light options (depending on package)',
      'Integrates with SSSP video analytics modules',
      'Supports common CCTV/IP camera deployments'
    ]
  },
  {
    name: 'AQI Device',
    price: 'Request quote',
    image: '🌫️',
    specs: [
      'Sensor inputs: CO₂, PM2.5, VOCs (plus optional gases like O₃ depending on sensor package)',
      'Feeds AQI dashboards and threshold-based alerts',
      'Designed for smart city environmental monitoring'
    ]
  },
  { /// that will be deleted
    name: 'Cloud Compute (Optional)',
    price: 'Request quote',
    image: '🖥️',
    specs: [
      'Low-latency processing close to cameras',
      'Supports offline / constrained-connectivity scenarios',
      'Enables flexible hybrid deployments'
    ]
  }
];
