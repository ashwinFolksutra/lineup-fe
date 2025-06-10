// VideoTrack.jsx - Specialized component for video tracks with Glass Morphism Design
import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateClip, addClipToTrack, selectClip } from '../store/slices/tracksSlice';
import { setActiveClipContext } from '../store/slices/clipSelectionSlice';
import ClipInfoModal from './ClipInfoModal';

const VideoTrack = ({ 
  trackId,
  label, 
  clips, 
  pixelsPerSecond, 
  duration,
  hasAnyClips
}) => {
  const dispatch = useDispatch();
  const selectedClips = useSelector(state => state.tracks.selectedClips);
  const allTracks = useSelector(state => state.tracks.tracks);
  const trackContentRef = useRef(null);
  const [draggedClip, setDraggedClip] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [resizeState, setResizeState] = useState(null);
  const [tempClipStyles, setTempClipStyles] = useState(new Map());
  const [showClipModal, setShowClipModal] = useState(false);
  const [selectedClipData, setSelectedClipData] = useState(null);
  
  // Debug logging for selection changes
  // useEffect(() => {
  //   console.log('VideoTrack selectedClips changed:', selectedClips);
  // }, [selectedClips]);

  // Clip types
  const CLIP_TYPES = {
    EMPTY: 'empty',
    IMAGE: 'image', 
    VIDEO: 'video'
  };

  // Calculate total duration of all audio clips across all audio tracks
  const calculateTotalAudioDuration = () => {
    // console.log(allTracks)
    const audioTracks = allTracks.filter(track => 
      track.trackType === 'audio1' || track.trackType === 'audio2' || track.trackType === 'audio'
    );
    
    let maxEndTime = 0;
    audioTracks.forEach(track => {
      if (track.clips && track.clips.length > 0) {
        track.clips.forEach(clip => {
          const clipEnd = (clip.start || clip.startTime || 0) + (clip.duration || 0);
          maxEndTime = Math.max(maxEndTime, clipEnd);
        });
      }
    });
    
    return maxEndTime;
  };

  // Handle creating placeholder clips
  const handleCreatePlaceholders = () => {
    // Get total audio duration
    const totalAudioDuration = calculateTotalAudioDuration();
    
    if (totalAudioDuration === 0) {
      alert('No audio clips found. Please add audio clips first to determine the total duration.');
      return;
    }

    // Ask user for shot duration
    const shotDurationInput = prompt(
      `Total audio duration: ${totalAudioDuration.toFixed(1)} seconds\n\nEnter duration for each shot in seconds:`,
      '5'
    );

    if (shotDurationInput === null) {
      return; // User cancelled
    }

    const shotDuration = parseFloat(shotDurationInput);
    
    if (isNaN(shotDuration) || shotDuration <= 0) {
      alert('Please enter a valid positive number for shot duration.');
      return;
    }

    // Calculate number of placeholders needed
    const numberOfPlaceholders = Math.ceil(totalAudioDuration / shotDuration);
    
    // Confirm with user
    const confirmMessage = `This will create ${numberOfPlaceholders} placeholder clips of ${shotDuration} seconds each.\n\nTotal duration: ${(numberOfPlaceholders * shotDuration).toFixed(1)} seconds\nAudio duration: ${totalAudioDuration.toFixed(1)} seconds\n\nProceed?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    // Create placeholder clips
    const placeholderClips = [];
    for (let i = 0; i < numberOfPlaceholders; i++) {
      const startTime = i * shotDuration;
      let clipDuration = shotDuration;
      
      // Adjust the last placeholder's duration to match the total audio duration
      if (i === numberOfPlaceholders - 1) {
        const remainingDuration = totalAudioDuration - startTime;
        clipDuration = Math.max(0.1, remainingDuration); // Ensure minimum duration of 0.1 seconds
      }
      
      const placeholderClip = {
        id: Date.now() + i,
        name: `Shot ${i + 1}`,
        start: startTime,
        startTime: startTime,
        duration: clipDuration,
        clipType: CLIP_TYPES.EMPTY,
        file: null,
        thumbnail: null,
      };
      placeholderClips.push(placeholderClip);
    }

    // Add all placeholder clips to the track
    placeholderClips.forEach(clip => {
      dispatch(addClipToTrack({ trackId, clip }));
    });
  };

  // Handle mouse events for clip dragging and resizing
  useEffect(() => {
    let animationFrameId = null;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let trackRect = null;
    
    const findValidPosition = (requestedStartTime, clipId, clipDuration) => {
      const otherClips = clips.filter(clip => clip.id !== clipId);
      
      let candidateStart = Math.max(0, requestedStartTime);
      const candidateEnd = candidateStart + clipDuration;
      
      // Check for collisions and constrain position to prevent overlap
      for (const clip of otherClips) {
        const clipStart = clip.start || clip.startTime || 0;
        const clipEnd = clipStart + (clip.duration || 5);
        
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

    const updateDragPosition = () => {
      if (!draggedClip || !trackContentRef.current) return;
      
      const rect = trackRect || trackContentRef.current.getBoundingClientRect();
      const x = lastMouseX - rect.left - dragOffset;
      const rawStartTime = Math.max(0, x / pixelsPerSecond);
      
      // Use collision detection to find a valid position
      const clipDuration = draggedClip.duration || 5;
      const newStartTime = findValidPosition(rawStartTime, draggedClip.id, clipDuration);
      const newLeft = newStartTime * pixelsPerSecond;
      
      const clipElement = trackContentRef.current.querySelector(`[data-clip-id="${draggedClip.id}"]`);
      if (clipElement) {
        // Use direct left positioning for accuracy - transforms can cause precision issues
        clipElement.style.left = `${newLeft}px`;
        clipElement.style.transition = 'none';
        clipElement.style.willChange = 'transform';
        
        setTempClipStyles(prev => new Map(prev.set(draggedClip.id, {
          start: newStartTime,
          startTime: newStartTime,
          left: newLeft
        })));
      }
    };

    const updateResizePosition = () => {
      if (!resizeState || !trackContentRef.current) return;
      
      const rect = trackRect || trackContentRef.current.getBoundingClientRect();
      const x = lastMouseX - rect.left;
      const timePosition = x / pixelsPerSecond;
      
      const clipElement = trackContentRef.current.querySelector(`[data-clip-id="${resizeState.clipId}"]`);
      if (!clipElement) return;
      
      if (resizeState.edge === 'right') {
        const newDuration = Math.max(0.1, timePosition - resizeState.originalStart);
        
        // Check for collision with clips to the right - but only if we're expanding
        let finalDuration = newDuration;
        
        // Only do collision detection if we're expanding (new duration > original)
        if (newDuration > resizeState.originalDuration) {
          const otherClips = clips.filter(clip => clip.id !== resizeState.clipId);
          
          // Find the nearest clip to the right
          let maxAllowedDuration = newDuration;
          
          for (const clip of otherClips) {
            const clipStart = clip.start || clip.startTime || 0;
            if (clipStart > resizeState.originalStart) {
              const allowedDuration = clipStart - resizeState.originalStart;
              if (allowedDuration < maxAllowedDuration) {
                maxAllowedDuration = allowedDuration;
              }
            }
          }
          
          finalDuration = Math.max(0.1, Math.min(newDuration, maxAllowedDuration));
        } else {
          // When shrinking, allow it without collision check
          finalDuration = newDuration;
        }
        
        // Use direct width for accuracy
        const newWidth = Math.max(10, finalDuration * pixelsPerSecond);
        clipElement.style.width = `${newWidth}px`;
        clipElement.style.transition = 'none';
        clipElement.style.willChange = 'transform';
        
        setTempClipStyles(prev => new Map(prev.set(resizeState.clipId, {
          duration: finalDuration,
          width: newWidth
        })));
      } else if (resizeState.edge === 'left') {
        const maxStart = resizeState.originalStart + resizeState.originalDuration - 0.1;
        let newStart = Math.max(0, Math.min(timePosition, maxStart));
        
        // Check for collision with clips to the left - but only if we're expanding left
        let finalStart = newStart;
        
        // Only do collision detection if we're expanding left (new start < original start)
        if (newStart < resizeState.originalStart) {
          const otherClips = clips.filter(clip => clip.id !== resizeState.clipId);
          
          // Find the nearest clip to the left
          let minAllowedStart = 0;
          
          for (const clip of otherClips) {
            const clipStart = clip.start || clip.startTime || 0;
            const clipEnd = clipStart + (clip.duration || 5);
            if (clipEnd <= resizeState.originalStart) {
              if (clipEnd > minAllowedStart) {
                minAllowedStart = clipEnd;
              }
            }
          }
          
          finalStart = Math.max(minAllowedStart, Math.min(newStart, maxStart));
        } else {
          // When shrinking from left (moving start to the right), allow it without collision check
          finalStart = newStart;
        }
        
        const newDuration = resizeState.originalStart + resizeState.originalDuration - finalStart;
        const newLeft = finalStart * pixelsPerSecond;
        const newWidth = Math.max(10, newDuration * pixelsPerSecond);
        
        // Use direct positioning and width for accuracy
        clipElement.style.left = `${newLeft}px`;
        clipElement.style.width = `${newWidth}px`;
        clipElement.style.transition = 'none';
        clipElement.style.willChange = 'transform';
        
        setTempClipStyles(prev => new Map(prev.set(resizeState.clipId, {
          start: finalStart,
          startTime: finalStart,
          duration: newDuration,
          left: newLeft,
          width: newWidth
        })));
      }
    };

    const handleMouseMove = (e) => {
      // Cache mouse position to avoid repeated access
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      
      if (draggedClip || resizeState) {
        e.preventDefault();
        e.stopPropagation();
        
        // Cancel previous animation frame and schedule new one
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        
        animationFrameId = requestAnimationFrame(() => {
          if (draggedClip) {
            updateDragPosition();
          } else if (resizeState) {
            updateResizePosition();
          }
         });
       }
     };

    const handleMouseUp = (e) => {
      // Cancel any pending animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      
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
            clipElement.style.transition = '';
            clipElement.style.willChange = '';
            // Position is already set correctly during drag
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
          
          // Re-enable transitions
          const clipElement = trackContentRef.current.querySelector(`[data-clip-id="${resizeState.clipId}"]`);
          if (clipElement) {
            clipElement.style.transition = '';
            clipElement.style.willChange = '';
            // Position and dimensions are already set correctly during resize
          }
          
          dispatch(updateClip({ trackId, clipId: resizeState.clipId, updates }));
          
          setTempClipStyles(prev => {
            const newMap = new Map(prev);
            newMap.delete(resizeState.clipId);
            return newMap;
          });
        }
      }
      
      // Reset cached rect
      trackRect = null;
      
      setDraggedClip(null);
      setDragOffset(0);
      setResizeState(null);
    };

    // Cache track rect when drag/resize starts for better performance
    if ((draggedClip || resizeState) && !trackRect) {
      trackRect = trackContentRef.current?.getBoundingClientRect();
    }

    if (draggedClip || resizeState) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      document.body.style.userSelect = 'none';
      document.body.style.cursor = draggedClip ? 'grabbing' : resizeState ? 'ew-resize' : '';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [draggedClip, dragOffset, resizeState, pixelsPerSecond, tempClipStyles, dispatch, trackId, clips]);

  const handleFileDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const mediaFiles = files.filter(file => 
      file.type.startsWith('video/') || file.type.startsWith('image/')
    );
    
    if (mediaFiles.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const startTime = Math.max(0, x / pixelsPerSecond);
      
      const newClips = await Promise.all(
        mediaFiles.map(async (file, index) => {
          const isVideo = file.type.startsWith('video/');
          const duration = isVideo ? await getVideoDuration(file) : 5; // 5 seconds default for images
          
          return {
            id: Date.now() + index,
            name: file.name,
            start: startTime + (index * 2),
            startTime: startTime + (index * 2),
            duration: duration,
            file: file,
            clipType: isVideo ? CLIP_TYPES.VIDEO : CLIP_TYPES.IMAGE,
            thumbnail: null, // Will be generated
          };
        })
      );
      
      newClips.forEach(clip => {
        dispatch(addClipToTrack({ trackId, clip }));
      });
    }
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.addEventListener('loadedmetadata', () => {
        resolve(video.duration || 10);
      });
      video.addEventListener('error', () => {
        resolve(10);
      });
      video.src = URL.createObjectURL(file);
    });
  };

  const handleClipClick = (e, clip) => {
    console.log('Clip clicked:', clip.id, clip.clipType, clip.name);
    e.preventDefault();
    e.stopPropagation();
    
    // Set active clip context for the clicked clip
    dispatch(setActiveClipContext({
      clipId: clip.id,
      trackId: trackId,
      clipType: clip.clipType,
      clipData: {
        name: clip.name,
        start: clip.start || clip.startTime || 0,
        duration: clip.duration || 5,
        file: clip.file,
        thumbnail: clip.thumbnail,
        // Add more context data as needed
        properties: {
          width: clip.width,
          height: clip.height,
          format: clip.file?.type,
          size: clip.file?.size,
        }
      }
    }));
    
    // Also handle selection (single selection only)
    console.log('Dispatching selectClip with clipId:', clip.id);
    dispatch(selectClip({ clipId: clip.id }));

    console.log('Showing clip modal');
    setShowClipModal(true);
    setSelectedClipData(clip);
  };

  const handleClipMouseDown = (e, clip) => {
    if (e.button !== 0) return;
    
    console.log('Clip mouse down:', clip.id, clip.clipType);
    e.preventDefault();
    e.stopPropagation();
    
    // Don't select here - let handleClipClick handle selection
    // Only set up dragging
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    setDraggedClip(clip);
    setDragOffset(offsetX);
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
      originalDuration: clip.duration || 5,
    });
  };

  const handleTrackClick = (e) => {
    // Only handle left mouse clicks, ignore right clicks
    if (e.button !== undefined && e.button !== 0) return;
    
    console.log('Track clicked, target:', e.target, 'currentTarget:', e.currentTarget);
    console.log('draggedClip:', draggedClip, 'resizeState:', resizeState);
    if (e.target === e.currentTarget && !draggedClip && !resizeState) {
      console.log('Clearing selection due to track click');
      dispatch(selectClip({ clipId: null }));
    }
  };

  const renderClipContent = (clip) => {
    const { clipType } = clip;
    
    switch (clipType) {
      case CLIP_TYPES.EMPTY:
        return (
          <div className="cursor-pointer flex items-center justify-center h-full w-full pointer-events-auto">
            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-neutral-300/40 hover:border-neutral-300/60 flex items-center justify-center pointer-events-none">
              <span className="text-neutral-400 text-xs pointer-events-none">+</span>
            </div>
          </div>
        );
      
      case CLIP_TYPES.IMAGE:
        return (
          <div className="flex items-center gap-2 h-full px-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-400/60 to-blue-600/80 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">🖼️</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-neutral-100 truncate block">
                {clip.name || 'Image Clip'}
              </span>
            </div>
          </div>
        );
      
      case CLIP_TYPES.VIDEO:
        return (
          <div className="flex items-center gap-2 h-full px-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-red-400/60 to-red-600/80 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">▶️</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-neutral-100 truncate block">
                {clip.name || 'Video Clip'}
              </span>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <span className="text-neutral-400 text-xs">Unknown</span>
          </div>
        );
    }
  };

  const getClipColors = (clipType, isSelected) => {
    const baseColors = {
      [CLIP_TYPES.EMPTY]: {
        bg: 'from-neutral-600/20 to-neutral-700/30',
        bgHover: 'from-neutral-500/25 to-neutral-600/35',
        border: 'border-neutral-400/30',
        borderHover: 'border-neutral-300/50',
      },
      [CLIP_TYPES.IMAGE]: {
        bg: 'from-blue-600/25 to-blue-700/35',
        bgHover: 'from-blue-500/30 to-blue-600/40',
        border: 'border-blue-400/40',
        borderHover: 'border-blue-300/60',
      },
      [CLIP_TYPES.VIDEO]: {
        bg: 'from-red-600/25 to-red-700/35',
        bgHover: 'from-red-500/30 to-red-600/40',
        border: 'border-red-400/40',
        borderHover: 'border-red-300/60',
      }
    };

    return baseColors[clipType] || baseColors[CLIP_TYPES.EMPTY];
  };

  // Handle right-click to automatically fill gaps
  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't fill gaps if we're dragging or resizing
    if (draggedClip || resizeState) {
      console.log('Gap filling blocked - dragging or resizing');
      return;
    }
    
    // Don't fill gaps if right-clicking on a clip
    if (e.target.closest('[data-clip-id]')) {
      console.log('Gap filling blocked - clicked on existing clip');
      return;
    }
    
    // Only allow gap filling if there are already clips/placeholders on the track
    if (clips.length === 0) {
      console.log('Gap filling blocked - no existing clips. Use "Add Placeholders" button first.');
      return;
    }
    
    const rect = trackContentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = Math.max(0, x / pixelsPerSecond);
    
    console.log('Analyzing gap at time position:', clickTime);
    
    // Sort clips by start time for gap detection
    const sortedClips = [...clips].sort((a, b) => 
      (a.start || a.startTime || 0) - (b.start || b.startTime || 0)
    );
    
    // console.log('Checking for gap at time:', clickTime);
    // console.log('Sorted clips:', sortedClips.map(c => ({
    //   id: c.id,
    //   start: c.start || c.startTime || 0,
    //   end: (c.start || c.startTime || 0) + (c.duration || 5),
    //   name: c.name
    // })));
    
    // Enhanced gap detection with better tolerance
    const tolerance = 0.01; // Reduced from 0.05 to 0.01 for more precise detection
    let gapStart = 0;
    let gapEnd = Infinity;
    let foundGap = false;
    
    // Check if click is before the first clip
    if (sortedClips.length === 0 || clickTime < (sortedClips[0].start || sortedClips[0].startTime || 0) - tolerance) {
      gapStart = 0;
      gapEnd = sortedClips.length > 0 ? (sortedClips[0].start || sortedClips[0].startTime || 0) : Infinity;
      foundGap = true;
      console.log('Gap found before first clip:', { gapStart, gapEnd });
    } else {
      // Check gaps between clips
      for (let i = 0; i < sortedClips.length - 1; i++) {
        const currentClip = sortedClips[i];
        const nextClip = sortedClips[i + 1];
        
        const currentEnd = (currentClip.start || currentClip.startTime || 0) + (currentClip.duration || 5);
        const nextStart = nextClip.start || nextClip.startTime || 0;
        
        // Check if click is in the gap between these clips (more permissive)
        if (clickTime >= currentEnd + tolerance && clickTime <= nextStart - tolerance) {
          gapStart = currentEnd;
          gapEnd = nextStart;
          foundGap = true;
          // console.log(`Gap found between ${currentClip.name} and ${nextClip.name}:`, { gapStart, gapEnd });
          break;
        }
      }
      
      // Check if click is after the last clip
      if (!foundGap && sortedClips.length > 0) {
        const lastClip = sortedClips[sortedClips.length - 1];
        const lastEnd = (lastClip.start || lastClip.startTime || 0) + (lastClip.duration || 5);
        
        if (clickTime >= lastEnd + tolerance) {
          gapStart = lastEnd;
          gapEnd = Infinity;
          foundGap = true;
          console.log('Gap found after last clip:', { gapStart, gapEnd });
        }
      }
    }
    
    // If no gap found yet, but we have an empty track, allow placeholder creation
    if (!foundGap && sortedClips.length === 0) {
      gapStart = 0;
      gapEnd = Infinity;
      foundGap = true;
      console.log('Empty track - allowing placeholder creation');
    }
    
    // Final fallback: if right-clicking in empty space, create a small placeholder at click position
    if (!foundGap) {
      console.log('No specific gap found - creating placeholder at click position');
      gapStart = Math.max(0, clickTime - 0.25); // Start 0.25s before click
      gapEnd = clickTime + 0.25; // End 0.25s after click
      foundGap = true;
    }
    
    if (!foundGap) {
      console.log('No gap found at click position - click might be on an existing clip');
      return;
    }
    
    // Calculate placeholder position and duration with improved logic
    const minPlaceholderDuration = 0.5; // Minimum duration for very small gaps
    const maxGapSize = gapEnd === Infinity ? 10.0 : gapEnd - gapStart; // Increased default size for infinite gaps
    
    // Only create placeholder if gap is large enough (more permissive)
    if (maxGapSize < 0.1) { // Very small minimum threshold
      console.log('Gap too small for placeholder:', { gapSize: maxGapSize, required: 0.1 });
      return;
    }
    
    // Fill the entire available gap
    let placeholderStart = gapStart;
    let placeholderDuration = maxGapSize; // Fill the entire gap by default
    
    // For infinite gaps (after last clip or empty track), use a reasonable default
    if (gapEnd === Infinity) {
      // Calculate a reasonable duration based on existing content or default
      const totalDuration = calculateTotalAudioDuration();
      if (totalDuration > 0) {
        // If we have audio, extend to match or add a reasonable amount
        placeholderDuration = Math.max(5.0, totalDuration - gapStart);
      } else {
        // No audio reference, use a default duration
        placeholderDuration = 10.0;
      }
    }
    
    // Ensure minimum duration
    placeholderDuration = Math.max(minPlaceholderDuration, placeholderDuration);
    
    // console.log('Creating placeholder:', { 
    //   start: placeholderStart, 
    //   duration: placeholderDuration,
    //   gap: { start: gapStart, end: gapEnd, size: maxGapSize }
    // });
    
    // Create placeholder that exactly fills the gap
    const placeholderClip = {
      id: Date.now(),
      name: `Gap ${placeholderStart.toFixed(1)}s-${(placeholderStart + placeholderDuration).toFixed(1)}s`,
      start: placeholderStart,
      startTime: placeholderStart,
      duration: placeholderDuration,
      clipType: CLIP_TYPES.EMPTY,
      file: null,
      thumbnail: null,
    };
    
    // console.log('Creating gap-filling placeholder:', placeholderClip);
    dispatch(addClipToTrack({ trackId, clip: placeholderClip }));
  };

  return (
    <div className="relative h-12 backdrop-blur-md bg-gradient-to-r from-surface-800/30 via-surface-700/20 to-surface-800/30 border-b border-neutral-200/10 hover:bg-gradient-to-r hover:from-surface-700/40 hover:via-surface-600/30 hover:to-surface-700/40 transition-all duration-300">
      <div 
        className="h-full relative group"
        ref={trackContentRef}
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={handleTrackClick}
        onContextMenu={handleRightClick}
      >

        {/* Enhanced Track Label with Create Placeholders Button */}
        {clips.length == 0 && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-3">
            {/* Enhanced Create Placeholders Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreatePlaceholders}
                className="group relative overflow-hidden backdrop-blur-md bg-gradient-to-r from-emerald-500/20 to-emerald-600/30 hover:from-emerald-400/30 hover:to-emerald-500/40 border border-emerald-400/30 hover:border-emerald-300/50 rounded-lg px-3 py-1.5 transition-all duration-300 shadow-glass hover:shadow-glass-lg hover:scale-105 active:scale-95"
                title="Generate placeholder clips based on audio duration"
              >
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/10 to-emerald-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative flex items-center gap-2">
                  {/* Icon */}
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-emerald-200 group-hover:text-emerald-100 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  
                  {/* Text */}
                  <span className="text-xs font-medium text-emerald-100 group-hover:text-white transition-colors duration-200">
                    Add Placeholders
                  </span>
                </div>
                
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              </button>
              
              {/* Help Text */}
              {/* <div className="hidden sm:block">
                <span className="text-xs text-neutral-400/70">
                  Right-click track to add individual clips
                </span>
              </div> */}
            </div>
          </div>
        )}
        
        {/* Video Clips */}
        {clips.map(clip => {
          const startPos = (clip.start !== undefined ? clip.start : clip.startTime || 0) * pixelsPerSecond;
          const clipWidth = (clip.duration || 5) * pixelsPerSecond;
          const isSelected = selectedClips === clip.id;
          const isDragging = draggedClip && draggedClip.id === clip.id;
          const isResizing = resizeState && resizeState.clipId === clip.id;
          
          const tempStyle = tempClipStyles.get(clip.id);
          const finalLeft = tempStyle?.left !== undefined ? tempStyle.left : (isNaN(startPos) ? 0 : startPos);
          const finalWidth = tempStyle?.width !== undefined ? tempStyle.width : (isNaN(clipWidth) ? 120 : clipWidth);
          
          const colors = getClipColors(clip.clipType, isSelected);
          
          return (
            <div
              key={clip.id}
              data-clip-id={clip.id}
              className={`absolute top-1 bottom-1 cursor-grab select-none group backdrop-blur-lg bg-gradient-to-r ${colors.bg} hover:${colors.bgHover} ${colors.border} hover:${colors.borderHover} border rounded-lg hover:z-10 shadow-glass hover:shadow-glass-lg transition-all duration-300 ${
                isSelected ? `ring-2 ring-primary-400/60 shadow-glow bg-gradient-to-r ${colors.bgHover}` : ''
              } ${isDragging ? 'cursor-grabbing z-20' : ''} ${isResizing ? 'z-20 ring-2 ring-accent-400/60 shadow-glow' : ''}`}
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
                className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize transition-all duration-200 hover:bg-gradient-to-r hover:from-neutral-100/30 hover:to-transparent rounded-l-lg ${
                  isSelected || isResizing ? 'opacity-100 bg-gradient-to-r from-neutral-100/20 to-transparent' : 'opacity-0 group-hover:opacity-100'
                }`}
                onMouseDown={(e) => handleResizeMouseDown(e, clip, 'left')}
              >
                <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gradient-to-b from-neutral-100/60 to-neutral-100/30 rounded-full"></div>
              </div>
              
              {/* Clip Content */}
              {renderClipContent(clip)}
              
              {/* Right resize handle */}
              <div 
                className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize transition-all duration-200 hover:bg-gradient-to-l hover:from-neutral-100/30 hover:to-transparent rounded-r-lg ${
                  isSelected || isResizing ? 'opacity-100 bg-gradient-to-l from-neutral-100/20 to-transparent' : 'opacity-0 group-hover:opacity-100'
                }`}
                onMouseDown={(e) => handleResizeMouseDown(e, clip, 'right')}
              >
                <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gradient-to-b from-neutral-100/60 to-neutral-100/30 rounded-full"></div>
              </div>
            </div>
          );
        })}
      </div>
      <ClipInfoModal
        isOpen={showClipModal}
        onClose={() => setShowClipModal(false)}
        clipData={selectedClipData}
      />
    </div>
  );
};

export default VideoTrack; 