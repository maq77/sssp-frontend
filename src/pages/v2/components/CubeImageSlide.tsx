import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial, useTexture } from "@react-three/drei";
import gsap from "gsap";
import { Text as TroikaText } from "troika-three-text";

type CubeImageSlideProps = {
  imageUrl: string;
  tint: string;
  direction: 1 | -1; // incoming direction
  activeKey: string; // changes when slide changes
  labelLeft: string;
  labelRight: string;
};

function useTroika(mesh: THREE.Object3D | null, text: string, opts: any) {
  useEffect(() => {
    if (!mesh) return;
    // @ts-ignore
    mesh.text = text;
    Object.assign(mesh, opts);
    // @ts-ignore
    mesh.sync?.();
  }, [mesh, text, opts]);
}

export function CubeImageSlide({
  imageUrl,
  tint,
  direction,
  activeKey,
  labelLeft,
  labelRight,
}: CubeImageSlideProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cubesRef = useRef<THREE.InstancedMesh>(null);
  const leftTextRef = useRef<any>(null);
  const rightTextRef = useRef<any>(null);

  const tex = useTexture(imageUrl);
  tex.colorSpace = THREE.SRGBColorSpace;

  // Grid density (tweak)
  const cols = 64;
  const rows = 36;
  const count = cols * rows;

  const {
    positions,
    colors,
    scales,
    spacing,
    planeW,
    planeH,
  } = useMemo(() => {
    const spacing = 0.085;
    const planeW = cols * spacing;
    const planeH = rows * spacing;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    // Fill with defaults first
    for (let i = 0; i < count; i++) {
      const x = (i % cols) * spacing - planeW / 2 + spacing / 2;
      const y = Math.floor(i / cols) * spacing - planeH / 2 + spacing / 2;

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = -y; // flip so image isn’t upside down
      positions[i * 3 + 2] = 0;

      colors[i * 3 + 0] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;

      scales[i] = 1;
    }

    return { positions, colors, scales, spacing, planeW, planeH };
  }, [cols, rows, count]);

  // Sample texture pixels → instance colors + slight depth scale
  useEffect(() => {
    if (!tex?.image) return;
    const img = tex.image as HTMLImageElement;

    const canvas = document.createElement("canvas");
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, cols, rows);
    const data = ctx.getImageData(0, 0, cols, rows).data;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const idx = (r * cols + c) * 4;

        const rr = data[idx + 0] / 255;
        const gg = data[idx + 1] / 255;
        const bb = data[idx + 2] / 255;

        // Luma → depth
        const luma = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
        scales[i] = 0.6 + luma * 1.2;

        // Mix with tint a bit (premium identity)
        const tintC = new THREE.Color(tint);
        const mixed = new THREE.Color(rr, gg, bb).lerp(tintC, 0.18);

        colors[i * 3 + 0] = mixed.r;
        colors[i * 3 + 1] = mixed.g;
        colors[i * 3 + 2] = mixed.b;
      }
    }

    const mesh = cubesRef.current;
    if (!mesh) return;

    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // instanceColor
    // @ts-ignore
    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    // @ts-ignore
    mesh.geometry.setAttribute("instanceColor", mesh.instanceColor);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i * 3 + 0],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      dummy.scale.setScalar(scales[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    // @ts-ignore
    mesh.instanceColor.needsUpdate = true;
  }, [tex, tint, cols, rows, count, colors, positions, scales]);

  // Troika labels (subtle, like “grid” language)
  useTroika(leftTextRef.current, labelLeft, {
    fontSize: 0.16,
    color: 0xbcbcbc,
    anchorX: "left",
    anchorY: "middle",
    maxWidth: 6,
  });

  useTroika(rightTextRef.current, labelRight, {
    fontSize: 0.16,
    color: 0xbcbcbc,
    anchorX: "right",
    anchorY: "middle",
    maxWidth: 6,
  });

  // GSAP slide-in/out behavior on activeKey change
  useEffect(() => {
    const g = groupRef.current;
    const mesh = cubesRef.current;
    if (!g || !mesh) return;

    gsap.killTweensOf(g.position);
    gsap.killTweensOf(g.rotation);

    // Start slightly off-screen to left/right, then settle.
    g.position.x = direction * 2.6;
    g.rotation.y = direction * 0.18;

    const tl = gsap.timeline();
    tl.to(g.position, { x: 0, duration: 1.15, ease: "power4.out" }, 0);
    tl.to(g.rotation, { y: 0, duration: 1.15, ease: "power4.out" }, 0);

    // Slight “snap” into place
    tl.fromTo(
      g.position,
      { z: -0.2 },
      { z: 0, duration: 1.0, ease: "power3.out" },
      0
    );

    return () => {
      tl.kill();
    };
  }, [activeKey, direction]);

  // Premium float + mouse parallax
  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;

    const t = state.clock.getElapsedTime();
    g.position.y = Math.sin(t * 0.6) * 0.06;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, state.pointer.y * 0.06, 0.06);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, state.pointer.x * 0.08, 0.06);
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Cubes “image” */}
      <instancedMesh ref={cubesRef} args={[undefined as any, undefined as any, count]}>
        <boxGeometry args={[0.07, 0.07, 0.07]} />
        <meshStandardMaterial
          vertexColors
          metalness={0.55}
          roughness={0.22}
          envMapIntensity={0.7}
        />
      </instancedMesh>

      {/* Ground reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <planeGeometry args={[planeW * 1.35, planeH * 1.35]} />
        <MeshReflectorMaterial
          blur={[400, 120]}
          resolution={1024}
          mixBlur={1}
          mixStrength={1.1}
          roughness={0.55}
          metalness={0.1}
          mirror={0.2}
          depthScale={0.9}
          minDepthThreshold={0.6}
          maxDepthThreshold={1.4}
          color="#050505"
        />
      </mesh>

      {/* Troika labels (tiny, premium) */}
      <primitive object={new TroikaText()} ref={leftTextRef} position={[-3.2, -1.05, 0.6]} />
      <primitive object={new TroikaText()} ref={rightTextRef} position={[3.2, -1.05, 0.6]} />
    </group>
  );
}
