import { memo } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid'

const TransportBar = memo(({ 
  audioClips, 
  handleSplitClip, 
  currentTime, 
  duration, 
  formatTime, 
  togglePlay, 
  isPlaying, 
  handleZoomOut, 
  handleFitView, 
  handleZoomIn 
}) => {
  // Don't render if no clips exist
//   if (!audioClips || audioClips.length === 0) {
//     return null;
//   }

  return (
    <div className="backdrop-blur-2xl bg-gradient-to-r from-surface-800/80 via-surface-700/60 to-surface-800/80 border-t border-neutral-200/20 shadow-glass px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Left Controls */}
        <div className="flex items-center gap-4">
            <button
                type="button"
                className="rounded-md bg-white/10 px-2.5 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-white/20"
            >
                Button text
            </button>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-neutral-200 bg-surface-800/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-surface-600/40 shadow-inner-glass">
              {formatTime(currentTime)} <span className="text-neutral-400">/</span> {formatTime(duration)}
            </span>
          </div>
          
          <button 
            onClick={togglePlay}
            className="group relative backdrop-blur-md bg-gradient-to-br from-primary-600/30 to-primary-700/40 hover:from-primary-500/40 hover:to-primary-600/50 border border-primary-400/40 hover:border-primary-300/60 rounded-full w-14 h-14 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-glow-lg active:scale-95"
          >
            <div className="relative z-10 text-neutral-100">
              {isPlaying ? 
                <PauseIcon className="w-7 h-7" /> : 
                <PlayIcon className="w-7 h-7 ml-1" />
              }
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400/20 to-primary-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 rounded-full shadow-inner-glass"></div>
            {/* Pulse animation for playing state */}
            {isPlaying && (
              <div className="absolute inset-0 rounded-full animate-pulse-glow"></div>
            )}
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleZoomOut}
            className="group relative backdrop-blur-md bg-gradient-to-r from-accent-600/20 to-accent-700/30 hover:from-accent-500/30 hover:to-accent-600/40 border border-accent-400/30 hover:border-accent-300/50 rounded-lg px-3 py-2 text-sm font-medium text-neutral-100 transition-all duration-300 hover:scale-105 hover:shadow-warm-glow active:scale-95"
            title="Zoom Out"
          >
            <span className="flex items-center gap-1 relative z-10">
              <span className="text-accent-300">🔍</span>
              <span>−</span>
            </span>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent-400/10 to-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 rounded-lg shadow-inner-glass"></div>
          </button>
          
          <button 
            onClick={handleFitView}
            className="group relative backdrop-blur-md bg-gradient-to-r from-violet-600/20 to-violet-700/30 hover:from-violet-500/30 hover:to-violet-600/40 border border-violet-400/30 hover:border-violet-300/50 rounded-lg px-3 py-2 text-sm font-medium text-neutral-100 transition-all duration-300 hover:scale-105 hover:shadow-glow active:scale-95"
            title="Fit to View"
          >
            <span className="flex items-center gap-1 relative z-10">
              <span className="text-violet-300">📐</span>
              <span>Fit</span>
            </span>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-400/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 rounded-lg shadow-inner-glass"></div>
          </button>
          
          <button 
            onClick={handleZoomIn}
            className="group relative backdrop-blur-md bg-gradient-to-r from-accent-600/20 to-accent-700/30 hover:from-accent-500/30 hover:to-accent-600/40 border border-accent-400/30 hover:border-accent-300/50 rounded-lg px-3 py-2 text-sm font-medium text-neutral-100 transition-all duration-300 hover:scale-105 hover:shadow-warm-glow active:scale-95"
            title="Zoom In"
          >
            <span className="flex items-center gap-1 relative z-10">
              <span className="text-accent-300">🔍</span>
              <span>+</span>
            </span>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent-400/10 to-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 rounded-lg shadow-inner-glass"></div>
          </button>
        </div>
      </div>
    </div>
  );
});

TransportBar.displayName = 'TransportBar';

export default TransportBar; 