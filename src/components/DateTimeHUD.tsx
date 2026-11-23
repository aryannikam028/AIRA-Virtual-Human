import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

export const DateTimeHUD: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [is24Hour, setIs24Hour] = useState(false);

  useEffect(() => {
    // Update every second to keep the clock live and accurate
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format Date: e.g. "FRI, 30 OCT 2026"
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();

  // Format Time: e.g. "05:22:15 AM" or "05:22:15"
  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !is24Hour,
  });

  return (
    <div
      onClick={() => setIs24Hour((prev) => !prev)}
      title="Click to toggle 12h/24h time format"
      className="cursor-pointer group flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800/90 border border-white/10 hover:border-pink-500/40 text-[9.5px] sm:text-[10px] font-['Space_Grotesk',sans-serif] tracking-[0.12em] text-neutral-300 transition-all shadow-sm select-none"
    >
      {/* Date indicator (Desktop / Tablet) */}
      <div className="hidden sm:flex items-center gap-1.5 text-neutral-300 group-hover:text-pink-300 transition-colors">
        <Calendar className="w-3.5 h-3.5 text-pink-400" />
        <span className="font-['Space_Grotesk',sans-serif] font-medium tracking-wider">
          {formattedDate}
        </span>
      </div>

      <span className="hidden sm:inline text-neutral-600">•</span>

      {/* Live Time indicator */}
      <div className="flex items-center gap-1.5 text-neutral-200">
        <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span className="font-['Orbitron',sans-serif] font-bold tracking-[0.14em] text-white">
          {formattedTime}
        </span>
      </div>
    </div>
  );
};
