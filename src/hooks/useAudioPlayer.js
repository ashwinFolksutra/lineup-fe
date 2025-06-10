import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setIsPlaying, setCurrentTime } from '../store/slices/tracksSlice';

export const useAudioPlayer = () => {
  const [playingAudios, setPlayingAudios] = useState(new Map());
  const dispatch = useDispatch();
  
  const { tracks, currentTime, duration, isPlaying } = useSelector(state => state.tracks);

  // Get all audio clips from Redux
  const audioClips = tracks.reduce((allClips, track) => {
    if (track.trackType === 'audio1' || track.trackType === 'audio2') {
      return [...allClips, ...track.clips.map(clip => ({ ...clip, trackType: track.trackType }))];
    }
    return allClips;
  }, []);

  const playAudioClip = useCallback((clip, startOffset = 0) => {
    try {
      const audio = new Audio(URL.createObjectURL(clip.file));
      
      // Use audioOffset to determine where in the original file to start playing
      const audioFileOffset = (clip.audioOffset || 0) + startOffset;
      
      // Debug logging for audio playback
      // console.log('Audio playback debug:', {
      //   clipName: clip.name,
      //   clipStart: clip.start || clip.startTime || 0,
      //   clipDuration: clip.duration,
      //   clipAudioOffset: clip.audioOffset || 0,
      //   startOffset: startOffset,
      //   finalAudioFileOffset: audioFileOffset
      // });
      
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
  }, [audioClips, playingAudios, playAudioClip]);

  // Handle timeline-based playback
  useEffect(() => {
    let intervalRef;
    
    if (isPlaying) {
      intervalRef = setInterval(() => {
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
    }

    return () => {
      if (intervalRef) {
        clearInterval(intervalRef);
      }
    };
  }, [isPlaying, duration, currentTime, handleAudioSync, stopAllAudios, dispatch]);

  return {
    audioClips,
    playingAudios,
    playAudioClip,
    stopAllAudios,
    handleAudioSync
  };
}; 