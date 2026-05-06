import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, useProgress } from "@react-three/drei";
import gsap from "gsap";

import { airportConfig } from "../config/airportConfig";
import { useAirportState } from "../hooks/useAirportState";
import { buildAirportTimeline } from "../hooks/useAirportTimeline";
import { AirportEnvironment } from "./AirportEnvironment";
import { PassengerAvatar } from "./PassengerAvatar";
import { SecurityCamera } from "./SecurityCamera";
import { ScanEffect } from "./ScanEffect";

function EnvTryLoad({ hdr, onFail }: { hdr: string; onFail: () => void }) {
  const { errors } = useProgress();
  useEffect(() => {
    if (errors && errors.length > 0) onFail();
  }, [errors, onFail]);

  return (
    <Suspense fallback={null}>
      <Environment files={hdr} background={false} />
    </Suspense>
  );
}

function SafeEnvironment({ hdr }: { hdr?: string }) {
  const [usePreset, setUsePreset] = useState(false);
  if (!hdr || usePreset) return <Environment preset="warehouse" background={false} />;
  return <EnvTryLoad hdr={hdr} onFail={() => setUsePreset(true)} />;
}

function Inner({ onTimeline }: { onTimeline: (t: gsap.core.Timeline | null) => void }) {
  const { camera } = useThree();
  const controls = useRef<any>(null);
  const passengerRef = useRef<THREE.Group>(null);

  const markers = useAirportState((s) => s.markers);
  const markersReady = useAirportState((s) => s.markersReady);
  const phase = useAirportState((s) => s.phase);
  const pov = useAirportState((s) => s.pov);
  const setPOV = useAirportState((s) => s.setPOV);

  const target = useMemo(() => new THREE.Vector3(0, 1.4, 0), []);
  const [timeline, setTimeline] = useState<gsap.core.Timeline | null>(null);

  // Sync OrbitControls with target
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!controls.current) return;
      controls.current.target.set(target.x, target.y, target.z);
      controls.current.update();
    }, 16);
    return () => window.clearInterval(id);
  }, [target]);

  // Build timeline when markers are ready
  useEffect(() => {
    if (!markersReady || !passengerRef.current) return;

    const tl = buildAirportTimeline({
      passenger: passengerRef,
      camera: camera as THREE.PerspectiveCamera,
      controlsTarget: target,
    });

    setTimeline(tl);
    onTimeline(tl);
  }, [markersReady, camera, target, onTimeline]);

  // Camera POV switching
  useEffect(() => {
    if (!markersReady) return;
    
    const scan = markers.scan!;
    const gate = markers.camGate!;
    const overhead = markers.camOverhead!;
    const cam = camera as THREE.PerspectiveCamera;

    const switchCamera = (pos: THREE.Vector3, lookAt: THREE.Vector3, fov: number) => {
      gsap.to(cam.position, { 
        x: pos.x, y: pos.y, z: pos.z, 
        duration: 1.2, ease: "power2.inOut" 
      });
      gsap.to(target, { 
        x: lookAt.x, y: lookAt.y, z: lookAt.z, 
        duration: 1.2, ease: "power2.inOut" 
      });
      gsap.to(cam, { 
        fov, duration: 1.2, ease: "power2.inOut", 
        onUpdate: () => cam.updateProjectionMatrix() 
      });
    };

    if (pov === "gate") {
      // Gate camera watches the entry area
      switchCamera(gate, new THREE.Vector3(scan.x, scan.y + 1.5, scan.z), airportConfig.camera.gateFov);
    } else if (pov === "overhead") {
      switchCamera(overhead, new THREE.Vector3(scan.x, scan.y + 1.5, scan.z), airportConfig.camera.overheadFov);
    } else {
      // Default cinematic view
      switchCamera(
        new THREE.Vector3(scan.x + 8, scan.y + 6, scan.z + 10),
        new THREE.Vector3(scan.x, scan.y + 1.4, scan.z),
        airportConfig.camera.defaultFov
      );
    }
  }, [pov, markersReady, markers, camera, target]);

  const scanVisible = phase === "scanning";

  return (
    <>
      <OrbitControls 
        ref={controls} 
        enablePan={false} 
        enableDamping 
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2}
        minDistance={3}
        maxDistance={25}
      />

      <SafeEnvironment hdr={airportConfig.assets.hdr} />

      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 12, 8]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <hemisphereLight intensity={0.3} groundColor="#444" />

      <Suspense fallback={null}>
        <AirportEnvironment />
      </Suspense>

      <Suspense fallback={null}>
        <PassengerAvatar 
          groupRef={passengerRef} 
          walking={phase === "walking" || phase === "exiting"} 
        />
      </Suspense>

      {markers.scan && (
        <ScanEffect 
          position={markers.scan.clone().add(new THREE.Vector3(0, 1.5, 0))} 
          visible={scanVisible} 
        />
      )}

      {markers.camOverhead && (
        <SecurityCamera
          position={markers.camOverhead}
          active={pov === "overhead"}
          label="Overhead"
          onClick={() => setPOV("overhead")}
        />
      )}
      
      {markers.camGate && (
        <SecurityCamera
          position={markers.camGate}
          active={pov === "gate"}
          label="Gate"
          onClick={() => setPOV("gate")}
        />
      )}
    </>
  );
}

export function AirportScene({ onTimeline }: { onTimeline: (t: gsap.core.Timeline | null) => void }) {
  return (
    <div className="relative h-[78vh] w-full overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/30 shadow-2xl">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [8, 6, 10], fov: airportConfig.camera.defaultFov }}
      >
        <color attach="background" args={["#0a0e1a"]} />
        <Inner onTimeline={onTimeline} />
      </Canvas>
    </div>
  );
}