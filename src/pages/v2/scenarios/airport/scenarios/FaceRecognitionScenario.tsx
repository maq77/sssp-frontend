import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { AirportScene } from '../components/AirportScene';
import { ScenarioHUD } from '../components/ScenarioHUD';
import { ControlPanel } from '../components/ControlPanel';
import { useScenarioState } from '../hooks/useScenarioState';
import { SCENARIO_CONFIG } from '../config/airportConfig';

export default function FaceRecognitionScenario() {
  const { 
    state, 
    setState, 
    progress, 
    setProgress, 
    alert, 
    setAlert, 
    stats, 
    setStats,
    reset
  } = useScenarioState();
  
  const handlePlay = () => {
    setState('walking');
    
    // Simulate scenario timeline
    setTimeout(() => {
      setState('scanning');
      
      // Scanning progress
      let scanProgress = 0;
      const scanInterval = setInterval(() => {
        scanProgress += 5;
        setProgress(scanProgress);
        
        if (scanProgress >= 100) {
          clearInterval(scanInterval);
          setState('alert');
          setStats({ detectionTime: 2.3, threatsDetected: 1 });
          setAlert({
            type: 'danger',
            title: '⚠️ WATCHLIST MATCH DETECTED',
            message: 'Individual matches wanted person database. Immediate action required.',
            confidence: 87
          });
          
          // Auto-complete after 5 seconds
          setTimeout(() => {
            setState('complete');
          }, 5000);
        }
      }, SCENARIO_CONFIG.scanDuration / 20);
    }, 5000); // Wait for avatar to walk
  };
  
  const handlePause = () => {
    setState('idle');
  };
  
  const handleCameraClick = (camera: any) => {
    console.log('Camera clicked:', camera.name);
    // TODO: Open camera feed modal
  };
  
  return (
    <div className="relative w-full h-screen bg-slate-950">
      {/* 3D Canvas */}
      <Canvas shadows camera={{ position: [8, 6, 8], fov: 50 }}>
        <Suspense fallback={null}>
          <AirportScene state={state} onCameraClick={handleCameraClick} />
          <OrbitControls 
            enablePan={false}
            maxPolarAngle={Math.PI / 2}
            minDistance={5}
            maxDistance={20}
          />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
      
      {/* UI Overlays */}
      <ScenarioHUD state={state} progress={progress} alert={alert} stats={stats} />
      <ControlPanel 
        state={state}
        onPlay={handlePlay}
        onPause={handlePause}
        onReset={reset}
      />
      
      {/* Instructions */}
      {state === 'idle' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-4xl font-bold mb-4">Airport Security Checkpoint</div>
          <div className="text-xl text-slate-400">
            Experience real-time face recognition and threat detection
          </div>
        </div>
      )}
    </div>
  );
}