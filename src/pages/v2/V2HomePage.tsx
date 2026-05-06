import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, MeshDistortMaterial, Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import {useNavigate} from 'react-router-dom';

// ============================================
// DOMAIN MODELS
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
    title: 'Airport Security',
    subtitle: 'AI-Powered Face Recognition',
    description: 'Instant watchlist detection and automated threat prevention with 99.8% accuracy at security checkpoints.',
    color: '#3b82f6',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80'
  },
  {
    id: 'smartcity',
    title: 'Smart Cities',
    subtitle: 'Environmental Intelligence',
    description: 'Real-time air quality monitoring and predictive analytics for safer, healthier urban environments.',
    color: '#10b981',
    image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=80'
  },
  {
    id: 'facility',
    title: 'Critical Infrastructure',
    subtitle: 'Perimeter Defense Systems',
    description: 'Advanced geofencing and instant unauthorized access alerts for maximum facility protection.',
    color: '#ef4444',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80'
  },
  {
    id: 'campus',
    title: 'Campus Operations',
    subtitle: 'Unified Security Platform',
    description: 'Multi-zone monitoring with coordinated incident response and comprehensive analytics.',
    color: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80'
  }
];

// ============================================
// SERVICES
// ============================================

class LoaderService {
  static simulate(onProgress: (p: number) => void, duration = 2500): () => void {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / duration;
      const eased = Math.min(1, 1 - Math.pow(1 - t, 3));
      onProgress(eased * 100);
      if (eased < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }
}

class NavigationService {
  static getNext(current: number, total: number): number {
    return (current + 1) % total;
  }

  static getPrev(current: number, total: number): number {
    return (current - 1 + total) % total;
  }

  static getDirection(from: number, to: number): 1 | -1 {
    return to > from || (from === INDUSTRIES.length - 1 && to === 0) ? 1 : -1;
  }
}

// ============================================
// 3D COMPONENTS
// ============================================

function ParticleFog({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const count = 2000;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
      
      vel[i * 3] = (Math.random() - 0.5) * 0.015;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.015;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
    }
    
    return { positions: pos, velocities: vel };
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    
    const t = state.clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] += velocities[i3];
      pos[i3 + 1] += velocities[i3 + 1] + Math.sin(t + i * 0.1) * 0.001;
      pos[i3 + 2] += velocities[i3 + 2];
      
      if (Math.abs(pos[i3]) > 25) pos[i3] *= -1;
      if (Math.abs(pos[i3 + 1]) > 25) pos[i3 + 1] *= -1;
      if (Math.abs(pos[i3 + 2]) > 25) pos[i3 + 2] *= -1;
    }
    
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y = t * 0.015 + mouse.current.x * 0.12;
    ref.current.rotation.x = mouse.current.y * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={color}
        transparent
        opacity={0.25}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function BackgroundEffects({ color }: { color: string }) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    if (sphereRef.current) {
      sphereRef.current.rotation.x = t * 0.05;
      sphereRef.current.rotation.y = t * 0.08;
    }
    
    if (ringsRef.current) {
      ringsRef.current.rotation.x = t * 0.15;
      ringsRef.current.rotation.y = t * 0.2;
    }
  });
  
  return (
    <>
      <Sphere ref={sphereRef} args={[8, 64, 64]} position={[0, 0, -5]}>
        <MeshDistortMaterial
          color={color}
          transparent
          opacity={0.12}
          distort={0.5}
          speed={2}
          roughness={0.4}
          wireframe
        />
      </Sphere>
      
      <group ref={ringsRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, (Math.PI * i) / 3]}>
            <torusGeometry args={[3 + i * 0.6, 0.015, 16, 100]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.35 - i * 0.08}
              emissive={color}
              emissiveIntensity={0.25}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

function CubicImageDisplay({
  fromImage,
  toImage,
  fromColor,
  toColor,
  transitioning,
  direction,
  onTransitionDone,
  onClick,
}: {
  fromImage: string;
  toImage: string;
  fromColor: string;
  toColor: string;
  transitioning: boolean;
  direction: 1 | -1;
  onTransitionDone: () => void;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const outMeshRef = useRef<THREE.Mesh>(null);
  const inMeshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const progressRef = useRef(1);
  const finishedRef = useRef(false);

  const texFrom = useTexture(fromImage);
  const texTo = useTexture(toImage);
  texFrom.colorSpace = THREE.SRGBColorSpace;
  texTo.colorSpace = THREE.SRGBColorSpace;

  const DURATION = 1.0;
  const SLIDE_X = 0.8;
  const ROTATE_Y = 0.25;
  const DEPTH_Z = 0.3;

  useEffect(() => {
    if (transitioning) {
      progressRef.current = 0;
      finishedRef.current = false;
    }
  }, [transitioning, toImage]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = Math.sin(t * 0.7) * 0.15;
      groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.06;
    }

    if (!transitioning) return;

    progressRef.current = Math.min(1, progressRef.current + delta / DURATION);
    const eased = progressRef.current < 0.5
      ? 4 * progressRef.current ** 3
      : 1 - Math.pow(-2 * progressRef.current + 2, 3) / 2;

    if (outMeshRef.current) {
      const outMat = outMeshRef.current.material as THREE.MeshStandardMaterial;
      outMat.opacity = 0.95 * (1 - eased);
      
      outMeshRef.current.position.x = -direction * SLIDE_X * eased;
      outMeshRef.current.position.z = -DEPTH_Z * eased;
      outMeshRef.current.rotation.y = -direction * ROTATE_Y * eased;
      outMeshRef.current.scale.setScalar(1 - 0.05 * eased);
    }

    if (inMeshRef.current) {
      const inMat = inMeshRef.current.material as THREE.MeshStandardMaterial;
      inMat.opacity = 0.95 * eased;
      
      inMeshRef.current.position.x = direction * SLIDE_X * (1 - eased);
      inMeshRef.current.position.z = DEPTH_Z * (1 - eased);
      inMeshRef.current.rotation.y = direction * ROTATE_Y * (1 - eased);
      inMeshRef.current.scale.setScalar(0.95 + 0.05 * eased);
    }

    if (progressRef.current >= 1 && !finishedRef.current) {
      finishedRef.current = true;
      onTransitionDone();
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={outMeshRef} raycast={() => null}>
        <planeGeometry args={[6, 3.6]} />
        <meshStandardMaterial
          map={texFrom}
          transparent
          opacity={0.95}
          depthWrite={false}
          emissive={fromColor}
          emissiveIntensity={0.15}
        />
      </mesh>

      <mesh
        ref={inMeshRef}
        onClick={onClick}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        scale={hovered ? 1.03 : 1}
      >
        <planeGeometry args={[6, 3.6]} />
        <meshStandardMaterial
          map={texTo}
          transparent
          opacity={transitioning ? 0 : 0.95}
          depthWrite={false}
          emissive={toColor}
          emissiveIntensity={hovered ? 0.3 : 0.15}
        />
      </mesh>
    </group>
  );
}

function CameraController() {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 10));
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useFrame(() => {
    target.current.set(
      mouse.current.x * 0.4,
      mouse.current.y * 0.25,
      10
    );
    camera.position.lerp(target.current, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function Scene({
  current,
  next,
  transitioning,
  direction,
  onDone,
  onClick,
}: {
  current: Industry;
  next: Industry | null;
  transitioning: boolean;
  direction: 1 | -1;
  onDone: () => void;
  onClick: () => void;
}) {
  const target = next || current;

  return (
    <>
      <CameraController />
      
      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <pointLight position={[-10, -10, -5]} intensity={0.6} color={current.color} />
      <spotLight position={[0, 12, 0]} intensity={0.9} angle={0.5} penumbra={1} color={current.color} />

      <fogExp2 attach="fog" args={['#000000', 0.04]} />

      <BackgroundEffects color={current.color} />
      <ParticleFog color={current.color} />

      <CubicImageDisplay
        fromImage={current.image}
        toImage={target.image}
        fromColor={current.color}
        toColor={target.color}
        transitioning={transitioning}
        direction={direction}
        onTransitionDone={onDone}
        onClick={onClick}
      />

      <Environment preset="night" />

      <EffectComposer>
        <Bloom 
          intensity={1.5} 
          luminanceThreshold={0.15} 
          luminanceSmoothing={0.9} 
        />
        <EffectComposer>
          <Bloom 
            intensity={1.5} 
            luminanceThreshold={0.15} 
            luminanceSmoothing={0.9} 
          />
          <ChromaticAberration 
            offset={new THREE.Vector2(0.0015, 0.0015)}
            radialModulation={true}
            modulationOffset={0.3}
          />
          <Vignette offset={0.25} darkness={0.8} />
        </EffectComposer>
        <Vignette offset={0.25} darkness={0.8} />
      </EffectComposer>
    </>
  );
}

// ============================================
// UI COMPONENTS
// ============================================

function Loader({ progress, onEnter }: { progress: number; onEnter: () => void }) {
  // Smooth visual progress so the ring + bar always move together
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      setDisplay((prev) => {
        // Smooth follow (tweak 0.12 -> faster/slower)
        const next = prev + (progress - prev) * 0.12;

        // Snap when very close to avoid endless tiny easing
        if (Math.abs(progress - next) < 0.05) return progress;

        return next;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  const displayClamped = Math.max(0, Math.min(100, display));
  const percent = Math.round(displayClamped);
  const ready = displayClamped >= 99;

  const statusText =
    percent < 30
      ? "Initializing System..."
      : percent < 60
      ? "Loading AI Models..."
      : percent < 90
      ? "Preparing Experience..."
      : "System Ready";

  const R = 100;
  const C = 2 * Math.PI * R;
  const dashOffset = C * (1 - displayClamped / 100);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      <div className="absolute inset-0 opacity-15">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            animation: "gridScroll 25s linear infinite",
          }}
        />
      </div>

      <div className="relative z-10 text-center px-6">
        <div className="mb-16">
          <div className="text-lg tracking-[0.6em] text-blue-400 font-bold mb-3">
            SSSP
          </div>
          <div className="text-xs tracking-[0.35em] text-slate-400">
            SMART SECURITY SURVEILLANCE PLATFORM
          </div>
        </div>

        <div className="relative w-56 h-56 mx-auto mb-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 224 224">
            <circle
              cx="112"
              cy="112"
              r={R}
              fill="none"
              stroke="rgba(59, 130, 246, 0.1)"
              strokeWidth="6"
            />
            <circle
              cx="112"
              cy="112"
              r={R}
              fill="none"
              stroke="url(#loaderGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={dashOffset}
              // IMPORTANT: no CSS transition here — RAF drives the smoothness
            />
            <defs>
              <linearGradient
                id="loaderGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl font-black">
              {percent}
              <span className="text-3xl text-slate-400">%</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-300">{statusText}</div>

          <div className="w-80 max-w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-purple-500 rounded-full"
              // IMPORTANT: no CSS transition here — same display drives both
              style={{ width: `${displayClamped}%` }}
            />
          </div>
        </div>

        {ready && (
          <button
            onClick={onEnter}
            className="mt-14 px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-bold text-lg tracking-wide hover:scale-105 transition-transform shadow-2xl"
            style={{ boxShadow: "0 10px 50px rgba(59, 130, 246, 0.5)" }}
          >
            ENTER PLATFORM
          </button>
        )}
      </div>

      <style>{`
        @keyframes gridScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(60px); }
        }
      `}</style>
    </div>
  );
}


// ============================================
// MAIN COMPONENT
// ============================================

export default function PremiumHomePage() {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  
  const safetyTimer = useRef<number | null>(null);
  const current = INDUSTRIES[currentIndex];
  const next = nextIndex !== null ? INDUSTRIES[nextIndex] : null;

  useEffect(() => {
    return LoaderService.simulate(setProgress, 2500);
  }, []);

  useEffect(() => {
    if (!loaded || transitioning) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft') navigate(-1);
    };

    let touchStart = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStart = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const diff = touchStart - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [loaded, transitioning, currentIndex]);

  const navigate = (dir: 1 | -1) => {
    if (transitioning) return;

    const target = dir === 1 
      ? NavigationService.getNext(currentIndex, INDUSTRIES.length)
      : NavigationService.getPrev(currentIndex, INDUSTRIES.length);

    setDirection(dir);
    setNextIndex(target);
    setTransitioning(true);

    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    safetyTimer.current = window.setTimeout(() => {
      setCurrentIndex(target);
      setNextIndex(null);
      setTransitioning(false);
      safetyTimer.current = null;
    }, 1200);
  };
  const navigate_ = useNavigate();
  const handleScenarioClick = () => {
    navigate_(`/v2/scenarios/${current.id}`);
    // alert(`Navigate to: /scenarios/${current.id}\n\nImplement: navigate(\`/scenarios/\${current.id}\`)`);
  };

  if (!loaded) {
    return <Loader progress={progress} onEnter={() => setLoaded(true)} />;
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden text-white">
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 50 }}
          gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene
              current={current}
              next={next}
              transitioning={transitioning}
              direction={direction}
              onDone={() => {
                if (nextIndex === null) return;
                if (safetyTimer.current) {
                  clearTimeout(safetyTimer.current);
                  safetyTimer.current = null;
                }
                setCurrentIndex(nextIndex);
                setNextIndex(null);
                setTransitioning(false);
              }}
              onClick={handleScenarioClick}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="relative z-10 h-full pointer-events-none">
        <div className="h-full flex flex-col justify-between px-8 md:px-20">
          <div className="pt-28 md:pt-32 text-center">
            <div
              className="text-xs md:text-sm tracking-[0.6em] uppercase font-light transition-all duration-700"
              style={{ 
                color: current.color,
                opacity: transitioning ? 0 : 1,
                transform: transitioning ? 'translateY(-10px)' : 'translateY(0)'
              }}
            >
              {current.subtitle}
            </div>

            <h1
              className="mt-5 text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] transition-all duration-700"
              style={{
                color: current.color,
                opacity: transitioning ? 0 : 1,
                textShadow: `0 0 100px ${current.color}60`,
                transform: transitioning ? 'translateY(-15px)' : 'translateY(0)'
              }}
            >
              {current.title}
            </h1>

            <div
              className="mx-auto mt-8 h-0.5 w-24 transition-all duration-700"
              style={{ 
                background: `linear-gradient(90deg, transparent, ${current.color}, transparent)`,
                opacity: transitioning ? 0 : 0.6
              }}
            />
          </div>

          <div className="pb-28 md:pb-32">
            <div className="mx-auto max-w-3xl text-center">
              <p
                className="text-lg md:text-xl text-slate-200 leading-relaxed font-light transition-all duration-700"
                style={{ 
                  opacity: transitioning ? 0 : 1,
                  transform: transitioning ? 'translateY(10px)' : 'translateY(0)'
                }}
              >
                {current.description}
              </p>

              <button
                onClick={handleScenarioClick}
                className="mt-10 px-10 md:px-12 py-5 md:py-6 rounded-full font-bold text-lg tracking-wide text-black hover:scale-110 transition-all duration-300 pointer-events-auto shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${current.color}, ${current.color}dd)`,
                  boxShadow: `0 15px 60px ${current.color}70`,
                  opacity: transitioning ? 0 : 1
                }}
              >
                EXPLORE SOLUTIONS →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-10 md:bottom-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6">
        <button
          onClick={() => navigate(-1)}
          disabled={transitioning}
          className="w-14 h-14 rounded-full border-2 border-white/20 bg-black/50 backdrop-blur flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-all disabled:opacity-30 text-2xl"
        >
          ←
        </button>

        <div className="flex gap-3">
          {INDUSTRIES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i !== currentIndex && !transitioning) {
                  navigate(NavigationService.getDirection(currentIndex, i));
                }
              }}
              disabled={transitioning}
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: i === currentIndex ? '56px' : '28px',
                background: i === currentIndex ? current.color : 'rgba(255,255,255,0.25)',
                boxShadow: i === currentIndex ? `0 0 25px ${current.color}` : 'none'
              }}
            />
          ))}
        </div>

        <button
          onClick={() => navigate(1)}
          disabled={transitioning}
          className="w-14 h-14 rounded-full border-2 border-white/20 bg-black/50 backdrop-blur flex items-center justify-center hover:bg-white/10 hover:border-white/40 transition-all disabled:opacity-30 text-2xl"
        >
          →
        </button>
      </div>

      <div className="fixed top-10 right-10 z-20 text-right space-y-3">
        <div className="text-[10px] tracking-[0.5em] uppercase text-slate-400 mb-6">INDUSTRIES</div>
        {INDUSTRIES.map((ind, i) => (
          <button
            key={ind.id}
            onClick={() => {
              if (i !== currentIndex && !transitioning) {
                navigate(NavigationService.getDirection(currentIndex, i));
              }
            }}
            disabled={transitioning}
            className={`block transition-all duration-300 ${
              i === currentIndex 
                ? 'text-white text-lg font-bold' 
                : 'text-slate-400 text-sm hover:text-white'
            }`}
            style={{
              color: i === currentIndex ? current.color : undefined
            }}
          >
            {ind.title}
          </button>
        ))}
      </div>

      <div className="fixed top-10 left-10 z-20">
        <div 
          className="text-7xl font-black tabular-nums transition-colors duration-700"
          style={{ color: current.color }}
        >
          {String(currentIndex + 1).padStart(2, '0')}
        </div>
        <div className="text-lg text-slate-400 font-medium">
          / {String(INDUSTRIES.length).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}