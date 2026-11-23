import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useProgress } from '@react-three/drei';
import { CharacterModel } from './CharacterModel';
import { CyberPedestal } from './CyberPedestal';
import { CHARACTER_CONFIG } from '../config/character';
import { useCharacterStore } from '../state/useCharacterStore';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="model-loader-container">
        <div className="loader-spinner"></div>
        <p className="loader-text">Loading AIRA Full-Body 3D... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

function CameraRig() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const cameraFraming = useCharacterStore((state) => state.cameraFraming);
  const isPortrait = cameraFraming === 'portrait';

  const targetPos = isPortrait ? CHARACTER_CONFIG.portraitCameraPosition : CHARACTER_CONFIG.cameraPosition;
  const targetCenter = isPortrait ? CHARACTER_CONFIG.portraitTarget : CHARACTER_CONFIG.cameraTarget;

  useEffect(() => {
    camera.position.set(targetPos[0], targetPos[1], targetPos[2]);
    if ('fov' in camera) {
      (camera as any).fov = isPortrait ? 32 : CHARACTER_CONFIG.cameraFov;
      camera.updateProjectionMatrix();
    }
    if (controlsRef.current) {
      controlsRef.current.target.set(targetCenter[0], targetCenter[1], targetCenter[2]);
      controlsRef.current.update();
    }
  }, [camera, cameraFraming, targetPos, targetCenter, isPortrait]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={0.8}
      maxDistance={4.5}
      minAzimuthAngle={-Math.PI / 3.2}
      maxAzimuthAngle={Math.PI / 3.2}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 2 + 0.15}
      target={targetCenter}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
    />
  );
}

export const Scene: React.FC = () => {
  const animationQuality = useCharacterStore((state) => state.animationQuality);
  const cameraFraming = useCharacterStore((state) => state.cameraFraming);
  const isPortrait = cameraFraming === 'portrait';
  const dpr = animationQuality === 'high' ? 2 : animationQuality === 'medium' ? 1.5 : 1;
  const shadows = animationQuality !== 'low';

  const initialPos = isPortrait ? CHARACTER_CONFIG.portraitCameraPosition : CHARACTER_CONFIG.cameraPosition;
  const initialFov = isPortrait ? 32 : CHARACTER_CONFIG.cameraFov;

  // Keep Canvas mounted so switching camera framing never re-creates WebGL context or reloads model
  const sceneKey = 'aira-main-canvas';

  return (
    <div className="scene-wrapper">
      <Canvas
        key={sceneKey}
        camera={{
          position: initialPos,
          fov: initialFov,
        }}
        dpr={dpr}
        shadows={shadows}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
        }}
      >
        {/* Ambient & Key Lighting */}
        <ambientLight intensity={0.9} />
        <directionalLight
          position={[1.5, 2.5, 2.0]}
          intensity={1.25}
          castShadow={shadows}
          shadow-mapSize={[1024, 1024]}
        />

        {/* Cinematic Dual Rim Lights (Cyan + Purple Neon) */}
        <pointLight position={[-2.0, 1.8, -1.2]} intensity={2.4} color="#38bdf8" />
        <pointLight position={[2.0, 1.8, -1.2]} intensity={2.4} color="#f472b6" />
        <pointLight position={[0, -0.2, 1.5]} intensity={0.6} color="#c084fc" />

        <Suspense fallback={<Loader />}>
          <CharacterModel />
          {/* Glowing neon ring on floor directly underneath her feet */}
          <CyberPedestal position={[0, CHARACTER_CONFIG.position[1] - 0.058, 0]} />
        </Suspense>

        <CameraRig />
      </Canvas>
    </div>
  );
};
