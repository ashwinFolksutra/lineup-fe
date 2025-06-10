import React, { forwardRef } from "react";
import { Button } from './button';
import { 
  PlayIcon, 
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid';
import {
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';

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
        <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
            {/* Video Container */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="relative max-w-4xl w-full">
                    {/* Video Element */}
                    <div className="relative bg-zinc-900 rounded-lg overflow-hidden shadow-xl border border-zinc-200 dark:border-zinc-700">
                        <video
                            ref={ref}
                            src={videoFile}
                            className="w-full h-auto max-h-[40vh] object-contain"
                        />
                        
                        {/* Video overlay for play button when paused */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                                <Button 
                                    size="lg"
                                    color="white"
                                    onClick={togglePlay}
                                    className="shadow-xl"
                                >
                                    <PlayIcon className="w-8 h-8" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2">
                <div className="flex items-center justify-center max-w-4xl mx-auto">
                    {/* All Controls Centered */}
                    <div className="flex items-center gap-2">
                        <Button size="sm" plain onClick={handleJumpToStart} title="Jump to Start">
                            <ArrowUturnLeftIcon className="w-4 h-4" />
                        </Button>

                        <Button size="sm" plain onClick={handleSeekBackward} title="5 seconds back">
                            <BackwardIcon className="w-4 h-4" />
                        </Button>

                        <Button 
                            size="sm"
                            color={isPlaying ? "red" : "indigo"}
                            onClick={togglePlay}
                        >
                            {isPlaying ? (
                                <PauseIcon className="w-4 h-4" />
                            ) : (
                                <PlayIcon className="w-4 h-4" />
                            )}
                        </Button>

                        <Button size="sm" plain onClick={handleSeekForward} title="5 seconds forward">
                            <ForwardIcon className="w-4 h-4" />
                        </Button>

                        <div className="text-sm font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-md">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

VideoPreview.displayName = "VideoPreview";

export default VideoPreview;
