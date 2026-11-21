import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CyberPedestalProps {
  position?: [number, number, number];
  color?: string;
  secondaryColor?: string;
}

export const CyberPedestal: React.FC<CyberPedestalProps> = ({
  position = [0, -0.92, 0],
  color = '#ec4899', // Matches reference neon pink
  secondaryColor = '#f472b6',
}) => {
  const innerRingRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const dashedRingRef = useRef<THREE.LineSegments>(null);
  const tickMarksRef = useRef<THREE.LineSegments>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Generate crisp glowing heart-shaped particle texture
  const heartTexture = React.useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 64, 64);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      // Draw smooth romantic heart shape
      ctx.moveTo(32, 54);
      ctx.bezierCurveTo(12, 38, 8, 22, 18, 14);
      ctx.bezierCurveTo(25, 9, 31, 14, 32, 20);
      ctx.bezierCurveTo(33, 14, 39, 9, 46, 14);
      ctx.bezierCurveTo(56, 22, 52, 38, 32, 54);
      ctx.closePath();
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Generate the dotted/dashed intermediate cyber ring matching reference
  const dashedGeo = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const segments = 28;
    const r = 0.58;
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = a1 + (Math.PI * 2 / segments) * 0.45; // Dash segment
      positions.push(Math.cos(a1) * r, 0, Math.sin(a1) * r);
      positions.push(Math.cos(a2) * r, 0, Math.sin(a2) * r);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Generate 4 outer radar crosshair ticks matching reference
  const tickGeo = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const r1 = 0.73;
    const r2 = 0.77;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      positions.push(Math.cos(angle) * r1, 0, Math.sin(angle) * r1);
      positions.push(Math.cos(angle) * r2, 0, Math.sin(angle) * r2);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Floating heart particles rising around pedestal
  const particleCount = 60;
  const speeds = React.useMemo(() => {
    const arr = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      arr[i] = 0.12 + Math.random() * 0.16;
    }
    return arr;
  }, []);

  const particleGeo = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.30 + Math.random() * 0.48;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 1.6;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z += delta * 0.12;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z -= delta * 0.08;
    }
    if (dashedRingRef.current) {
      dashedRingRef.current.rotation.y += delta * 0.08;
    }
    if (tickMarksRef.current) {
      tickMarksRef.current.rotation.y -= delta * 0.08;
    }
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += delta * speeds[i];
        if (posArray[i * 3 + 1] > 1.75) {
          posArray[i * 3 + 1] = 0;
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.30 + Math.random() * 0.48;
          posArray[i * 3] = Math.cos(angle) * radius;
          posArray[i * 3 + 2] = Math.sin(angle) * radius;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group position={position}>
      {/* 1. Main Inner Glowing Neon Pink Ring Around Shoes */}
      <mesh ref={innerRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[0.38, 0.435, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 2. Intermediate Dotted/Dashed Cyber Ring */}
      <lineSegments ref={dashedRingRef} geometry={dashedGeo} position={[0, 0.0015, 0]}>
        <lineBasicMaterial
          color={secondaryColor}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* 3. Outer Thin Delicate Neon Pink Ring */}
      <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.73, 0.745, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.78}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 4. Outer Radar Tick Notches */}
      <lineSegments ref={tickMarksRef} geometry={tickGeo} position={[0, 0.0025, 0]}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.82}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* 5. Floating Glowing Heart-Shaped Particles */}
      <points ref={particlesRef} geometry={particleGeo}>
        <pointsMaterial
          size={0.046}
          map={heartTexture}
          color={secondaryColor}
          transparent
          opacity={0.85}
          alphaTest={0.02}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 6. Soft Neon Uplight */}
      <pointLight position={[0, 0.12, 0]} distance={1.4} intensity={0.8} color={color} />
    </group>
  );
};
