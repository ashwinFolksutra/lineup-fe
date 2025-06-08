import React, { forwardRef } from "react";
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

const VideoPreview = forwardRef(({ 
  videoFile, 
  isPlaying, 
  togglePlay, 
  currentTime, 
  duration, 
  formatTime, 
  onSeek 
}, ref) => {
    // Handle 5 seconds back
    const handleSeekBackward = () => {
        const newTime = Math.max(0, currentTime - 5);
        onSeek(newTime);
    };

    // Handle 5 seconds forward
    const handleSeekForward = () => {
        const newTime = Math.min(duration, currentTime + 5);
        onSeek(newTime);
    };

    // Handle jump to start
    const handleJumpToStart = () => {
        onSeek(0);
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="relative group">
                {/* Enhanced glass morphism container */}
                <div className="backdrop-blur-2xl bg-gradient-to-br from-neutral-100/10 via-neutral-100/5 to-neutral-100/10 rounded-3xl shadow-glass-xl border border-white/10 p-6 transition-all duration-500 group-hover:shadow-glass-xl group-hover:border-white/20">
                    {/* Inner video container with elegant styling */}
                    <div className="relative bg-gradient-to-br from-surface-800 to-surface-900 rounded-2xl overflow-hidden shadow-inner-glass border border-surface-600/30">
                        <video
                            ref={ref}
                            src={videoFile}
                            className="w-160 h-80 object-cover"
                        />
                        {/* Sophisticated overlay gradients */}
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/30 via-transparent to-transparent pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-violet-900/10 pointer-events-none"></div>

                        {/* Elegant corner accents */}
                        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary-400/40 rounded-tl-lg"></div>
                        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary-400/40 rounded-tr-lg"></div>
                        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary-400/40 rounded-bl-lg"></div>
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary-400/40 rounded-br-lg"></div>
                    </div>

                    {/* Subtle glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary-500/20 via-transparent to-violet-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
            </div>

            {/* Video Controls */}
            <div className="mt-6 flex items-center gap-3 bg-surface-800/60 rounded-lg px-4 py-2">
                {/* Jump to Start */}
                <button 
                    onClick={handleJumpToStart}
                    className="text-neutral-300 hover:text-white transition-colors p-1"
                    title="Jump to Start"
                >
                    <span className="text-sm">|&lt;&lt;</span>
                </button>

                {/* 5 Seconds Back */}
                <button 
                    onClick={handleSeekBackward}
                    className="text-neutral-300 hover:text-white transition-colors p-1"
                    title="5 seconds back"
                >
                    <span className="text-sm">&lt;&lt;</span>
                </button>

                {/* Play/Pause */}
                <button 
                    onClick={togglePlay}
                    className="text-neutral-300 hover:text-white transition-colors p-1"
                >
                    {isPlaying ? 
                        <PauseIcon className="w-5 h-5" /> : 
                        <PlayIcon className="w-5 h-5" />
                    }
                </button>

                {/* 5 Seconds Forward */}
                <button 
                    onClick={handleSeekForward}
                    className="text-neutral-300 hover:text-white transition-colors p-1"
                    title="5 seconds forward"
                >
                    <span className="text-sm">&gt;&gt;</span>
                </button>

                {/* Duration Display */}
                <div className="ml-4 font-mono text-sm text-neutral-300">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>
        </div>
    );
});

VideoPreview.displayName = "VideoPreview";

export default VideoPreview;
