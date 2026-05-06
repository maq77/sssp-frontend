export const SCENARIO_CONFIG = {
  cameras: [
    { 
      id: 'overhead', 
      position: [0, 5, -2] as [number, number, number], 
      target: [0, 0, 0] as [number, number, number], 
      name: 'Overhead Camera' 
    },
    { 
      id: 'gate', 
      position: [-3, 2, 0] as [number, number, number], 
      target: [0, 1, 0] as [number, number, number], 
      name: 'Gate Camera' 
    }
  ],
  
  checkpointPosition: [0, 0, 0] as [number, number, number],
  avatarStart: [0, 0, -8] as [number, number, number],
  avatarCheckpoint: [0, 0, 0] as [number, number, number],
  scanDuration: 2000,
  walkSpeed: 0.02
};

export const airportConfig = {
  assets: {
    env: "/models/airport_environment.glb",
    avatar: "/models/avatar.glb",
    hdr: "/hdr/airport.hdr", // optional (if missing, scene still works)
  },
  markerNames: {
    entry: "EntryPoint",
    scan: "ScanPoint",
    exit: "ExitPoint",
    camOverhead: "Camera_Overhead",
    camGate: "Camera_Gate",
  },
  timings: {
    walkToScan: 2.6,
    scanDuration: 2.0,
    responseDuration: 1.5,
    walkToExit: 2.2,
  },
  camera: {
    defaultFov: 45,
    overheadFov: 40,
    gateFov: 35,
  },
};


export type ScenarioState = 'idle' | 'walking' | 'scanning' | 'alert' | 'complete';

export interface Alert {
  type: 'danger' | 'warning' | 'success';
  title: string;
  message: string;
  confidence?: number;
}

export interface ScenarioStats {
  detectionTime: number;
  threatsDetected: number;
}