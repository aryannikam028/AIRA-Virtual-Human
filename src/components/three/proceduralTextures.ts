import * as THREE from 'three';

/**
 * Procedural anime eye texture generator (left or right)
 */
export function createAnimeEyeTexture(isRight = false, irisColor = '#ec4899'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Clear
  ctx.clearRect(0, 0, 256, 256);

  // Sclera (White base)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(128, 128, 90, 110, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iris Outer Gradient
  const irisGrad = ctx.createRadialGradient(128, 120, 20, 128, 130, 80);
  irisGrad.addColorStop(0, '#ffffff');
  irisGrad.addColorStop(0.2, irisColor);
  irisGrad.addColorStop(0.7, '#6b21a8');
  irisGrad.addColorStop(1, '#1e1b4b');

  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.ellipse(128, 130, 68, 85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cyber Ring Detail in Iris
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(128, 130, 42, 0, Math.PI * 2);
  ctx.stroke();

  // Pupil (Dark center)
  ctx.fillStyle = '#090514';
  ctx.beginPath();
  ctx.ellipse(128, 130, 28, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  // Catchlights / Specular Anime Sparkles
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(isRight ? 110 : 145, 95, 20, 24, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(isRight ? 148 : 105, 155, 10, 0, Math.PI * 2);
  ctx.fill();

  // Upper Eyelash / Shadow line
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.ellipse(128, 48, 92, 28, 0, 0, Math.PI);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural soft radial contact shadow texture
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural holographic pedestal ring texture
 */
export function createPedestalRingTexture(glowColor = '#ec4899'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 512, 512);

  // Concentric Neon Circles
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.setLineDash([12, 16]);
  ctx.beginPath();
  ctx.arc(256, 256, 180, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.setLineDash([32, 24]);
  ctx.beginPath();
  ctx.arc(256, 256, 140, 0, Math.PI * 2);
  ctx.stroke();

  // Cyber marks
  ctx.setLineDash([]);
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x1 = 256 + Math.cos(angle) * 190;
    const y1 = 256 + Math.sin(angle) * 190;
    const x2 = 256 + Math.cos(angle) * 230;
    const y2 = 256 + Math.sin(angle) * 230;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
