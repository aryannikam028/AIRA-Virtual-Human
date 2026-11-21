import React, { useEffect } from 'react';
import { WebsiteActionData } from '../types/index.ts';
import { ExternalLink, Globe, X } from 'lucide-react';

interface WebsiteActionToastProps {
  action: WebsiteActionData | null;
  onDismiss: () => void;
}

export const WebsiteActionToast: React.FC<WebsiteActionToastProps> = ({
  action,
  onDismiss,
}) => {
  useEffect(() => {
    if (!action) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, [action, onDismiss]);

  if (!action) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm sm:max-w-md animate-in fade-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/95 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-xl text-white">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9.5px] font-['Orbitron',sans-serif] font-bold uppercase tracking-[0.18em] text-cyan-400">
              Tool Action • Open Website
            </span>
            <span className="text-sm font-semibold font-['Space_Grotesk',sans-serif] text-neutral-100 truncate">
              {action.title || action.url}
            </span>
            <span className="text-[11px] font-['Space_Grotesk',sans-serif] text-neutral-400 truncate">
              {action.url}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          <a
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-['Orbitron',sans-serif] font-bold text-[10.5px] tracking-wider uppercase transition-colors shadow-sm"
          >
            <span>Visit</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onDismiss}
            aria-label="Dismiss toast"
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
