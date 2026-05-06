import { useState } from 'react';
import { ScenarioState, Alert, ScenarioStats } from '../config/airportConfig';

export function useScenarioState() {
  const [state, setState] = useState<ScenarioState>('idle');
  const [progress, setProgress] = useState(0);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [stats, setStats] = useState<ScenarioStats>({ 
    detectionTime: 0, 
    threatsDetected: 0 
  });
  
  const reset = () => {
    setState('idle');
    setProgress(0);
    setAlert(null);
    setStats({ detectionTime: 0, threatsDetected: 0 });
  };
  
  return { 
    state, 
    setState, 
    progress, 
    setProgress, 
    alert, 
    setAlert, 
    stats, 
    setStats,
    reset
  };
}