import React, { useEffect, useRef } from 'react';
import { ConnectionState, VisualAesthetic } from '../types/index.ts';
import { THEMES } from './AestheticThemes.ts';
import { AudioStreamer } from '../services/AudioStreamer.ts';

interface WaveformVisualizerProps {
  state: ConnectionState;
  aesthetic: VisualAesthetic;
  audioStreamer: AudioStreamer | null;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
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

    let animId: number;
    let phase = 0;
    const dataArray = new Uint8Array(64);

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      let level = 0;
      if (audioStreamer) {
        if (state === 'speaking') {
          audioStreamer.getOutputFrequencyData(dataArray);
          level = audioStreamer.getOutputVolume();
        } else if (state === 'listening') {
          audioStreamer.getInputFrequencyData(dataArray);
          level = audioStreamer.getInputVolume();
        }
      }

      phase += 0.04 + level * 0.08;

      // Draw horizontal waveform glow
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const waveAlpha = (0.35 + level * 0.6) / (w + 1);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${waveAlpha})`;
        ctx.lineWidth = 2 - w * 0.4;

        const points = 60;
        const step = width / points;

        for (let i = 0; i <= points; i++) {
          const x = i * step;
          const normalizedI = (i / points) * Math.PI * 4;
          const freqMultiplier = (dataArray[i % dataArray.length] || 0) / 255;
          const envelope = Math.sin((i / points) * Math.PI); // Taper at edges
          
          const amp = (level * 35 + freqMultiplier * 25 + (state === 'disconnected' ? 2 : 5)) * envelope;
          const y = centerY + Math.sin(normalizedI + phase + w * 1.5) * amp;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, aesthetic, audioStreamer, r, g, b]);

  return (
    <div className="w-full max-w-lg mx-auto h-16 sm:h-20 px-4 relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={600}
        height={80}
        className="w-full h-full opacity-90"
      />
    </div>
  );
};
