import { VisualAesthetic } from '../types/index.ts';

export interface ThemeConfig {
  name: string;
  glowColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentBg: string;
  gradientText: string;
  orbRgb: [number, number, number];
  borderGlow: string;
}

export const THEMES: Record<VisualAesthetic, ThemeConfig> = {
  'cyber-magenta': {
    name: 'Cyber Magenta',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    accentBg: 'from-pink-500/20 via-purple-500/10 to-transparent',
    gradientText: 'from-pink-400 via-fuchsia-300 to-purple-400',
    orbRgb: [236, 72, 153],
    borderGlow: 'border-pink-500/40 shadow-[0_0_30px_rgba(236,72,153,0.3)]',
  },
  'electric-violet': {
    name: 'Electric Violet',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    primaryColor: '#a855f7',
    secondaryColor: '#6366f1',
    accentBg: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    gradientText: 'from-purple-400 via-violet-300 to-indigo-400',
    orbRgb: [168, 85, 247],
    borderGlow: 'border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.3)]',
  },
  'neon-cyan': {
    name: 'Neon Cyan',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    primaryColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    accentBg: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    gradientText: 'from-cyan-400 via-teal-300 to-blue-400',
    orbRgb: [6, 182, 212],
    borderGlow: 'border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.3)]',
  },
  'emerald-matrix': {
    name: 'Emerald Matrix',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    primaryColor: '#10b981',
    secondaryColor: '#14b8a6',
    accentBg: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    gradientText: 'from-emerald-400 via-green-300 to-teal-400',
    orbRgb: [16, 185, 129],
    borderGlow: 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.3)]',
  },
  'solar-gold': {
    name: 'Solar Gold',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    primaryColor: '#f59e0b',
    secondaryColor: '#f97316',
    accentBg: 'from-amber-500/20 via-orange-500/10 to-transparent',
    gradientText: 'from-amber-400 via-yellow-300 to-orange-400',
    orbRgb: [245, 158, 11],
    borderGlow: 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.3)]',
  },
};
