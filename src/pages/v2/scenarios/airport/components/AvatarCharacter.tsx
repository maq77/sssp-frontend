import React from 'react';
import { useGLTF } from '@react-three/drei';

interface AvatarCharacterProps {
  position: [number, number, number];
  rotation: [number, number, number];
}

export function AvatarCharacter({ position, rotation }: AvatarCharacterProps) {
  // OPTION 1: Placeholder (current)
  return (
    <group position={position} rotation={rotation}>
      {/* Body */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.5, 1, 0.3]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#f4a460" />
      </mesh>
      
      {/* Face detection box (when scanning) */}
      <mesh position={[0, 1.7, 0.3]}>
        <boxGeometry args={[0.3, 0.3, 0.05]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.3} wireframe />
      </mesh>
    </group>
  );
  
  // OPTION 2: Load your Blender model (uncomment when ready)
  /*
  const { scene } = useGLTF('/models/avatar.glb');
  
  return (
    <primitive 
      object={scene.clone()} 
      position={position} 
      rotation={rotation}
      scale={0.5}
    />
  );
  */
}

// Preload model (uncomment when using GLTF)
// useGLTF.preload('/models/avatar.glb');