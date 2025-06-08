// App.jsx
import Timeline from './components/Timeline';
import TransportBar from './components/TransportBar';
import VideoPreview from './components/VideoPreview';
import ClipInspector from './components/ClipInspector';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setCurrentTime, 
  setIsPlaying, 
  togglePlayback, 
  splitClip, 
  removeSelectedClips,
  setZoomLevel,
  calculateDuration
} from './store/slices/tracksSlice';

function App() {
  const videoRef = useRef();
  const intervalRef = useRef();
  const scrollContainerRef = useRef();
  
  // Redux state
  const dispatch = useDispatch();
  const {
    tracks,
    currentTime,
    duration,
    isPlaying,
    zoomLevel,
    selectedClips
  } = useSelector(state => state.tracks);
  
  // Local video state
  const [videoFile] = useState('/sample.mp4');
  const [playingAudios, setPlayingAudios] = useState(new Map());

  // Get all audio clips from Redux
  const audioClips = tracks.reduce((allClips, track) => {
    if (track.trackType === 'audio1' || track.trackType === 'audio2') {
      return [...allClips, ...track.clips.map(clip => ({ ...clip, trackType: track.trackType }))];
    }
    return allClips;
  }, []);

  // Handle split clip functionality
  const handleSplitClip = useCallback(() => {
    // Check if any clip is selected
    if (!selectedClips) {
      // Could show a toast or alert here, but for now just return silently
      console.log('No clip selected for splitting. Please select a clip first.');
      return;
    }
    
    dispatch(splitClip({ currentTime }));
  }, [currentTime, selectedClips, dispatch]);

  // Fit view functionality
  const handleFitView = () => {
    const timelineContainer = scrollContainerRef?.current || document.querySelector('[ref="scrollContainerRef"]');
    if (timelineContainer && duration > 0) {
      const containerWidth = timelineContainer.clientWidth;
      const newZoom = containerWidth / (duration * 80);
      dispatch(setZoomLevel(Math.max(0.1, Math.min(5, newZoom))));
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    dispatch(setZoomLevel(Math.min(5, zoomLevel * 1.2)));
  };

  const handleZoomOut = () => {
    dispatch(setZoomLevel(Math.max(0.1, zoomLevel / 1.2)));
  };

  // Audio sync functionality
  const handleAudioSync = useCallback((currentTime) => {
    audioClips.forEach(clip => {
      const clipStartTime = clip.start;
      const clipEndTime = clip.start + clip.duration;
      const audioElement = playingAudios.get(clip.id);
      
      if (currentTime >= clipStartTime && currentTime <= clipEndTime) {
        if (!audioElement || audioElement.paused) {
          playAudioClip(clip, currentTime - clipStartTime);
        }
      } else {
        if (audioElement && !audioElement.paused) {
          audioElement.pause();
        }
      }
    });
  }, [audioClips, playingAudios]);

  const playAudioClip = useCallback((clip, startOffset = 0) => {
    try {
      const audio = new Audio(URL.createObjectURL(clip.file));
      
      // Use audioOffset to determine where in the original file to start playing
      const audioFileOffset = (clip.audioOffset || 0) + startOffset;
      
      // Debug logging for audio playback
      console.log('Audio playback debug:', {
        clipName: clip.name,
        clipStart: clip.start || clip.startTime || 0,
        clipDuration: clip.duration,
        clipAudioOffset: clip.audioOffset || 0,
        startOffset: startOffset,
        finalAudioFileOffset: audioFileOffset
      });
      
      audio.currentTime = audioFileOffset;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Audio play failed:', error);
        });
      }
      
      setPlayingAudios(prev => {
        const newMap = new Map(prev);
        const prevAudio = newMap.get(clip.id);
        if (prevAudio) {
          prevAudio.pause();
        }
        newMap.set(clip.id, audio);
        return newMap;
      });
    } catch (error) {
      console.error('Error playing audio clip:', error);
    }
  }, []);

  const stopAllAudios = useCallback(() => {
    playingAudios.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
      }
    });
    setPlayingAudios(new Map());
  }, [playingAudios]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      const newTime = video.currentTime;
      dispatch(setCurrentTime(newTime));
    };
    
    const updateDuration = () => {
      // Calculate duration automatically
      dispatch(calculateDuration());
    };
    
    const handleEnded = () => {
      dispatch(setIsPlaying(false));
      stopAllAudios();
    };

    const handleError = () => {
      console.warn('Video failed to load, using timeline-only mode');
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [stopAllAudios, dispatch]);

  // Handle timeline-based playback
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        // Get the current time from Redux state
        const newTime = currentTime + 0.05;
        if (newTime >= duration) {
          dispatch(setIsPlaying(false));
          stopAllAudios();
          dispatch(setCurrentTime(0));
        } else {
          dispatch(setCurrentTime(newTime));
          handleAudioSync(newTime);
        }
      }, 50);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, duration, currentTime, handleAudioSync, stopAllAudios, dispatch]);

  const togglePlay = () => {
    const video = videoRef.current;
    
    if (isPlaying) {
      if (video && !video.error) {
        video.pause();
      }
      stopAllAudios();
      dispatch(setIsPlaying(false));
    } else {
      if (video && !video.error) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Video play failed, using audio-only mode:', error);
          });
        }
      }
      dispatch(setIsPlaying(true));
    }
  };

  const seekTo = (time) => {
    const video = videoRef.current;
    const clampedTime = Math.max(0, Math.min(time, duration));
    
    dispatch(setCurrentTime(clampedTime));
    
    if (video && !video.error) {
      video.currentTime = clampedTime;
    }
    
    if (isPlaying) {
      stopAllAudios();
      handleAudioSync(clampedTime);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleSplitClip();
      }
      
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClips) {
        e.preventDefault();
        dispatch(removeSelectedClips());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, handleSplitClip, selectedClips, dispatch]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) seconds = 0;
    const min = Math.floor(seconds / 60);
    const sec = (seconds % 60).toFixed(1);
    return `${min}:${sec.padStart(4, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800 text-neutral-100 overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0">
        {/* Primary gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-surface-900/40 to-violet-900/20"></div>
        {/* Sophisticated pattern overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(49, 130, 206, 0.15) 0%, transparent 60%), 
            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 40% 80%, rgba(245, 158, 11, 0.08) 0%, transparent 50%)
          `
        }}></div>
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}></div>
      </div>
      
      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-screen">
        
        {/* Video Preview Section */}
        <VideoPreview 
          ref={videoRef}
          videoFile={videoFile}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          currentTime={currentTime}
          duration={duration}
          formatTime={formatTime}
          onSeek={seekTo}
        />

        {/* Timeline Section */}
        <div className="flex-shrink-0">
          {/* Transport Bar */}
          {/* <TransportBar 
            audioClips={audioClips}
            handleSplitClip={handleSplitClip}
            currentTime={currentTime}
            duration={duration}
            formatTime={formatTime}
            togglePlay={togglePlay}
            isPlaying={isPlaying}
            handleZoomOut={handleZoomOut}
            handleFitView={handleFitView}
            handleZoomIn={handleZoomIn}
          /> */}

          {/* Timeline Container with enhanced glass effect */}
          <div className="backdrop-blur-xl bg-gradient-to-r from-surface-800/60 via-surface-700/40 to-surface-800/60 border-t border-white/10 shadow-inner-glass">
            <Timeline 
              currentTime={currentTime} 
              duration={duration}
              onSeek={seekTo}
              zoomLevel={zoomLevel}
              onZoomChange={(newZoom) => dispatch(setZoomLevel(newZoom))}
              scrollContainerRef={scrollContainerRef}
            />
          </div>
        </div>
      </div>

      {/* Clip Inspector */}
      {/* <ClipInspector /> */}
    </div>
  );
}

export default App;