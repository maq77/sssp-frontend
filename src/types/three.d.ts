import { Object3DNode } from '@react-three/fiber';
import * as THREE from 'three';

declare module '@react-three/fiber' {
  interface ThreeElements {
    // Geometries
    boxGeometry: Object3DNode<THREE.BoxGeometry, typeof THREE.BoxGeometry>;
    sphereGeometry: Object3DNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>;
    planeGeometry: Object3DNode<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>;
    cylinderGeometry: Object3DNode<THREE.CylinderGeometry, typeof THREE.CylinderGeometry>;
    
    // Materials
    meshStandardMaterial: Object3DNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>;
    meshBasicMaterial: Object3DNode<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>;
    pointsMaterial: Object3DNode<THREE.PointsMaterial, typeof THREE.PointsMaterial>;
    
    // Objects
    mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
    group: Object3DNode<THREE.Group, typeof THREE.Group>;
    points: Object3DNode<THREE.Points, typeof THREE.Points>;
    
    // Lights
    ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
    directionalLight: Object3DNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
    pointLight: Object3DNode<THREE.PointLight, typeof THREE.PointLight>;
    
    // Others
    bufferGeometry: Object3DNode<THREE.BufferGeometry, typeof THREE.BufferGeometry>;
    bufferAttribute: Object3DNode<THREE.BufferAttribute, typeof THREE.BufferAttribute>;
  }
}