// Professional Timeline with Catalyst Components
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Track from './Track';
import { Button } from './button';
import { Badge } from './badge';
import { 
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from './dropdown';
import { 
  setCurrentTime, 
  clearSelection, 
  addMultipleClipsToTrack, 
  setZoomLevel,
  updateClipAssetId,
  updateClipUploadProgress,
  markClipAsUploading
} from '../store/slices/tracksSlice';
import { assetService } from '../services/assetService';
import {
  PlayIcon,
  PauseIcon,
  MagnifyingGlassIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  EllipsisVerticalIcon,
  DocumentArrowUpIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/solid';

const BASE_PIXELS_PER_SECOND = 80;

const Timeline = ({ onSeek, scrollContainerRef: parentScrollRef, projectId, isPlaying, togglePlay, currentTime: videoCurrentTime }) => {
  const dispatch = useDispatch();
  const {
    tracks,
    currentTime,
    duration,
    zoomLevel,
    pixelsPerSecond,
    selectedClips
  } = useSelector(state => state.tracks);

  const [isDragging, setIsDragging] = useState(false);
  const [isZoomDragging, setIsZoomDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartZoom, setDragStartZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isDragOver, setIsDragOver] = useState(false);
  const timelineRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Use parent ref if provided, otherwise use local ref
  const activeScrollRef = parentScrollRef || scrollContainerRef;

  // Handle keyboard events for deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClips.size > 0) {
        e.preventDefault();
        // Deletion is handled in App.jsx
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedClips]);

  // Update container width when component mounts or resizes
  useEffect(() => {
    const updateContainerWidth = () => {
      if (activeScrollRef.current) {
        const newWidth = activeScrollRef.current.clientWidth;
        if (newWidth > 0) {
          setContainerWidth(newWidth);
        }
      }
    };

    const timer = setTimeout(updateContainerWidth, 0);
    updateContainerWidth();
    
    window.addEventListener('resize', updateContainerWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateContainerWidth);
    };
  }, [activeScrollRef]);

  useEffect(() => {
    if (activeScrollRef.current) {
      const newWidth = activeScrollRef.current.clientWidth;
      if (newWidth > 0) {
        setContainerWidth(newWidth);
      }
    }
  }, [activeScrollRef.current]);

  // Calculate timeline width
  const timelineWidth = Math.max(containerWidth, duration * pixelsPerSecond);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    if (activeScrollRef.current && currentTime >= 0) {
      const playheadPosition = currentTime * pixelsPerSecond;
      const containerWidth = activeScrollRef.current.clientWidth;
      const scrollLeft = activeScrollRef.current.scrollLeft;
      
      const margin = 50;
      if (playheadPosition < scrollLeft + margin || playheadPosition > scrollLeft + containerWidth - margin) {
        const targetScroll = Math.max(0, playheadPosition - containerWidth / 2);
        
        activeScrollRef.current.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  }, [currentTime, pixelsPerSecond, activeScrollRef]);

  // Handle mouse events for playhead dragging and zoom
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        handlePlayheadDrag(e);
      } else if (isZoomDragging) {
        const deltaX = e.clientX - dragStartX;
        const zoomSensitivity = 0.01;
        const newZoom = Math.max(0.1, Math.min(5, dragStartZoom + (deltaX * zoomSensitivity)));
        dispatch(setZoomLevel(newZoom));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsZoomDragging(false);
    };

    if (isDragging || isZoomDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isZoomDragging, dragStartX, dragStartZoom, dispatch]);

  // Get clips for a specific track
  const getTrackById = (trackId) => {
    return tracks.find(track => track.id === trackId);
  };

  // Clear selection when clicking on timeline background
  const handleTimelineClick = (e) => {
    if (e.shiftKey) {
      setIsZoomDragging(true);
      setDragStartX(e.clientX);
      setDragStartZoom(zoomLevel);
      return;
    }

    // Clear selection when clicking on timeline
    dispatch(clearSelection());

    // Use the scroll container's rect for accurate positioning
    const container = activeScrollRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft; // Calculate position relative to scrolled content
    const newTime = Math.max(0, Math.min(x / pixelsPerSecond, duration));
    onSeek(newTime);
  };

  const handlePlayheadDrag = (e) => {
    if (!isDragging) return;
    const container = activeScrollRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft; // No offset needed since labels are outside scroll container
    const newTime = Math.max(0, Math.min(x / pixelsPerSecond, duration));
    onSeek(newTime);
  };

  const renderTimeMarkers = () => {
    const markers = [];
    let interval = 1;
    if (zoomLevel < 0.5) interval = 5;
    else if (zoomLevel < 0.25) interval = 10;
    else if (zoomLevel > 2) interval = 0.5;
    
    for (let i = 0; i <= Math.ceil(duration); i += interval) {
      markers.push(
        <div key={i} className="absolute flex flex-col items-center" style={{ left: `${(i * pixelsPerSecond)}px` }}>
          <span className="text-xs text-zinc-400 mt-1.5 font-mono">{i}s</span>
        </div>
      );
    }
    return markers;
  };

  // Zoom controls
  const handleZoomIn = () => {
    dispatch(setZoomLevel(Math.min(5, zoomLevel * 1.2)));
  };

  const handleZoomOut = () => {
    dispatch(setZoomLevel(Math.max(0.1, zoomLevel / 1.2)));
  };

  const handleFitView = () => {
    const timelineContainer = activeScrollRef.current;
    if (timelineContainer && duration > 0) {
      const containerWidth = timelineContainer.clientWidth;
      const newZoom = containerWidth / (duration * 80);
      dispatch(setZoomLevel(Math.max(0.1, Math.min(5, newZoom))));
    }
  };

  // Handle file drop for audio files only
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    // Only allow 1 file at a time
    if (files.length > 1) {
      alert('Please drop only 1 audio file at a time');
      return;
    }
    
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length === 0) {
      alert('Please drop only audio files');
      return;
    }

    // Process the single audio file
    const file = audioFiles[0];
    
    try {
      // Generate temporary asset ID
      const tempAssetId = assetService.generateTempAssetId();
      
      // Process audio file to get metadata
      const audioMetadata = await assetService.processAudioFile(file);
      
      // Create temporary asset reference
      const tempAsset = assetService.createTempAssetReference(file, tempAssetId);
      
      // Create clip with asset reference
      const clipId = Date.now().toString();
      const newClip = {
        id: clipId,
        name: file.name,
        assetId: tempAssetId, // Reference to asset instead of direct file
        start: 0,
        startTime: 0,
        duration: audioMetadata.duration,
        audioOffset: 0,
        // Keep file reference temporarily for playback until upload completes
        file: file,
        isUploading: true,
        uploadProgress: 0
      };

      // Add to first audio track
      const audioTrack = tracks.find(track => track.trackType === 'audio1');
      if (audioTrack) {
        dispatch(addMultipleClipsToTrack({ 
          trackId: audioTrack.id, 
          clips: [newClip] 
        }));
      }
      
      // Reset playhead to 0
      onSeek(0);
      
      // Start uploading asset in the background
      try {
        dispatch(markClipAsUploading({ clipId }));
        
        const uploadResponse = await assetService.uploadAudioAsset(
          projectId,
          file, 
          tempAssetId,
          (progress) => {
            console.log(`Upload progress: ${progress}%`);
            dispatch(updateClipUploadProgress({ clipId, progress }));
          }
        );
        
        // console.log('Asset uploaded successfully:', uploadResponse);
        
        // Update clip with actual asset ID from server response
        if (uploadResponse && uploadResponse.asset) {
          dispatch(updateClipAssetId({ 
            clipId, 
            assetId: uploadResponse.asset.id,
            serverAssetData: uploadResponse.asset
          }));
        }
        
      } catch (uploadError) {
        console.error('Failed to upload asset:', uploadError);
        alert('Failed to upload audio file. The clip may not play properly.');
        // Mark upload as failed but keep the clip with file reference
        dispatch(updateClipUploadProgress({ clipId, progress: -1 })); // -1 indicates error
      }
      
    } catch (error) {
      console.error('Error processing audio file:', error);
      alert('Error processing audio file. Please try a different file.');
    }
  }, [tracks, dispatch, onSeek]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const playheadPosition = currentTime * pixelsPerSecond;
  
  // Check if there are any clips anywhere
  const hasAnyClips = tracks.some(track => track.clips && track.clips.length > 0);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Empty state component
  const EmptyState = () => (
    <div className="max-w-4xl mx-auto">
      <div 
        className={`flex flex-col items-center justify-center min-w-[600px] min-h-[300px] border-2 border-dashed rounded-lg transition-all duration-200 ${
          isDragOver 
            ? 'border-blue-400 bg-blue-500/10' 
            : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center p-8">
          <div className="mb-6">
            <DocumentArrowUpIcon className="w-16 h-16 mx-auto text-zinc-400" />
          </div>
          
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            Get Started with Your Timeline
          </h2>
          
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
            Drag and drop your audio files to begin creating your project.
          </p>
          
          <div className="flex justify-center">
            <div className="gap-4 text-left max-w-md">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MusicalNoteIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">Audio Files</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">MP3, WAV, M4A</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
      {/* Timeline Header - Only show when there are clips */}
      

      {/* Timeline Content */}
      <div ref={timelineRef} className="flex-1 overflow-hidden">
        {!hasAnyClips ? (
          <div className="h-full flex items-center justify-center p-8">
            <EmptyState />
          </div>
        ) : (
          <div className="h-full flex">
            {/* Fixed Track Labels Column - Outside scroll container */}
            <div className="w-32 flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700 flex flex-col">
              {/* Ruler Header */}
              <div className="h-8 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700"></div>
              
              {/* Track Labels */}
              <div className="flex-1 overflow-y-auto">
                {tracks.map((track, index) => (
                  <div key={track.id} className="h-12 border-b border-zinc-200 dark:border-zinc-700/50 last:border-b-0 bg-zinc-100 dark:bg-zinc-800 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {track.trackType === 'video' ? (
                        <VideoCameraIcon className="w-4 h-4 text-blue-500" />
                      ) : (
                        <MusicalNoteIcon className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {track.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable Timeline Content */}
            <div 
              className="flex-1 overflow-x-auto overflow-y-hidden"
              ref={activeScrollRef}
            >
              <div 
                className="relative h-full"
                style={{ width: timelineWidth }}
                onClick={handleTimelineClick}
              >
                {/* PLAYHEAD */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-lg shadow-red-500/50 z-20 cursor-ew-resize"
                  style={{ left: playheadPosition }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                >
                  <div className="absolute top-0 -left-[5px] w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-lg transition-transform duration-200"></div>
                </div>

                {/* RULER */}
                <div className="relative h-8 select-none bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                  {/* Time markers */}
                  <div className="relative">
                    {renderTimeMarkers()}
                  </div>
                </div>
                
                {/* TRACKS */}
                <div className="relative h-[calc(100%-2rem)] overflow-y-auto">
                  {tracks.map((track, index) => (
                    <div key={track.id} className="relative border-b border-zinc-200 dark:border-zinc-700/50 last:border-b-0 h-12">
                      <Track 
                        trackId={track.id}
                        label={track.label} 
                        trackType={track.trackType}
                        clips={track.clips}
                        pixelsPerSecond={pixelsPerSecond}
                        duration={duration}
                        hasAnyClips={hasAnyClips}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;