import { useRef, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setCurrentTime, 
  setIsPlaying, 
  calculateDuration 
} from '../store/slices/tracksSlice';

export const useVideoPlayer = (videoFile) => {
  const videoRef = useRef();
  const intervalRef = useRef();
  
  const dispatch = useDispatch();
  const { currentTime, duration, isPlaying } = useSelector(state => state.tracks);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      const newTime = video.currentTime;
      dispatch(setCurrentTime(newTime));
    };
    
    const updateDuration = () => {
      dispatch(calculateDuration());
    };
    
    const handleEnded = () => {
      dispatch(setIsPlaying(false));
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
  }, [dispatch]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    
    if (isPlaying) {
      if (video && !video.error) {
        video.pause();
      }
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
  }, [isPlaying, dispatch]);

  const seekTo = useCallback((time) => {
    const video = videoRef.current;
    const clampedTime = Math.max(0, Math.min(time, duration));
    
    dispatch(setCurrentTime(clampedTime));
    
    if (video && !video.error) {
      video.currentTime = clampedTime;
    }
  }, [duration, dispatch]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    videoRef,
    currentTime,
    duration,
    isPlaying,
    togglePlay,
    seekTo
  };
}; 