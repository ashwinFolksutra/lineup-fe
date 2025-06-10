// Track.jsx with Redux integration and Glass Morphism Design
import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import VideoTrack from './VideoTrack';
import { 
  updateClip, 
  addMultipleClipsToTrack, 
  selectClip 
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
    const findNonOverlappingPosition = (draggedClipId, newStartTime, clipDuration) => {
      const otherClips = clips.filter(clip => clip.id !== draggedClipId);
      
      // Sort clips by start time for easier collision detection
      const sortedClips = otherClips.sort((a, b) => 
        (a.start || a.startTime || 0) - (b.start || b.startTime || 0)
      );
      
      let candidateStart = Math.max(0, newStartTime);
      const candidateEnd = candidateStart + clipDuration;
      
      // Check for collisions and find the nearest available position
      for (const clip of sortedClips) {
        const clipStart = clip.start || clip.startTime || 0;
        const clipEnd = clipStart + (clip.duration || 10);
        
        // Check if candidate position overlaps with this clip
        if (candidateStart < clipEnd && candidateEnd > clipStart) {
          // Try to place after this clip
          const afterClipStart = clipEnd;
          const afterClipEnd = afterClipStart + clipDuration;
          
          // Check if placing after this clip would conflict with the next clip
          let canPlaceAfter = true;
          for (const nextClip of sortedClips) {
            const nextClipStart = nextClip.start || nextClip.startTime || 0;
            const nextClipEnd = nextClipStart + (nextClip.duration || 10);
            
            if (nextClipStart > clipEnd && afterClipStart < nextClipEnd && afterClipEnd > nextClipStart) {
              canPlaceAfter = false;
              break;
            }
          }
          
          if (canPlaceAfter) {
            candidateStart = afterClipStart;
            break;
          } else {
            // Try to place before this clip
            const beforeClipEnd = clipStart;
            const beforeClipStart = beforeClipEnd - clipDuration;
            
            if (beforeClipStart >= 0) {
              // Check if placing before this clip would conflict with previous clips
              let canPlaceBefore = true;
              for (const prevClip of sortedClips) {
                const prevClipStart = prevClip.start || prevClip.startTime || 0;
                const prevClipEnd = prevClipStart + (prevClip.duration || 10);
                
                if (prevClipEnd <= clipStart && beforeClipStart < prevClipEnd && beforeClipEnd > prevClipStart) {
                  canPlaceBefore = false;
                  break;
                }
              }
              
              if (canPlaceBefore) {
                candidateStart = beforeClipStart;
                break;
              }
            }
          }
        }
      }
      
      return candidateStart;
    };

    const handleMouseMove = (e) => {
      if (draggedClip) {
        e.preventDefault();
        e.stopPropagation();
        
        const rect = trackContentRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - dragOffset;
        const rawStartTime = x / pixelsPerSecond;
        
        // Use collision detection to find a valid position
        const clipDuration = draggedClip.duration || 10;
        const newStartTime = findNonOverlappingPosition(draggedClip.id, rawStartTime, clipDuration);
        const newLeft = newStartTime * pixelsPerSecond;
        
        const clipElement = trackContentRef.current.querySelector(`[data-clip-id="${draggedClip.id}"]`);
        if (clipElement) {
          clipElement.style.left = `${newLeft}px`;
          
          setTempClipStyles(prev => new Map(prev.set(draggedClip.id, {
            start: newStartTime,
            startTime: newStartTime,
            left: newLeft
          })));
        }
      } else if (resizeState) {
        e.preventDefault();
        e.stopPropagation();
        
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
          const newWidth = Math.max(80, finalDuration * pixelsPerSecond);
          clipElement.style.width = `${newWidth}px`;
          
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
          const newWidth = Math.max(80, newDuration * pixelsPerSecond);
          
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
          
          clipElement.style.left = `${newLeft}px`;
          clipElement.style.width = `${newWidth}px`;
          
          setTempClipStyles(prev => new Map(prev.set(resizeState.clipId, {
            start: newStart,
            startTime: newStart,
            duration: newDuration,
            audioOffset: newAudioOffset,
            left: newLeft,
            width: newWidth
          })));
        }
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

  const handleClipClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTrackClick = (e) => {
    if (e.target === e.currentTarget && !draggedClip && !resizeState) {
      dispatch(selectClip({ clipId: null }));
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
    <div className="relative h-12 backdrop-blur-md bg-gradient-to-r from-surface-800/30 via-surface-700/20 to-surface-800/30 border-b border-neutral-200/10 hover:bg-gradient-to-r hover:from-surface-700/40 hover:via-surface-600/30 hover:to-surface-700/40 transition-all duration-300">
      <div 
        className="h-full relative group"
        ref={trackContentRef}
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={handleTrackClick}
      >
        {/* Enhanced Track Label */}
        {clips.length == 0 && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <div className={`backdrop-blur-md bg-gradient-to-r ${colors.label} ${colors.border} border rounded-lg px-2.5 py-1 shadow-inner-glass`}>
              <span className={`text-xs font-semibold ${colors.text} tracking-wide`}>{label}</span>
            </div>
          </div>
        )}

        {/* Enhanced Drop Zone Placeholder */}
        {clips.length === 0 && !hasAnyClips && (
          <div className="absolute cursor-default inset-0 left-0 right-0 flex items-center justify-center w-full transition-transform duration-300">
            <div className="backdrop-blur-md bg-gradient-to-r from-neutral-100/5 to-neutral-100/10 border border-dashed border-neutral-200/30 rounded-lg px-6 py-2 transition-all duration-300 hover:border-neutral-200/50 hover:bg-gradient-to-r hover:from-neutral-100/10 hover:to-neutral-100/15 hover:shadow-glass">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary-400/40 to-primary-600/60 flex items-center justify-center">
                  <span className="text-primary-200 text-xs">🎵</span>
                </div>
                <span className="text-neutral-300 text-xs font-medium">
                  Drop audio files here or click to add
                </span>
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
          const finalWidth = tempStyle?.width !== undefined ? tempStyle.width : (isNaN(clipWidth) ? 80 : Math.max(clipWidth, 80));
          
          return (
            <div
              key={clip.id}
              data-clip-id={clip.id}
              className={`absolute top-1 bottom-1 cursor-grab select-none group backdrop-blur-lg bg-gradient-to-r ${colors.bg} hover:${colors.bgHover} ${colors.border} hover:${colors.borderHover} border rounded-lg hover:z-10 shadow-glass hover:shadow-glass-lg transition-all duration-300 ${
                isSelected ? `ring-2 ring-primary-400/60 ${colors.glow} bg-gradient-to-r ${colors.bgHover}` : ''
              } ${isDragging ? 'cursor-grabbing z-20' : ''} ${isResizing ? `z-20 ring-2 ring-accent-400/60 ${colors.glow}` : ''}`}
              style={{
                left: finalLeft,
                width: finalWidth,
                transition: (isDragging || isResizing) ? 'none' : undefined
              }}
              onMouseDown={(e) => handleClipMouseDown(e, clip)}
              onClick={handleClipClick}
            >
              {/* Enhanced Left resize handle */}
              <div 
                className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize transition-all duration-200 hover:bg-gradient-to-r hover:from-neutral-100/30 hover:to-transparent rounded-l-lg ${
                  isSelected || isResizing ? 'opacity-100 bg-gradient-to-r from-neutral-100/20 to-transparent' : 'opacity-0 group-hover:opacity-100'
                }`}
                onMouseDown={(e) => handleResizeMouseDown(e, clip, 'left')}
                onClick={handleClipClick}
              >
                <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gradient-to-b from-neutral-100/60 to-neutral-100/30 rounded-full"></div>
              </div>
              
              {/* Enhanced Clip Content */}
              <div className="flex items-center justify-between h-full px-3 overflow-hidden">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full ${colors.accent} flex-shrink-0 shadow-inner ${clip.isUploading ? 'animate-pulse' : ''}`}>
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-neutral-100/40 to-transparent"></div>
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <span className={`text-xs font-semibold ${colors.text} truncate block leading-tight`}>
                      {clip.name || 'Audio Clip'}
                      {clip.isUploading && clip.uploadProgress >= 0 && (
                        <span className="text-[10px] text-neutral-400 ml-1">
                          ({Math.round(clip.uploadProgress)}%)
                        </span>
                      )}
                      {clip.uploadProgress === -1 && (
                        <span className="text-[10px] text-red-400 ml-1">
                          (Upload Failed)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {clip.isUploading && clip.uploadProgress >= 0 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-600/50 rounded-t-lg overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-300"
                    style={{ width: `${clip.uploadProgress}%` }}
                  ></div>
                </div>
              )}
              
              {/* Upload Failed Indicator */}
              {clip.uploadProgress === -1 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/60 rounded-t-lg"></div>
              )}

              {/* Elegant waveform visualization */}
              <div className="absolute bottom-0.5 left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-neutral-100/20 to-transparent rounded-full overflow-hidden">
                <div className={`h-full ${colors.accent} rounded-full opacity-60`} style={{ width: '75%' }}></div>
              </div>
              
              {/* Enhanced Right resize handle */}
              <div 
                className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize transition-all duration-200 hover:bg-gradient-to-l hover:from-neutral-100/30 hover:to-transparent rounded-r-lg ${
                  isSelected || isResizing ? 'opacity-100 bg-gradient-to-l from-neutral-100/20 to-transparent' : 'opacity-0 group-hover:opacity-100'
                }`}
                onMouseDown={(e) => handleResizeMouseDown(e, clip, 'right')}
                onClick={handleClipClick}
              >
                <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gradient-to-b from-neutral-100/60 to-neutral-100/30 rounded-full"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Track;