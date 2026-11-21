import React, { useEffect, useRef } from 'react';
import { ConnectionState, VisualAesthetic } from '../types/index.ts';
import { THEMES } from './AestheticThemes.ts';
import { AudioStreamer } from '../services/AudioStreamer.ts';
import { Scene } from './Scene.tsx';

interface AuraOrbProps {
  state: ConnectionState;
  aesthetic: VisualAesthetic;
  audioStreamer: AudioStreamer | null;
}

export const AuraOrb: React.FC<AuraOrbProps> = ({
  state,
  aesthetic,
  audioStreamer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = THEMES[aesthetic] || THEMES['cyber-magenta'];
  const [r, g, b] = theme.orbRgb;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    const freqData = new Uint8Array(64);

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height * 0.38;
      const baseRadius = Math.min(width, height) * 0.22;

      ctx.clearRect(0, 0, width, height);

      // Determine audio level based on active state
      let audioLevel = 0;
      if (audioStreamer) {
        if (state === 'speaking') {
          audioStreamer.getOutputFrequencyData(freqData);
          audioLevel = audioStreamer.getOutputVolume();
        } else if (state === 'listening') {
          audioStreamer.getInputFrequencyData(freqData);
          audioLevel = audioStreamer.getInputVolume();
        }
      }

      angle += state === 'connecting' ? 0.05 : state === 'speaking' ? 0.03 : 0.015;

      // 1. Draw outer ambient particle dust / radiating glow rings behind 3D character
      const pulseScale = 1 + audioLevel * 0.8 + Math.sin(angle * 2) * 0.04;
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.35,
        centerX,
        centerY,
        baseRadius * (1.75 + audioLevel * 1.1)
      );

      const alpha1 = state === 'speaking' ? 0.38 : state === 'listening' ? 0.3 : 0.18;
      const alpha2 = state === 'speaking' ? 0.16 : state === 'listening' ? 0.12 : 0.06;

      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha1})`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha2})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2.2 * pulseScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Draw rotating orbital holographic rings around character aura
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle * 0.4);

      // Ring 1 (Dotted)
      ctx.beginPath();
      ctx.setLineDash([3, 10]);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;
      ctx.arc(0, 0, baseRadius * 1.15, 0, Math.PI * 2);
      ctx.stroke();

      // Ring 2 (Counter-rotating segmented arc)
      ctx.rotate(-angle * 0.8);
      ctx.beginPath();
      ctx.setLineDash([18, 14, 4, 14]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + audioLevel * 0.3})`;
      ctx.arc(0, 0, baseRadius * 1.32, 0, Math.PI * 2);
      ctx.stroke();

      // Ring 3 (Outer subtle aura ring)
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.12)`;
      ctx.arc(0, 0, baseRadius * 1.46, Math.PI * 0.5, Math.PI * 1.8);
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [state, aesthetic, audioStreamer, r, g, b]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-auto">
      {/* Dynamic Background Aura Canvas behind 3D Character */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* 3D AIRA VRM Character Stage - Full Bleed */}
      <div className="relative z-10 w-full h-full">
        <Scene />
      </div>
    </div>
  );
};
