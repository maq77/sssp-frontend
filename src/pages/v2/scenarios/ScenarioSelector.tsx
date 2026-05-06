import React, { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, MeshReflectorMaterial, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { ArrowLeft, Clock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Scenario {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  color: string;
  position: [number, number, number];
  image: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "face-recognition",
    title: "Face Recognition Checkpoint",
    description: "AI-powered watchlist matching and identity verification at security gates",
    duration: "2 min",
    difficulty: "beginner",
    color: "#3b82f6",
    position: [-5.5, 0, 0],
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80"
  },
  {
    id: "threat-detection",
    title: "Abnormal Behavior Detection",
    description: "Real-time detection of suspicious patterns and potential threats",
    duration: "3 min",
    difficulty: "intermediate",
    color: "#ef4444",
    position: [0, 0, 0],
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80"
  },
  {
    id: "baggage-monitoring",
    title: "Unattended Baggage Alert",
    description: "Automated detection and alerts for abandoned luggage",
    duration: "2 min",
    difficulty: "beginner",
    color: "#f59e0b",
    position: [5.5, 0, 0],
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80"
  },
];

const difficultyConfig = {
  beginner: { color: "#10b981", label: "Beginner" },
  intermediate: { color: "#f59e0b", label: "Intermediate" },
  advanced: { color: "#ef4444", label: "Advanced" }
};

function ParticleField({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1500;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 45;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 45;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 45;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime;
    pointsRef.current.rotation.y = t * 0.012;
    pointsRef.current.rotation.x = Math.sin(t * 0.08) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ScenarioCard3D({
  scenario,
  hovered,
  onHover,
  onClick,
}: {
  scenario: Scenario;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const texture = useTexture(scenario.image);
  
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      setImageLoaded(true);
    }
  }, [texture]);

  useFrame((state) => {
    if (!groupRef.current || !frameRef.current) return;
    const t = state.clock.elapsedTime;
    
    groupRef.current.position.y = scenario.position[1] + Math.sin(t * 0.6 + scenario.position[0]) * 0.18;
    
    const targetY = hovered ? scenario.position[1] + 0.7 : scenario.position[1];
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY + Math.sin(t * 0.6 + scenario.position[0]) * 0.18,
      0.08
    );
    
    frameRef.current.rotation.y = t * 0.15 + (hovered ? Math.PI * 0.08 : 0);
    frameRef.current.rotation.x = Math.sin(t * 0.25) * 0.04;
  });

  return (
    <group ref={groupRef} position={scenario.position}>
      <mesh
        ref={frameRef}
        onPointerOver={() => {
          onHover(scenario.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'default';
        }}
        onClick={onClick}
        scale={hovered ? 1.12 : 1}
        castShadow
      >
        <boxGeometry args={[3.5, 3.5, 0.35]} />
        <meshStandardMaterial
          color={hovered ? scenario.color : "#151515"}
          metalness={0.85}
          roughness={0.18}
          emissive={scenario.color}
          emissiveIntensity={hovered ? 0.6 : 0.2}
        />
      </mesh>

      {imageLoaded && texture && (
        <mesh position={[0, 0, 0.18]}>
          <planeGeometry args={[3, 3]} />
          <meshStandardMaterial
            map={texture}
            emissive={scenario.color}
            emissiveIntensity={hovered ? 0.35 : 0.08}
          />
        </mesh>
      )}

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <torusGeometry args={[2, 0.04, 16, 64]} />
        <meshBasicMaterial
          color={scenario.color}
          transparent
          opacity={hovered ? 0.9 : 0.35}
        />
      </mesh>

      {hovered && (
        <Html position={[0, 3, 0]} center>
          <div className="w-[360px] rounded-2xl border border-white/20 bg-black/85 backdrop-blur-xl p-6 shadow-2xl animate-fadeIn">
            <div className="mb-4">
              <h3 className="text-xl font-black text-white mb-2 tracking-tight">{scenario.title}</h3>
              <p className="text-sm text-white/75 leading-relaxed">{scenario.description}</p>
            </div>
            
            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4" style={{ color: scenario.color }} />
                <span className="text-white/85 font-medium">{scenario.duration}</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-4 h-4" style={{ color: difficultyConfig[scenario.difficulty].color }} />
                <span className="text-white/85 font-medium">{difficultyConfig[scenario.difficulty].label}</span>
              </div>
            </div>

            <button
              className="w-full mt-5 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${scenario.color}, ${scenario.color}dd)`,
                boxShadow: `0 10px 40px ${scenario.color}70`
              }}
            >
              Launch Interactive Demo →
            </button>
          </div>
        </Html>
      )}

      <mesh position={[0, -2.4, 0.2]}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshBasicMaterial
          color={difficultyConfig[scenario.difficulty].color}
          transparent
          opacity={0.95}
        />
      </mesh>
    </group>
  );
}

function Scene({
  scenarios,
  onScenarioSelect,
}: {
  scenarios: Scenario[];
  onScenarioSelect: (s: Scenario) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const camTarget = useMemo(() => new THREE.Vector3(0, 0.4, 15), []);

  useFrame(({ camera, pointer }) => {
    camTarget.set(pointer.x * 0.9, pointer.y * 0.6 + 0.4, 15);
    camera.position.lerp(camTarget, 0.04);
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight 
        position={[12, 15, 10]} 
        intensity={1.5} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 5, 8]} intensity={0.9} color="#3b82f6" />
      <spotLight
        position={[0, 12, 0]}
        angle={0.4}
        penumbra={1}
        intensity={1.2}
        color="#3b82f6"
      />

      <fogExp2 attach="fog" args={['#000000', 0.018]} />

      <ParticleField color="#3b82f6" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.8, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          resolution={1024}
          blur={[700, 120]}
          mixBlur={1.3}
          mixStrength={1.8}
          roughness={0.45}
          metalness={0.6}
          mirror={0.3}
          color="#080808"
          depthScale={1.2}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.5}
        />
      </mesh>

      {scenarios.map((s) => (
        <ScenarioCard3D
          key={s.id}
          scenario={s}
          hovered={hoveredId === s.id}
          onHover={setHoveredId}
          onClick={() => onScenarioSelect(s)}
        />
      ))}

      <Environment preset="night" />

      <EffectComposer>
        <Bloom
          intensity={2}
          luminanceThreshold={0.08}
          luminanceSmoothing={0.95}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0018, 0.0018)}
          radialModulation={true}
          modulationOffset={0.25}
        />
        <Vignette offset={0.18} darkness={0.65} />
      </EffectComposer>
    </>
  );
}

export default function ScenarioSelector() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const navigate = useNavigate();
  const handleScenarioSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    navigate(`/v2/scenarios/airport/${scenario.id}`);
    // alert(`Launching: ${scenario.title}\n\nIn your app, navigate to: /scenarios/airport/${scenario.id}`);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden text-white">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #3b82f640 0%, transparent 70%)'
        }}
      />

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.4, 15], fov: 50 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <Scene
            scenarios={SCENARIOS}
            onScenarioSelect={handleScenarioSelect}
          />
        </Suspense>
      </Canvas>

      <div className="fixed top-0 left-0 right-0 z-20 px-12 pt-12">
        <button onClick={() => navigate("/v2")}
          className="flex items-center gap-2 text-white/55 hover:text-white transition-all duration-300 mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] tracking-[0.45em] uppercase font-semibold">Back to Industries</span>
        </button>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs tracking-[0.45em] uppercase font-bold mb-3 text-blue-400">
              Interactive Security Scenarios
            </div>
            <h1 className="text-7xl font-black tracking-tighter mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Airport Security
            </h1>
            <p className="text-xl text-white/60 max-w-2xl font-light">
              Advanced AI-powered security and threat detection systems
            </p>
          </div>

          <div className="text-right">
            <div className="text-[10px] tracking-[0.45em] uppercase text-white/35 mb-2 font-semibold">
              Available Demos
            </div>
            <div className="text-6xl font-black text-blue-400">
              {SCENARIOS.length}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-20">
        <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl px-10 py-5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm tracking-wide text-white/90 font-medium">
              Hover over scenarios for details • Click to launch interactive demo
            </span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-12 right-12 z-20 space-y-3">
        {SCENARIOS.map((s, i) => (
          <div
            key={s.id}
            className="w-14 h-14 rounded-xl border bg-black/50 backdrop-blur flex items-center justify-center text-sm font-black transition-all hover:scale-110 cursor-pointer"
            style={{
              borderColor: `${s.color}50`,
              color: s.color,
              opacity: 0.7,
              animation: `slideIn 0.5s ease-out ${i * 0.15}s both`
            }}
            onClick={() => handleScenarioSelect(s)}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 0.7;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.35s ease-out;
        }
      `}</style>
    </div>
  );
}