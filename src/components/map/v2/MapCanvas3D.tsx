import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useMapStore } from '@/store/mapStore';
import { gridToWorld } from '@/lib/map/coordTransform';
import { zoneCenter } from '@/lib/map/layoutGeometry';
import { zoneColors, cameraColors, personColors, severityColors } from '@/lib/map/colorPalette';
import { IncidentStatus } from '@/types';
import type { MapCameraDto, MapEdgeDto, MapPerson, MapZoneDto } from '@/types';

interface Props {
  zones: MapZoneDto[];
  cameras: MapCameraDto[];
  edges: MapEdgeDto[];
  width: number;
  height: number;
}

const GRID_WORLD = 100;
const WORLD_SCALE = 0.1;

export function MapCanvas3D({ zones, cameras, edges, width, height }: Props) {
  return (
    <div className="absolute inset-0" style={{ width, height }}>
      <Canvas
        shadows
        camera={{ position: [0, 72, 78], fov: 48, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#090f1a']} />
        <fog attach="fog" args={['#090f1a', 105, 180]} />
        <ambientLight intensity={0.42} />
        <directionalLight position={[32, 70, 22]} intensity={1.7} castShadow />
        <pointLight position={[-45, 25, -30]} intensity={1.1} color="#22d3ee" />

        <CameraRig />
        <MapFloor />
        <Adjacency3D cameras={cameras} edges={edges} />
        {zones.map(zone => <ZoneRoom3D key={zone.Id} zone={zone} />)}
        {cameras.map(camera => <Camera3D key={camera.Id} camera={camera} />)}
        <Incidents3D cameras={cameras} zones={zones} />
        <Persons3D />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2.18}
          minDistance={28}
          maxDistance={150}
        />
      </Canvas>
    </div>
  );
}

function CameraRig() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 72, 78);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

function MapFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[GRID_WORLD + 12, GRID_WORLD + 12]} />
        <meshStandardMaterial color="#0d1626" roughness={0.84} metalness={0.08} />
      </mesh>
      <gridHelper args={[GRID_WORLD, 20, '#164e63', '#1f2937']} position={[0, 0.02, 0]} />
    </group>
  );
}

function ZoneRoom3D({ zone }: { zone: MapZoneDto }) {
  const selectZone = useMapStore(s => s.selectZone);
  const selectedZoneId = useMapStore(s => s.selectedZoneId);
  const colors = zoneColors[zone.ZoneType];
  const c = zoneCenter(zone);
  const pos = gridToWorld(c.x, c.y);
  const w = (zone.LayoutW ?? 150) * WORLD_SCALE;
  const d = (zone.LayoutH ?? 110) * WORLD_SCALE;
  const selected = selectedZoneId === zone.Id;

  return (
    <group position={[pos.x, 0, pos.z]}>
      <mesh
        position={[0, 0.15, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          selectZone(zone.Id);
        }}
      >
        <boxGeometry args={[w, 0.3, d]} />
        <meshStandardMaterial
          color={colors.fill}
          emissive={colors.stroke}
          emissiveIntensity={selected ? 0.22 : 0.06}
          transparent
          opacity={selected ? 0.58 : 0.42}
          roughness={0.7}
        />
      </mesh>

      <Wall x={0} z={-d / 2} w={w} d={0.22} color={colors.stroke} selected={selected} />
      <Wall x={0} z={d / 2} w={w} d={0.22} color={colors.stroke} selected={selected} />
      <Wall x={-w / 2} z={0} w={0.22} d={d} color={colors.stroke} selected={selected} />
      <Wall x={w / 2} z={0} w={0.22} d={d} color={colors.stroke} selected={selected} />

      <Text
        position={[-w / 2 + 0.8, 0.52, -d / 2 + 0.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        anchorX="left"
        anchorY="top"
        fontSize={1.25}
        color={colors.stroke}
        maxWidth={Math.max(4, w - 1.6)}
      >
        {zone.Name}
      </Text>
    </group>
  );
}

function Wall({
  x,
  z,
  w,
  d,
  color,
  selected,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
  selected: boolean;
}) {
  return (
    <mesh position={[x, 1, z]} castShadow receiveShadow>
      <boxGeometry args={[w, 1.8, d]} />
      <meshStandardMaterial
        color="#111827"
        emissive={color}
        emissiveIntensity={selected ? 0.18 : 0.04}
        transparent
        opacity={selected ? 0.82 : 0.5}
        roughness={0.62}
      />
    </mesh>
  );
}

function Camera3D({ camera }: { camera: MapCameraDto }) {
  const selectedCameraId = useMapStore(s => s.selectedCameraId);
  const selectCamera = useMapStore(s => s.selectCamera);
  const setLiveFeedCamera = useMapStore(s => s.setLiveFeedCamera);
  const runtime = useMapStore(s => s.cameraRuntime.get(camera.Id));
  if (camera.LayoutX == null || camera.LayoutY == null) return null;

  const p = gridToWorld(camera.LayoutX, camera.LayoutY);
  const online = runtime?.isOnline ?? camera.IsActive;
  const selected = selectedCameraId === camera.Id;
  const color = online ? cameraColors.online : cameraColors.offline;
  const heading = THREE.MathUtils.degToRad(camera.FovHeadingDeg ?? 0);
  const fovRange = (camera.FovRangeUnits ?? 80) * WORLD_SCALE;

  return (
    <group
      position={[p.x, 2.3, p.z]}
      onClick={(e) => {
        e.stopPropagation();
        selectCamera(camera.Id);
        setLiveFeedCamera(camera.Id);
      }}
      onPointerEnter={() => setLiveFeedCamera(camera.Id)}
    >
      <mesh castShadow>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 1.2 : 0.35}
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>
      <mesh position={[0, -1.1, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 2.1, 16]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh
        position={[Math.sin(heading) * fovRange * 0.45, -2.05, Math.cos(heading) * fovRange * 0.45]}
        rotation={[Math.PI / 2, 0, -heading]}
      >
        <coneGeometry args={[fovRange * 0.45, fovRange, 32, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.13} side={THREE.DoubleSide} />
      </mesh>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.05, 0]}>
          <ringGeometry args={[0.85, 1.05, 40]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.9} />
        </mesh>
      )}
      <Text position={[0.75, 0.45, 0]} fontSize={0.8} color="#cbd5e1" anchorX="left">
        {camera.Name}
      </Text>
    </group>
  );
}

function Adjacency3D({ cameras, edges }: { cameras: MapCameraDto[]; edges: MapEdgeDto[] }) {
  const geometry = useMemo(() => {
    const camMap = new Map(cameras.map(camera => [camera.Id, camera]));
    const points = edges.flatMap(edge => {
      const from = camMap.get(edge.FromCameraId);
      const to = camMap.get(edge.ToCameraId);
      if (!from || !to || from.LayoutX == null || from.LayoutY == null || to.LayoutX == null || to.LayoutY == null) {
        return [];
      }
      const a = gridToWorld(from.LayoutX, from.LayoutY);
      const b = gridToWorld(to.LayoutX, to.LayoutY);
      return [new THREE.Vector3(a.x, 0.08, a.z), new THREE.Vector3(b.x, 0.08, b.z)];
    });
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [cameras, edges]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#2563eb" transparent opacity={0.45} />
    </lineSegments>
  );
}

function Persons3D() {
  const persons = useMapStore(s => s.persons);

  return (
    <>
      {Array.from(persons.values()).map(person => (
        <Person3D key={person.id} person={person} />
      ))}
    </>
  );
}

function Person3D({ person }: { person: MapPerson }) {
  const groupRef = useRef<THREE.Group>(null);
  const selectPerson = useMapStore(s => s.selectPerson);
  const selectedPersonId = useMapStore(s => s.selectedPersonId);
  const selected = selectedPersonId === person.id;
  const color = personColors[person.status];
  const start = gridToWorld(person.position.x, person.position.y);

  useEffect(() => {
    if (groupRef.current) groupRef.current.position.set(start.x, 1.35, start.z);
  }, [start.x, start.z]);

  useFrame(() => {
    const node = groupRef.current;
    if (!node) return;
    const target = gridToWorld(person.targetPosition.x, person.targetPosition.y);
    node.position.x += (target.x - node.position.x) * 0.07;
    node.position.z += (target.z - node.position.z) * 0.07;
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        selectPerson(person.id);
      }}
    >
      <mesh castShadow>
        <capsuleGeometry args={[0.35, 0.85, 8, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 1.0 : 0.38} />
      </mesh>
      {(person.status === 'watchlist' || person.status === 'unauthorized') && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.22, 0]}>
          <ringGeometry args={[0.85, 1.1, 42]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      )}
      <Text position={[0.58, 1.05, 0]} fontSize={0.78} color={color} anchorX="left">
        {person.displayName}
      </Text>
    </group>
  );
}

function Incidents3D({ cameras, zones }: { cameras: MapCameraDto[]; zones: MapZoneDto[] }) {
  const incidents = useMapStore(s => s.incidents);
  const active = Array.from(incidents.values()).filter(
    incident => incident.status !== IncidentStatus.Closed && incident.status !== IncidentStatus.Resolved
  );

  return (
    <>
      {active.map(incident => {
        let x = 500;
        let y = 500;
        if (incident.cameraId) {
          const camera = cameras.find(c => c.Id === incident.cameraId);
          if (!camera || camera.LayoutX == null || camera.LayoutY == null) return null;
          x = camera.LayoutX + 10;
          y = camera.LayoutY - 10;
        } else if (incident.zoneId) {
          const zone = zones.find(z => z.Id === incident.zoneId);
          if (!zone) return null;
          const center = zoneCenter(zone);
          x = center.x;
          y = center.y;
        } else {
          return null;
        }

        const p = gridToWorld(x, y);
        const color = severityColors[incident.severity];
        return (
          <group key={incident.id} position={[p.x, 4.3, p.z]}>
            <mesh castShadow>
              <octahedronGeometry args={[0.72, 0]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
            </mesh>
            <Text position={[0.8, 0.12, 0]} fontSize={0.78} color={color} anchorX="left">
              {incident.title}
            </Text>
          </group>
        );
      })}
    </>
  );
}
