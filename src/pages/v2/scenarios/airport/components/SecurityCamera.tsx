import React, { useMemo } from "react";
import * as THREE from "three";

export function SecurityCamera({
  position,
  active,
  label,
  onClick,
}: {
  position: THREE.Vector3;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: active ? "#ffffff" : "#c7c7c7",
        metalness: 0.4,
        roughness: 0.25,
        emissive: new THREE.Color(active ? "#3b82f6" : "#000000"),
        emissiveIntensity: active ? 1.2 : 0,
      }),
    [active]
  );

  return (
    <group position={position}>
      <mesh
        material={mat}
        castShadow
        onPointerDown={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <sphereGeometry args={[0.18, 24, 24]} />
      </mesh>

      <mesh position={[0, 0, 0.22]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 0.22, 16]} />
        <meshStandardMaterial color={"#111111"} metalness={0.6} roughness={0.2} />
      </mesh>

      {/* label plate */}
      <mesh position={[0, -0.35, 0]} castShadow>
        <boxGeometry args={[0.5, 0.12, 0.08]} />
        <meshStandardMaterial color={"#111827"} />
      </mesh>
    </group>
  );
}
