import React from 'react';

export function Checkpoint() {
  return (
    <group position={[0, 0, 0]}>
      {/* Left Post */}
      <mesh position={[-1.5, 1.25, 0]}>
        <boxGeometry args={[0.1, 2.5, 0.1]} />
        <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Right Post */}
      <mesh position={[1.5, 1.25, 0]}>
        <boxGeometry args={[0.1, 2.5, 0.1]} />
        <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Top Bar */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[3, 0.1, 0.1]} />
        <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Scanner Panel */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.5, 1.5, 0.05]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          emissive="#0080ff" 
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Scan Zone (floor indicator) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshStandardMaterial 
          color="#00aaff" 
          transparent 
          opacity={0.2}
          emissive="#00aaff"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}