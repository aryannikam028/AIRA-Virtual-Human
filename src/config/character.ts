export interface CharacterConfig {
  name: string;
  modelUrl: string;
  fallbackModelUrl?: string;
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  cameraFov: number;
  portraitCameraPosition: [number, number, number];
  portraitTarget: [number, number, number];
  lookAtSpeed: number;
  blinkIntervalRange: [number, number]; // [minMs, maxMs]
}

/**
 * Single Configuration Point for AIRA Full-Body Character
 * - Points directly to authentic anime VRM character: /models/aira.vrm
 */
export const CHARACTER_CONFIG: CharacterConfig = {
  name: 'AIRA',
  modelUrl: '/models/aira.vrm',
  fallbackModelUrl: '/models/aira.glb',
  scale: 1.05,
  position: [0, -0.92, 0],
  rotation: [0, 0, 0],
  // Full-body framing: perfectly displays character from head to feet with comfortable margins
  cameraPosition: [0, -0.05, 3.52],
  cameraTarget: [0, -0.14, 0],
  cameraFov: 34,
  // Portrait close-up framing preset
  portraitCameraPosition: [0, 0.54, 1.45],
  portraitTarget: [0, 0.50, 0],
  lookAtSpeed: 2.8,
  blinkIntervalRange: [3000, 5500],
};
