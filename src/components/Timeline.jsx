// Updated Timeline.jsx with Redux integration
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Track from './Track';
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

const BASE_PIXELS_PER_SECOND = 80;

const Timeline = ({ onSeek, scrollContainerRef: parentScrollRef, projectId }) => {
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

    const rect = e.currentTarget.getBoundingClientRect();
    const scrollLeft = activeScrollRef.current?.scrollLeft || 0;
    const x = e.clientX - rect.left + scrollLeft;
    const newTime = Math.max(0, Math.min(x / pixelsPerSecond, duration));
    onSeek(newTime);
  };

  const handlePlayheadDrag = (e) => {
    if (!isDragging) return;
    const container = activeScrollRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft;
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
          <span className="text-xs text-white/40 mt-1.5 font-mono">{i}s</span>
        </div>
      );
    }
    return markers;
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

  // Empty state component
  const EmptyState = () => (
    <div 
      className={`flex flex-col items-center justify-center min-h-[300px] p-8 border-2 border-dashed rounded-lg transition-all duration-200 ${
        isDragOver 
          ? 'border-primary-400 bg-primary-500/10' 
          : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-white/80 mb-2">
          Drop Audio Files Here
        </h3>
        
        <p className="text-white/60 mb-4 max-w-md">
          Drag and drop your audio file to get started. Supported formats: MP3, WAV, M4A, and more.
        </p>
        
        <div className="text-sm text-white/40">
          <p>• Only audio files are supported</p>
          <p>• Drop 1 file at a time</p>
          <p>• File will be placed on the first audio track</p>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={timelineRef}>
      <div 
        className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30"
        ref={activeScrollRef}
      >
        {!hasAnyClips ? (
          <div className="p-4">
            <EmptyState />
          </div>
        ) : (
          <div 
            className="relative"
            style={{ width: timelineWidth + 21 }}
            onClick={handleTimelineClick}
          >
            {/* PLAYHEAD */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-white via-gray-300 to-white shadow-lg shadow-white/50 z-20 cursor-ew-resize"
              style={{ left: playheadPosition }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDragging(true);
              }}
            >
              <div className="absolute top-[0px] -left-[5px] w-3 h-3 bg-white border border-gray-300 rounded-full shadow-lg hover:scale-110 transition-transform duration-200"></div>
            </div>

            {/* RULER */}
            <div className="relative h-[30px] select-none backdrop-blur-md bg-white/5 border-b border-white/10">
              {renderTimeMarkers()}
            </div>
            
            {/* TRACKS */}
            <div className="relative max-h-60 overflow-y-auto">
              {tracks.map((track, index) => (
                <div key={track.id} className="border-b border-dashed border-white/20">
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
        )}
      </div>
    </div>
  );
};

export default Timeline;