import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { airportConfig } from "../config/airportConfig";
import { useAirportState } from "../hooks/useAirportState";

function getWorldPos(root: THREE.Object3D, name: string): THREE.Vector3 | undefined {
  const obj = root.getObjectByName(name);
  if (!obj) return undefined;
  const v = new THREE.Vector3();
  obj.getWorldPosition(v);
  return v;
}

export function AirportEnvironment({
  url = airportConfig.assets.env,
  scale = 1,
  recenter = true,
}: {
  url?: string;
  scale?: number;
  recenter?: boolean;
}) {
  const { scene } = useGLTF(url, true);

  const setMarkers = useAirportState((s) => s.setMarkers);
  const setMarkersReady = useAirportState((s) => s.setMarkersReady);

  // Clone so we can safely modify transforms
  const root = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    root.updateMatrixWorld(true);

    // Recenter to avoid huge coordinate precision issues
    if (recenter) {
      const box = new THREE.Box3().setFromObject(root);
      const center = new THREE.Vector3();
      box.getCenter(center);
      root.position.sub(center);
      root.updateMatrixWorld(true);
    }

    root.scale.setScalar(scale);

    // Improve shadows + stability
    root.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    // Read marker empties by name (case-sensitive!)
    const names = airportConfig.markerNames;
    const markers = {
      entry: getWorldPos(root, names.entry),
      scan: getWorldPos(root, names.scan),
      exit: getWorldPos(root, names.exit),
      camOverhead: getWorldPos(root, names.camOverhead),
      camGate: getWorldPos(root, names.camGate),
    };

    setMarkers(markers);
    setMarkersReady(Boolean(markers.entry && markers.scan && markers.exit && markers.camOverhead && markers.camGate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, scale, recenter]);

  return <primitive object={root} />;
}

useGLTF.preload("/models/airport_environment.glb");
