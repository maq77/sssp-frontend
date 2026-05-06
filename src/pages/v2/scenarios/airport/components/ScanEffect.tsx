import React, { useMemo } from "react";
import * as THREE from "three";

export function ScanEffect({
  position,
  visible,
}: {
  position: THREE.Vector3;
  visible: boolean;
}) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#22c55e",
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      }),
    []
  );

  return (
    <group position={position} visible={visible}>
      <mesh material={mat}>
        <planeGeometry args={[1.3, 2.2]} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <ringGeometry args={[0.25, 0.55, 48]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}
