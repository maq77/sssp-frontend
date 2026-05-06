import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, MeshDistortMaterial, Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

// ============================================
// TYPES & DATA
// ============================================

interface Industry {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  image: string;
}

const INDUSTRIES: Industry[] = [
  {
    id: 'airport',
    title: 'Airports',
    subtitle: 'Face Recognition & Security',
    description: 'Watchlist detection, identity verification, threat prevention',
    color: '#3b82f6',
    image: '/industries/airport.png'
  },
  {
    id: 'smartcity',
    title: 'Smart Cities',
    subtitle: 'AQI Monitoring & Safety',
    description: 'Air quality tracking, behavior analytics, public safety',
    color: '#10b981',
    image: '/industries/smartcity.webp'
  },
  {
    id: 'facility',
    title: 'Restricted Facilities',
    subtitle: 'Access Control & Zones',
    description: 'Geofencing, unauthorized access alerts',
    color: '#ef4444',
    image: '/industries/facility.webp'
  },
  {
    id: 'campus',
    title: 'Campuses',
    subtitle: 'Operations & Monitoring',
    description: 'Incident management, multi-zone monitoring, reporting',
    color: '#f59e0b',
    image: '/industries/campus.webp'
  }
];

// ============================================
// WEBGL DETECTION
// ============================================

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

// ============================================
// PREMIUM LOADER
// ============================================

function PremiumLoader({ progress, onComplete }: { progress: number; onComplete: () => void }) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress(prev => {
        const next = Math.min(prev + 0.5, progress);
        if (next >= 100 && !isComplete) {
          setIsComplete(true);
          setTimeout(onComplete, 800);
        }
        return next;
      });
    }, 20);
    
    return () => clearInterval(interval);
  }, [progress, onComplete, isComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }} />
      </div>

      <div className="relative z-10 text-center px-4">
        <div className="mb-12">
          <div className="text-sm tracking-[0.5em] text-blue-400 mb-4">SSSP</div>
          <div className="text-xs tracking-[0.3em] text-slate-500">SECURITY SURVEILLANCE SYSTEM</div>
        </div>

        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90">
            <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="4" />
            <circle
              cx="96" cy="96" r="88" fill="none" stroke="url(#gradient)" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - displayProgress / 100)}`}
              className="transition-all duration-300 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-bold">
              {Math.floor(displayProgress)}
              <span className="text-2xl text-slate-500">%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-slate-400">
            {displayProgress < 30 && 'Initializing...'}
            {displayProgress >= 30 && displayProgress < 60 && 'Loading Assets...'}
            {displayProgress >= 60 && displayProgress < 90 && 'Preparing Experience...'}
            {displayProgress >= 90 && 'Ready to Launch'}
          </div>
          
          <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>

        {isComplete && (
          <button
            onClick={onComplete}
            className="mt-12 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-semibold tracking-wider hover:scale-105 transition-transform animate-pulse"
          >
            ENTER EXPERIENCE
          </button>
        )}
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
      `}</style>
    </div>
  );
}

// ============================================
// 3D COMPONENTS (with error handling)
// ============================================

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function CrossfadeImagePlane({
  fromSrc,
  toSrc,
  fromColor,
  toColor,
  active,
  direction, // -1 = left, +1 = right
  onDone,
  onClick,
}: {
  fromSrc: string;
  toSrc: string;
  fromColor: string;
  toColor: string;
  active: boolean;
  direction: 1 | -1;
  onDone: () => void;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const outMesh = useRef<THREE.Mesh>(null);
  const inMesh = useRef<THREE.Mesh>(null);
  const outMat = useRef<THREE.MeshStandardMaterial>(null);
  const inMat = useRef<THREE.MeshStandardMaterial>(null);

  const [hovered, setHovered] = useState(false);
  const p = useRef(1); // progress 0..1

  const texA = useTexture(fromSrc);
  const texB = useTexture(toSrc);
  texA.colorSpace = THREE.SRGBColorSpace;
  texB.colorSpace = THREE.SRGBColorSpace;
  
  // Rogier-ish constants
  const DUR = 0.9; // seconds
  const PUSH_X = 0.75; // side push
  const ROT_Y = 0.22; // slight yaw
  const Z_PUSH = 0.25; // depth drift
  
  const finished = useRef(false);
  // start transition
  useEffect(() => {
    if (active) {
      p.current = 0;
      finished.current = false;
    }
  }, [active, toSrc]);


  useFrame((state, dt) => {
    // idle float
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.2;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.08;
    }

    // hover feel (even while idle)
    if (inMat.current) {
      inMat.current.emissiveIntensity = hovered ? 0.32 : 0.16;
    }
    if (outMat.current) {
      outMat.current.emissiveIntensity = hovered ? 0.22 : 0.12;
    }

    if (!active) return;

    // progress
    p.current = clamp01(p.current + dt / DUR);
    const k = easeInOutCubic(p.current);

    // --- Crossfade opacity
    if (outMat.current) outMat.current.opacity = 0.9 * (1 - k);
    if (inMat.current) inMat.current.opacity = 0.9 * k;

    // --- Rogier push: outgoing slides slightly opposite, incoming comes from direction
    const outX = THREE.MathUtils.lerp(0, -direction * PUSH_X, k);
    const inX = THREE.MathUtils.lerp(direction * PUSH_X, 0, k);

    const outRY = THREE.MathUtils.lerp(0, -direction * ROT_Y, k);
    const inRY = THREE.MathUtils.lerp(direction * ROT_Y, 0, k);

    const outZ = THREE.MathUtils.lerp(0, -Z_PUSH, k);
    const inZ = THREE.MathUtils.lerp(Z_PUSH, 0, k);

    const outS = THREE.MathUtils.lerp(1, 0.97, k);
    const inS = THREE.MathUtils.lerp(0.97, 1, k);

    if (outMesh.current) {
      outMesh.current.position.x = outX;
      outMesh.current.position.z = outZ;
      outMesh.current.rotation.y = outRY;
      outMesh.current.scale.setScalar(outS);
    }
    if (inMesh.current) {
      inMesh.current.position.x = inX;
      inMesh.current.position.z = inZ;
      inMesh.current.rotation.y = inRY;
      inMesh.current.scale.setScalar(inS);
    }

    if (p.current >= 1 && !finished.current) {
      finished.current = true;
      onDone();
    }
  });

  return (
    <group ref={groupRef}>
      {/* OUTGOING (no pointer interaction) */}
      <mesh ref={outMesh} raycast={() => null}>
        <planeGeometry args={[5, 3]} />
        <meshStandardMaterial
          ref={outMat}
          map={texA}
          transparent
          opacity={0.9}
          depthWrite={false}
          emissive={new THREE.Color(fromColor)}
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* INCOMING (interactive) */}
      <mesh
        ref={inMesh}
        onClick={onClick}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
        scale={hovered ? 1.05 : 1}
      >
        <planeGeometry args={[5, 3]} />
        <meshStandardMaterial
          ref={inMat}
          map={texB}
          transparent
          opacity={active ? 0 : 0.9}
          depthWrite={false}
          emissive={new THREE.Color(toColor)}
          emissiveIntensity={0.16}
        />
      </mesh>
    </group>
  );
}



function AdvancedParticleField({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1000;
  
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      
      vel[i * 3] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return { positions: pos, velocities: vel };
  }, []);
  
  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.elapsedTime;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] += velocities[i3];
      pos[i3 + 1] += velocities[i3 + 1] + Math.sin(time + i * 0.1) * 0.001;
      pos[i3 + 2] += velocities[i3 + 2];
      
      if (Math.abs(pos[i3]) > 20) pos[i3] *= -1;
      if (Math.abs(pos[i3 + 1]) > 20) pos[i3 + 1] *= -1;
      if (Math.abs(pos[i3 + 2]) > 20) pos[i3 + 2] *= -1;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y = time * 0.02;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={color}
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function BackgroundSphere({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.rotation.x = time * 0.05;
    meshRef.current.rotation.y = time * 0.08;
  });
  
  return (
    <Sphere ref={meshRef} args={[8, 64, 64]} position={[0, 0, -5]}>
      <MeshDistortMaterial
        color={color}
        transparent
        opacity={0.15}
        distort={0.4}
        speed={2}
        roughness={0.5}
        wireframe
      />
    </Sphere>
  );
}

function FloatingRings({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    group.current.rotation.x = time * 0.2;
    group.current.rotation.y = time * 0.3;
  });
  
  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, (Math.PI * i) / 3]}>
          <torusGeometry args={[3 + i * 0.5, 0.02, 16, 100]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.4 - i * 0.1}
            emissive={color}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function ImagePlane({ 
  imageSrc, 
  color,
  onClick 
}: { 
  imageSrc: string;
  color: string;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const texture = useTexture(imageSrc);
  texture.colorSpace = THREE.SRGBColorSpace;
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    meshRef.current.position.y = Math.sin(time * 0.8) * 0.2;
    meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
  });
  
  return (
    <mesh 
      ref={meshRef}
      onClick={onClick}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      scale={hovered ? 1.05 : 1}
    >
      <planeGeometry args={[5, 3]} />
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={0.9}
        emissive={color}
        emissiveIntensity={hovered ? 0.3 : 0.1}
      />
    </mesh>
  );
}

function CameraController() {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 0, 10));
  const mouseRef = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useFrame(() => {
    targetRef.current.set(
      mouseRef.current.x * 0.5, 
      mouseRef.current.y * 0.3, 
      10
    );
    camera.position.lerp(targetRef.current, 0.05);
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

function Scene({
  currentIndustry,
  nextIndustry,
  transitioning,
  direction,
  onTransitionDone,
  onImageClick,
}: {
  currentIndustry: Industry;
  nextIndustry: Industry | null;
  transitioning: boolean;
  direction: 1 | -1;
  onTransitionDone: () => void;
  onImageClick: () => void;
}) {
  const target = nextIndustry ?? currentIndustry;

  return (
    <>
      <CameraController />

      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color={currentIndustry.color} />
      <spotLight position={[0, 10, 0]} intensity={0.8} angle={0.6} penumbra={1} color={currentIndustry.color} />

      <fogExp2 attach="fog" args={["#000000", 0.05]} />

      <BackgroundSphere color={currentIndustry.color} />
      <AdvancedParticleField color={currentIndustry.color} />
      <FloatingRings color={currentIndustry.color} />

      <CrossfadeImagePlane
        fromSrc={currentIndustry.image}
        toSrc={target.image}
        fromColor={currentIndustry.color}
        toColor={target.color}
        active={transitioning}
        direction={direction}
        onDone={onTransitionDone}
        onClick={onImageClick}
      />

      <Environment preset="night" />

      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
        <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} radialModulation modulationOffset={0.3} />
        <Vignette offset={0.3} darkness={0.9} />
      </EffectComposer>
    </>
  );
}



// ============================================
// CSS FALLBACK (NO WEBGL)
// ============================================

function CSSFallback({ 
  currentIndustry,
  onImageClick,
  onNext,
  onPrev,
  currentIndex,
  total
}: {
  currentIndustry: Industry;
  onImageClick: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  total: number;
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Animated background */}
      <div 
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at ${50 + mousePos.x}% ${50 + mousePos.y}%, ${currentIndustry.color}22 0%, transparent 60%)`,
        }}
      />
      
      {/* Particles (CSS) */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full">
        <div className="h-full flex flex-col justify-between px-6 md:px-16">

          {/* TOP */}
          <div className="pt-20 md:pt-28 text-center">
            <div className="text-[11px] md:text-sm tracking-[0.5em] uppercase text-slate-400 mb-4">
              {currentIndustry.subtitle}
            </div>

            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]"
              style={{
                color: currentIndustry.color,
                textShadow: `0 0 80px ${currentIndustry.color}55`,
              }}
            >
              {currentIndustry.title}
            </h1>

            <div className="mx-auto mt-6 h-px w-20 md:w-28 bg-white/10" />
          </div>

          {/* CENTER: Image */}
          <div className="flex justify-center">
            <div
              className="mx-auto max-w-2xl cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={onImageClick}
              style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
            >
              <img
                src={currentIndustry.image}
                alt={currentIndustry.title}
                className="w-full rounded-2xl shadow-2xl"
                style={{ boxShadow: `0 20px 60px ${currentIndustry.color}55` }}
              />
            </div>
          </div>

          {/* BOTTOM */}
          <div className="pb-20 md:pb-28">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-base md:text-lg text-slate-300/90 leading-relaxed">
                {currentIndustry.description}
              </p>

              <button
                onClick={onImageClick}
                className="mt-8 px-8 md:px-10 py-4 md:py-5 rounded-full font-bold tracking-wider text-black hover:scale-110 transition-transform duration-300"
                style={{
                  background: `linear-gradient(135deg, ${currentIndustry.color}, ${currentIndustry.color}dd)`,
                  boxShadow: `0 10px 40px ${currentIndustry.color}55`,
                }}
              >
                EXPLORE SCENARIOS →
              </button>
            </div>
          </div>

        </div>
      </div>

      
      {/* Navigation Controls */}
      <div className="fixed bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 md:gap-6">
        <button
          onClick={onPrev}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/20 bg-black/40 backdrop-blur flex items-center justify-center hover:bg-white/10 transition text-xl"
        >
          ←
        </button>
        
        <div className="flex gap-2 md:gap-3">
          {INDUSTRIES.map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: i === currentIndex ? '48px' : '24px',
                background: i === currentIndex ? currentIndustry.color : 'rgba(255,255,255,0.3)',
                boxShadow: i === currentIndex ? `0 0 20px ${currentIndustry.color}` : 'none'
              }}
            />
          ))}
        </div>
        
        <button
          onClick={onNext}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/20 bg-black/40 backdrop-blur flex items-center justify-center hover:bg-white/10 transition text-xl"
        >
          →
        </button>
      </div>
      
      {/* Counter */}
      <div className="fixed top-8 left-8 z-20">
        <div className="text-4xl md:text-6xl font-black" style={{ color: currentIndustry.color }}>
          {String(currentIndex + 1).padStart(2, '0')}
        </div>
        <div className="text-sm text-slate-500">
          / {String(total).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PremiumV2HomePage() {
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);

  // const current = INDUSTRIES[currentIndex];
  const nextIndustry = nextIndex !== null ? INDUSTRIES[nextIndex] : null;
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [webglAvailable] = useState(isWebGLAvailable());
  
  const current = INDUSTRIES[currentIndex];
  
  useEffect(() => {
    INDUSTRIES.forEach((i) => {
      // @ts-ignore
      useTexture.preload?.(i.image);
    });
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (!isLoaded || transitioning) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigate(1);
      else if (e.key === "ArrowLeft") navigate(-1);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLoaded, transitioning, currentIndex]); 
  
  const safetyTimer = useRef<number | null>(null);
  const navigate = (dir: 1 | -1) => {
    if (transitioning) return;

    const next = (currentIndex + dir + INDUSTRIES.length) % INDUSTRIES.length;

    setSlideDir(dir);
    setNextIndex(next);
    setTransitioning(true);

    // clear old safety timer
    if (safetyTimer.current) window.clearTimeout(safetyTimer.current);

    // safety fallback only (in case r3f unmount / tab switch)
    safetyTimer.current = window.setTimeout(() => {
      setCurrentIndex(next);
      setNextIndex(null);
      setTransitioning(false);
      safetyTimer.current = null;
    }, 1100);
  };

  
  const handleViewScenarios = () => {
    // navigate(/v2/scenarios/${current.id});
    alert(`Navigate to: /v2/scenarios/${current.id}\n\nIn your real app, use:\nnavigate(\`/v2/scenarios/\${current.id}\`);`);
  };
  
  if (!isLoaded) {
    return <PremiumLoader progress={loadingProgress} onComplete={() => setIsLoaded(true)} />;
  }
  
  if (!webglAvailable) {
    return (
      <CSSFallback
        currentIndustry={current}
        onImageClick={handleViewScenarios}
        onNext={() => navigate(1)}
        onPrev={() => navigate(-1)}
        currentIndex={currentIndex}
        total={INDUSTRIES.length}
      />
    );
  }
  
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 50 }}
          gl={{ 
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true
          }}
        >
          <Suspense fallback={null}>
            <Scene
                  currentIndustry={current}
                  nextIndustry={nextIndustry}
                  transitioning={transitioning}
                  direction={slideDir}
                  onTransitionDone={() => {
                    if (nextIndex === null) return;

                    if (safetyTimer.current) {
                      window.clearTimeout(safetyTimer.current);
                      safetyTimer.current = null;
                    }

                    setCurrentIndex(nextIndex);
                    setNextIndex(null);
                    setTransitioning(false);
                  }}
                  onImageClick={handleViewScenarios}
                />

          </Suspense>
        </Canvas>
      </div>
      
      <div className="relative z-10 h-full pointer-events-none">
        <div className="h-full flex flex-col justify-between px-6 md:px-16">
          
          {/* TOP: Subtitle + Title */}
          <div className="pt-24 md:pt-28 text-center">
            <div
              className="text-[11px] md:text-sm tracking-[0.5em] uppercase text-slate-400 transition-all duration-700"
              style={{ opacity: transitioning ? 0 : 1 }}
            >
              {current.subtitle}
            </div>

            <h1
              className="mt-4 text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] transition-all duration-700"
              style={{
                color: current.color,
                opacity: transitioning ? 0 : 1,
                textShadow: `0 0 80px ${current.color}55`,
              }}
            >
              {current.title}
            </h1>

            {/* small divider (optional but nice) */}
            <div
              className="mx-auto mt-6 h-px w-20 md:w-28 bg-white/10"
              style={{ opacity: transitioning ? 0 : 1 }}
            />
          </div>

          {/* BOTTOM: Description + CTA */}
          <div className="pb-24 md:pb-28">
            <div className="mx-auto max-w-2xl text-center">
              <p
                className="text-base md:text-lg text-slate-300/90 leading-relaxed transition-all duration-700"
                style={{ opacity: transitioning ? 0 : 1 }}
              >
                {current.description}
              </p>

              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={handleViewScenarios}
                  className="px-8 md:px-10 py-4 md:py-5 rounded-full font-bold tracking-wider text-black hover:scale-110 transition-transform duration-300 pointer-events-auto"
                  style={{
                    background: `linear-gradient(135deg, ${current.color}, ${current.color}dd)`,
                    boxShadow: `0 10px 40px ${current.color}55`,
                  }}
                >
                  EXPLORE SCENARIOS →
                </button>

                {/* <div className="hidden md:block text-xs tracking-[0.35em] uppercase text-white/30">
                  Drag / ← →
                </div> */}
              </div>
            </div>
          </div>

        </div>
      </div>

      
      <div className="fixed bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 md:gap-6">
        <button
          onClick={() => navigate(-1)}
          disabled={transitioning}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/20 bg-black/40 backdrop-blur flex items-center justify-center hover:bg-white/10 transition disabled:opacity-30 text-xl"
        >
          ←
        </button>
        
        <div className="flex gap-2 md:gap-3">
          {INDUSTRIES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i === currentIndex || transitioning) return;
                navigate(i > currentIndex ? 1 : -1);    
              }}
              disabled={transitioning}
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: i === currentIndex ? '48px' : '24px',
                background: i === currentIndex ? current.color : 'rgba(255,255,255,0.3)',
                boxShadow: i === currentIndex ? `0 0 20px ${current.color}` : 'none'
              }}
            />
          ))}
        </div>
        
        <button
          onClick={() => navigate(1)}
          disabled={transitioning}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/20 bg-black/40 backdrop-blur flex items-center justify-center hover:bg-white/10 transition disabled:opacity-30 text-xl"
        >
          →
        </button>
      </div>
      
      <div className="fixed top-8 right-4 md:right-8 z-20 text-right">
        <div className="text-xs tracking-[0.4em] text-slate-500 mb-4 hidden md:block">INDEX</div>
        {INDUSTRIES.map((ind, i) => (
          <button
            key={ind.id}
            onClick={() => {
              if (i !== currentIndex && !transitioning) {
                navigate(i > currentIndex ? 1 : -1);
              }
            }}
            disabled={transitioning}
            className={`block mb-2 transition-all ${
              i === currentIndex ? 'text-white text-base md:text-lg' : 'text-slate-500 text-sm hover:text-white'
            }`}
          >
            {ind.title}
          </button>
        ))}
      </div>
      
      <div className="fixed top-8 left-8 z-20">
        <div className="text-4xl md:text-6xl font-black" style={{ color: current.color }}>
          {String(currentIndex + 1).padStart(2, '0')}
        </div>
        <div className="text-sm text-slate-500">
          / {String(INDUSTRIES.length).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}