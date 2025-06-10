// Track.jsx with Redux integration and Glass Morphism Design
import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import VideoTrack from './VideoTrack';
import { 
  updateClip, 
  addMultipleClipsToTrack, 
  selectClip,
  clearSelection,
  addClipToTrack
} from '../store/slices/tracksSlice';

const Track = ({ 
  trackId,
  label, 
  trackType, 
  clips, 
  pixelsPerSecond, 
  duration,
  hasAnyClips
}) => {
  const dispatch = useDispatch();
  const selectedClips = useSelector(state => state.tracks.selectedClips);

  // If this is a video track, use the specialized VideoTrack component
  if (trackType === 'video') {
    return (
      <VideoTrack
        trackId={trackId}
        label={label}
        clips={clips}
        pixelsPerSecond={pixelsPerSecond}
        duration={duration}
        hasAnyClips={hasAnyClips}
      />
    );
  }

  // Continue with the existing audio track logic
  const trackContentRef = useRef(null);
  const [draggedClip, setDraggedClip] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [resizeState, setResizeState] = useState(null);
  const [tempClipStyles, setTempClipStyles] = useState(new Map());

  // Handle mouse events for clip dragging and resizing
  useEffect(() => {
    // Helper function to check for clip collisions
    const findValidPosition = (draggedClipId, requestedStartTime, clipDuration) => {
      const otherClips = clips.filter(clip => clip.id !== draggedClipId);
      
      let candidateStart = Math.max(0, requestedStartTime);
      const candidateEnd = candidateStart + clipDuration;
      
      // Check for collisions and constrain position to prevent overlap
      for (const clip of otherClips) {
        const clipStart = clip.start || clip.startTime || 0;
        const clipEnd = clipStart + (clip.duration || 10);
        
        // If candidate would overlap with this clip
        if (candidateStart < clipEnd && candidateEnd > clipStart) {
          // Determine which boundary to respect based on drag direction
          const draggedClipOriginalStart = draggedClip?.start || draggedClip?.startTime || 0;
          
          if (requestedStartTime > draggedClipOriginalStart) {
            // Dragging right - stop at left edge of obstacle
            candidateStart = Math.max(0, clipStart - clipDuration);
          } else {
            // Dragging left - stop at right edge of obstacle  
            candidateStart = clipEnd;
          }
          break;
        }
      }
      
      return Math.max(0, candidateStart);
    };

    const handleMouseMove = (e) => {
      if (draggedClip) {
        e.preventDefault();
        e.stopPropagation();
        
        requestAnimationFrame(() => {
          const rect = trackContentRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left - dragOffset;
          const rawStartTime = x / pixelsPerSecond;
          
          // Use collision detection to find a valid position
          const clipDuration = draggedClip.duration || 10;
          const newStartTime = findValidPosition(draggedClip.id, rawStartTime, clipDuration);
          const newLeft = newStartTime * pixelsPerSecond;
          
                  const clipElement = trackContentRef.current.querySelector(`[data-clip-id="${draggedClip.id}"]`);
        if (clipElement) {
          // Use direct positioning for accurate visual feedback
          clipElement.style.left = `${newLeft}px`;
          clipElement.style.transition = 'none'; // Disable transitions during drag
          
          setTempClipStyles(prev => new Map(prev.set(draggedClip.id, {
            start: newStartTime,
            startTime: newStartTime,
            left: newLeft
          })));
        }
        });
      } else if (resizeState) {
        e.preventDefault();
        e.stopPropagation();
        
        requestAnimationFrame(() => {
          const rect = trackContentRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const timePosition = x / pixelsPerSecond;
        
        const clipElement = trackContentRef.current.querySelector(`[data-clip-id="${resizeState.clipId}"]`);
        if (!clipElement) return;
        
        if (resizeState.edge === 'right') {
          const newDuration = Math.max(0.1, timePosition - resizeState.originalStart);
          
          // Check for collision with clips to the right
          const clipEnd = resizeState.originalStart + newDuration;
          const otherClips = clips.filter(clip => clip.id !== resizeState.clipId);
          let maxAllowedDuration = newDuration;
          
          for (const clip of otherClips) {
            const clipStart = clip.start || clip.startTime || 0;
            if (clipStart > resizeState.originalStart && clipStart < clipEnd) {
              const allowedDuration = clipStart - resizeState.originalStart;
              maxAllowedDuration = Math.min(maxAllowedDuration, Math.max(0.1, allowedDuration));
            }
          }
          
          const finalDuration = Math.min(newDuration, maxAllowedDuration);
          const newWidth = Math.max(10, finalDuration * pixelsPerSecond);
          // Use direct width change for accurate visual feedback
          clipElement.style.width = `${newWidth}px`;
          clipElement.style.transition = 'none'; // Disable transitions during resize
          
          setTempClipStyles(prev => new Map(prev.set(resizeState.clipId, {
            duration: finalDuration,
            width: newWidth
          })));
        } else if (resizeState.edge === 'left') {
          const maxStart = resizeState.originalStart + resizeState.originalDuration - 0.1;
          let newStart = Math.max(0, Math.min(timePosition, maxStart));
          
          // Check for collision with clips to the left
          const otherClips = clips.filter(clip => clip.id !== resizeState.clipId);
          let minAllowedStart = newStart;
          
          for (const clip of otherClips) {
            const clipStart = clip.start || clip.startTime || 0;
            const clipEnd = clipStart + (clip.duration || 10);
            if (clipEnd > newStart && clipStart < resizeState.originalStart) {
              minAllowedStart = Math.max(minAllowedStart, clipEnd);
            }
          }
          
          newStart = Math.max(newStart, Math.min(minAllowedStart, maxStart));
          const newDuration = resizeState.originalStart + resizeState.originalDuration - newStart;
          const newLeft = newStart * pixelsPerSecond;
          const newWidth = Math.max(10, newDuration * pixelsPerSecond);
          
          const trimmedAmount = newStart - resizeState.originalStart;
          const newAudioOffset = Math.max(0, (resizeState.originalAudioOffset || 0) + trimmedAmount);
          
          console.log('Left resize debug:', {
            originalStart: resizeState.originalStart,
            newStart: newStart,
            trimmedAmount: trimmedAmount,
            originalAudioOffset: resizeState.originalAudioOffset || 0,
            newAudioOffset: newAudioOffset,
            newDuration: newDuration
          });
          
          // Use direct positioning and width change for accurate visual feedback
          clipElement.style.left = `${newLeft}px`;
          clipElement.style.width = `${newWidth}px`;
          clipElement.style.transition = 'none'; // Disable transitions during resize
          
          setTempClipStyles(prev => new Map(prev.set(resizeState.clipId, {
            start: newStart,
            startTime: newStart,
            duration: newDuration,
            audioOffset: newAudioOffset,
            left: newLeft,
            width: newWidth
          })));
        }
        });
      }
    };

    const handleMouseUp = (e) => {
      if (draggedClip || resizeState) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (draggedClip) {
        const tempStyle = tempClipStyles.get(draggedClip.id);
        if (tempStyle) {
          const updates = {};
          if (tempStyle.start !== undefined) updates.start = tempStyle.start;
          if (tempStyle.startTime !== undefined) updates.startTime = tempStyle.startTime;
          
          // Re-enable transitions and ensure final position
          const clipElement = trackContentRef.current.querySelector(`[data-clip-id="${draggedClip.id}"]`);
          if (clipElement) {
            clipElement.style.transition = ''; // Re-enable transitions
            clipElement.style.left = `${tempStyle.left}px`;
          }
          
          dispatch(updateClip({ trackId, clipId: draggedClip.id, updates }));
          
          setTempClipStyles(prev => {
            const newMap = new Map(prev);
            newMap.delete(draggedClip.id);
            return newMap;
          });
        }
      }
      
      if (resizeState) {
        const tempStyle = tempClipStyles.get(resizeState.clipId);
        if (tempStyle) {
          const updates = {};
          if (tempStyle.start !== undefined) updates.start = tempStyle.start;
          if (tempStyle.startTime !== undefined) updates.startTime = tempStyle.startTime;
          if (tempStyle.duration !== undefined) updates.duration = tempStyle.duration;
          if (tempStyle.audioOffset !== undefined) updates.audioOffset = tempStyle.audioOffset;
          
          // Re-enable transitions and ensure final dimensions
          const clipElement = trackContentRef.current.querySelector(`[data-clip-id="${resizeState.clipId}"]`);
          if (clipElement) {
            clipElement.style.transition = ''; // Re-enable transitions
            if (tempStyle.left !== undefined) clipElement.style.left = `${tempStyle.left}px`;
            if (tempStyle.width !== undefined) clipElement.style.width = `${tempStyle.width}px`;
          }
          
          dispatch(updateClip({ trackId, clipId: resizeState.clipId, updates }));
          
          setTempClipStyles(prev => {
            const newMap = new Map(prev);
            newMap.delete(resizeState.clipId);
            return newMap;
          });
        }
      }
      
      setDraggedClip(null);
      setDragOffset(0);
      setResizeState(null);
    };

    if (draggedClip || resizeState) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      document.body.style.userSelect = 'none';
      if (draggedClip) {
        document.body.style.cursor = 'grabbing';
      } else if (resizeState) {
        document.body.style.cursor = 'ew-resize';
      }
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [draggedClip, dragOffset, resizeState, pixelsPerSecond, tempClipStyles, dispatch, trackId]);

  // Helper function to get audio duration
  const getAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration || 10);
      });
      audio.addEventListener('error', () => {
        resolve(10);
      });
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const startTime = Math.max(0, x / pixelsPerSecond);
      
      const newClips = await Promise.all(
        audioFiles.map(async (file, index) => {
          const duration = await getAudioDuration(file);
          return {
            id: Date.now().toString() + index,
            name: file.name,
            start: startTime + (index * 2),
            startTime: startTime + (index * 2),
            duration: duration,
            file: file,
            audioOffset: 0
          };
        })
      );
      
      dispatch(addMultipleClipsToTrack({ trackId, clips: newClips }));
    }
  };

  const handleClipMouseDown = (e, clip) => {
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Always select the clicked clip (single selection only)
    dispatch(selectClip({ clipId: clip.id }));
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    setDraggedClip(clip);
    setDragOffset(offsetX);
  };

  const handleClipClick = (e, clip) => {
    e.preventDefault();
    e.stopPropagation();
    // Select the clicked clip
    dispatch(selectClip({ clipId: clip.id }));
  };

  const handleTrackClick = (e) => {
    if (e.target === e.currentTarget && !draggedClip && !resizeState) {
      dispatch(clearSelection());
    }
  };

  const handleResizeMouseDown = (e, clip, edge) => {
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Always select the clip being resized
    if (selectedClips !== clip.id) {
      dispatch(selectClip({ clipId: clip.id }));
    }
    
    setResizeState({
      clipId: clip.id,
      edge: edge,
      originalStart: clip.start || clip.startTime || 0,
      originalDuration: clip.duration || 10,
      originalAudioOffset: clip.audioOffset || 0
    });
  };

  // Get track-specific colors
  const getTrackColors = (trackType) => {
    switch (trackType) {
      case 'video':
        return {
          bg: 'from-accent-600/25 to-accent-700/35',
          bgHover: 'from-accent-500/30 to-accent-600/40',
          border: 'border-neutral-300/40',
          borderHover: 'border-accent-300/60',
          text: 'text-neutral-100',
          textSecondary: 'text-accent-200',
          accent: 'bg-accent-400/60',
          glow: 'shadow-warm-glow',
          label: 'from-accent-600/80 to-accent-700/90'
        };
      case 'audio1':
        return {
          bg: 'from-accent-600/25 to-accent-700/35',
          bgHover: 'from-accent-500/30 to-accent-600/40',
          border: 'border-neutral-300/40',
          borderHover: 'border-accent-300/60',
          text: 'text-neutral-100',
          textSecondary: 'text-accent-200',
          accent: 'bg-accent-400/60',
          glow: 'shadow-warm-glow',
          label: 'from-accent-600/80 to-accent-700/90'
        };
      case 'audio2':
        return {
          bg: 'from-accent-600/25 to-accent-700/35',
          bgHover: 'from-accent-500/30 to-accent-600/40',
          border: 'border-neutral-300/40',
          borderHover: 'border-accent-300/60',
          text: 'text-neutral-100',
          textSecondary: 'text-accent-200',
          accent: 'bg-accent-400/60',
          glow: 'shadow-warm-glow',
          label: 'from-accent-600/80 to-accent-700/90'
        };
      default:
        return {
          bg: 'from-surface-600/25 to-surface-700/35',
          bgHover: 'from-surface-500/30 to-surface-600/40',
          border: 'border-surface-400/40',
          borderHover: 'border-surface-300/60',
          text: 'text-neutral-200',
          textSecondary: 'text-neutral-300',
          accent: 'bg-surface-400/60',
          glow: 'shadow-glass',
          label: 'from-surface-600/80 to-surface-700/90'
        };
    }
  };

  const colors = getTrackColors(trackType);

  return (
    <div className="relative h-12 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-200">
      <div 
        className="h-full relative group"
        ref={trackContentRef}
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={handleTrackClick}
        onContextMenu={(e) => {
          e.preventDefault();
          if (trackType === 'video') {
            // Calculate position where the user right-clicked
            const rect = trackContentRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const timePosition = x / pixelsPerSecond;
            
            // Create a placeholder clip
            const placeholderClip = {
              id: Date.now().toString(),
              name: 'Video Placeholder',
              start: Math.max(0, timePosition),
              startTime: Math.max(0, timePosition),
              duration: 5, // Default 5 seconds
              isPlaceholder: true,
              placeholderType: 'video'
            };
            
            dispatch(addClipToTrack({ 
              trackId: trackId, 
              clip: placeholderClip 
            }));
          }
        }}
      >
        {/* Track is always visible with drop zone when empty */}
        {clips.length === 0 && (
          <div className="absolute inset-2 flex items-center justify-center">
            <div className="rounded-lg px-6 w-full text-center hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-200">
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  {trackType === 'video' ? (
                    <>
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {label} - Right-click to add placeholder
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {label} - Drop audio files here
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Audio Clips */}
        {clips.map(clip => {
          const startPos = (clip.start !== undefined ? clip.start : clip.startTime || 0) * pixelsPerSecond;
          const clipWidth = (clip.duration || 10) * pixelsPerSecond;
          const isSelected = selectedClips === clip.id;
          const isDragging = draggedClip && draggedClip.id === clip.id;
          const isResizing = resizeState && resizeState.clipId === clip.id;
          
          const tempStyle = tempClipStyles.get(clip.id);
          const finalLeft = tempStyle?.left !== undefined ? tempStyle.left : (isNaN(startPos) ? 0 : startPos);
          const finalWidth = tempStyle?.width !== undefined ? tempStyle.width : (isNaN(clipWidth) ? 10 : Math.max(clipWidth, 10));
          
          return (
            <div
              key={clip.id}
              data-clip-id={clip.id}
              className={`absolute top-0 bottom-0 cursor-grab select-none group border transition-all duration-200 ${
                isSelected 
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-md ring-2 ring-indigo-400/50 z-10' 
                  : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500 shadow-sm'
              } ${isDragging ? 'cursor-grabbing shadow-lg z-20' : ''} ${isResizing ? 'cursor-ew-resize z-20' : ''}`}
              style={{
                left: finalLeft,
                width: finalWidth,
                transition: (isDragging || isResizing) ? 'none' : 'left 0.15s ease-out, width 0.15s ease-out'
              }}
              onMouseDown={(e) => handleClipMouseDown(e, clip)}
              onClick={(e) => handleClipClick(e, clip)}
            >
              {/* Left resize handle */}
              <div 
                className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-indigo-500 transition-opacity duration-200 ${
                  isSelected || isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                onMouseDown={(e) => handleResizeMouseDown(e, clip, 'left')}
                onClick={(e) => handleClipClick(e, clip)}
                title="Resize from left"
              />
              
              {/* Clip Content */}
              <div className="flex flex-col justify-center px-3 h-full min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {clip.name || 'Audio Clip'}
                    </p>
                    {/* <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {(clip.duration || 0).toFixed(1)}s
                    </p> */}
                  </div>
                  
                  {/* Status indicators */}
                  <div className="flex-shrink-0">
                    {clip.isUploading && clip.uploadProgress >= 0 && (
                      <div className="text-xs text-amber-600 dark:text-amber-400">
                        {Math.round(clip.uploadProgress)}%
                      </div>
                    )}
                    {clip.uploadProgress === -1 && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        Error
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {clip.isUploading && clip.uploadProgress >= 0 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-t-lg overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${clip.uploadProgress}%` }}
                  ></div>
                </div>
              )}
              
              {/* Upload Failed Indicator */}
              {clip.uploadProgress === -1 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-lg"></div>
              )}

              {/* Waveform placeholder */}
              {/* <div className="absolute inset-x-3 bottom-1 h-0.5 bg-zinc-200 dark:bg-zinc-600 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 w-1/3 rounded-full"></div>
              </div> */}
              
              {/* Right resize handle */}
              <div 
                className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-indigo-500 transition-opacity duration-200 ${
                  isSelected || isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                onMouseDown={(e) => handleResizeMouseDown(e, clip, 'right')}
                onClick={(e) => handleClipClick(e, clip)}
                title="Resize from right"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Track;