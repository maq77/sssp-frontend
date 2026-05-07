import { StatMetric } from '../types/content.types';

export const KEY_METRICS: StatMetric[] = [
  { value: '<2s', label: 'Alert to operator', sublabel: 'From detection to notification' },
  { value: '99.2%', label: 'Face match accuracy', sublabel: 'AdaFace R101 — real conditions, not demos' },
  { value: '0', label: 'Cloud dependency', sublabel: 'Fully on your hardware. Air-gap capable.' },
  { value: '6+', label: 'Deployment types', sublabel: 'Airports, cities, agencies, facilities & more' },
];
