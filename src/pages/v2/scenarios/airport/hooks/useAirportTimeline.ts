import gsap from "gsap";
import * as THREE from "three";
import { airportConfig } from "../config/airportConfig";
import { useAirportState } from "./useAirportState";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

export type TimelineRefs = {
  passenger: React.RefObject<THREE.Group>;
  camera: THREE.PerspectiveCamera;
  controlsTarget: THREE.Vector3; // proxy target for OrbitControls
};

export function buildAirportTimeline(refs: TimelineRefs) {
  const store = useAirportState.getState();
  const { passenger, camera, controlsTarget } = refs;

  const m = store.markers;
  if (!passenger.current || !m.entry || !m.scan || !m.exit || !m.camOverhead || !m.camGate) return null;

  const rm = prefersReducedMotion();
  const t = airportConfig.timings;
  const tWalk1 = rm ? 1.1 : t.walkToScan;
  const tScan = rm ? 1.0 : t.scanDuration;
  const tResp = rm ? 1.0 : t.responseDuration;
  const tWalk2 = rm ? 1.2 : t.walkToExit;

  // Reset passenger to entry
  passenger.current.position.copy(m.entry);
  passenger.current.rotation.set(0, Math.PI / 2, 0);

  store.setProgress(0);
  store.setPhase("idle");

  const tl = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    paused: true,
    onComplete: () => {
      useAirportState.getState().setPhase("resolved");
      useAirportState.getState().setProgress(100);
      useAirportState.getState().setPlaying(false);
    },
  });

  // Default camera view (slightly cinematic)
  tl.set(camera.position, { x: m.scan.x + 8, y: m.scan.y + 6, z: m.scan.z + 10 }, 0);
  tl.set(camera, { fov: airportConfig.camera.defaultFov }, 0);
  tl.set(controlsTarget, { x: m.scan.x, y: m.scan.y + 1.4, z: m.scan.z }, 0);
  tl.add(() => camera.updateProjectionMatrix(), 0);

  // Walk to scan point
  tl.add(() => {
    useAirportState.getState().setPhase("walking");
    useAirportState.getState().setPlaying(true);
  }, 0);

  tl.to(passenger.current.position, {
    x: m.scan.x,
    y: m.scan.y,
    z: m.scan.z,
    duration: tWalk1,
    onUpdate: () => useAirportState.getState().setProgress(30),
  });

  // Scanning
  tl.add(() => {
    useAirportState.getState().setPhase("scanning");
    useAirportState.getState().setProgress(45);
  });

  // Zoom a bit during scan
  tl.to(
    camera.position,
    { x: m.scan.x + 3.2, y: m.scan.y + 2.1, z: m.scan.z + 4.8, duration: rm ? 0.5 : 1.2 },
    "<"
  );
  tl.to(
    controlsTarget,
    { x: m.scan.x, y: m.scan.y + 1.55, z: m.scan.z, duration: rm ? 0.5 : 1.2 },
    "<"
  );
  tl.to(camera, { fov: 38, duration: rm ? 0.5 : 1.2, onUpdate: () => camera.updateProjectionMatrix() }, "<");

  tl.to({}, { duration: tScan });
  tl.add(() => {
    useAirportState.getState().setPhase("alert");
    useAirportState.getState().setProgress(70);
  });

  // Pause here waiting for user decision (AlertSecurity / Review / Dismiss)
  tl.addPause("awaitAction");

  // Responding
  tl.add(() => {
    useAirportState.getState().setPhase("responding");
    useAirportState.getState().setProgress(82);
  });

  // Quick snap to gate camera POV (feels like operator switching view)
  tl.to(camera.position, { x: m.camGate.x, y: m.camGate.y, z: m.camGate.z, duration: tResp }, "<");
  tl.to(controlsTarget, { x: m.scan.x, y: m.scan.y + 1.55, z: m.scan.z, duration: tResp }, "<");
  tl.to(camera, { fov: airportConfig.camera.gateFov, duration: tResp, onUpdate: () => camera.updateProjectionMatrix() }, "<");

  // Walk to exit
  tl.add(() => {
    useAirportState.getState().setPhase("exiting");
    useAirportState.getState().setProgress(90);
  });

  tl.to(passenger.current.position, {
    x: m.exit.x,
    y: m.exit.y,
    z: m.exit.z,
    duration: tWalk2,
  });

  return tl;
}
