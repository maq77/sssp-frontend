import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useAnimations, useGLTF } from "@react-three/drei";
import { airportConfig } from "../config/airportConfig";

export function PassengerAvatar({
  groupRef,
  walking,
}: {
  groupRef: React.RefObject<THREE.Group>;
  walking: boolean;
}) {
  const { scene, animations } = useGLTF(airportConfig.assets.avatar, true);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  const localGroup = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, localGroup);

  // Pick a walk clip if exists, otherwise do nothing
  useEffect(() => {
    if (!actions) return;
    const walkName =
      names.find((n) => /walk/i.test(n)) ||
      names.find((n) => /run/i.test(n)) ||
      names[0];

    if (!walkName) return;

    const a = actions[walkName];
    if (!a) return;

    if (walking) {
      a.reset().fadeIn(0.15).play();
    } else {
      a.fadeOut(0.15);
    }

    return () => {
      a.stop();
    };
  }, [walking, actions, names]);

  // Shadows
  useEffect(() => {
    cloned.traverse((o: any) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, [cloned]);

  return (
    <group ref={groupRef}>
      <group ref={localGroup}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/avatar.glb");
