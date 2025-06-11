import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Track data
  tracks: [
    {
      id: 'video-1',
      trackType: 'video',
      label: 'Video 1',
      clips: [],
    },
    {
      id: 'audio-1', 
      trackType: 'audio1',
      label: 'Audio 1',
      clips: [],
    },
    {
      id: 'audio-2',
      trackType: 'audio2', 
      label: 'Audio 2',
      clips: [],
    }
  ],
  
  // Timeline settings
  pixelsPerSecond: 80,
  zoomLevel: 1,
  duration: 10,
  
  // Playback state
  currentTime: 0,
  isPlaying: false,
  
  // UI state - single clip selection only
  selectedClips: null, // Changed from Set to single string or null
  
  // Auto-save state
  isDirty: false, // Tracks if there are unsaved changes
  lastSaved: null, // Timestamp of last save
  isSaving: false, // Currently saving status
};

const tracksSlice = createSlice({
  name: 'tracks',
  initialState,
  reducers: {
    // Track management
    addTrack: (state, action) => {
      const { trackType, label } = action.payload;
      const newTrack = {
        id: Date.now().toString(),
        trackType,
        label,
        clips: [],
      };
      state.tracks.push(newTrack);
    },
    
    removeTrack: (state, action) => {
      const trackId = action.payload;
      state.tracks = state.tracks.filter(track => track.id !== trackId);
    },
    
    // Clip management
    addClipToTrack: (state, action) => {
      const { trackId, clip } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        track.clips.push({
          ...clip,
          id: clip.id || Date.now().toString(),
        });
        
        // Update duration if clip extends beyond current duration
        const clipEnd = (clip.start || clip.startTime || 0) + (clip.duration || 0);
        if (clipEnd > state.duration) {
          state.duration = Math.ceil(clipEnd + 2);
        }
        
        // Mark as dirty
        state.isDirty = true;
      }
    },
    
    addMultipleClipsToTrack: (state, action) => {
      const { trackId, clips } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        clips.forEach(clip => {
          track.clips.push({
            ...clip,
            id: clip.id || Date.now().toString() + Math.random(),
          });
          
          // Update duration if clip extends beyond current duration
          const clipEnd = (clip.start || clip.startTime || 0) + (clip.duration || 0);
          if (clipEnd > state.duration) {
            state.duration = Math.ceil(clipEnd + 2);
          }
        });
        
        // Mark as dirty if clips were added
        if (clips.length > 0) {
          state.isDirty = true;
        }
      }
    },
    
    updateClip: (state, action) => {
      const { trackId, clipId, updates } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        const clipIndex = track.clips.findIndex(c => c.id === clipId);
        if (clipIndex !== -1) {
          track.clips[clipIndex] = { ...track.clips[clipIndex], ...updates };
          
          // Update duration if clip extends beyond current duration
          const clip = track.clips[clipIndex];
          const clipEnd = (clip.start || clip.startTime || 0) + (clip.duration || 0);
          if (clipEnd > state.duration) {
            state.duration = Math.ceil(clipEnd + 2);
          }
          
          // Mark as dirty
          state.isDirty = true;
        }
      }
    },
    
    removeClip: (state, action) => {
      const { trackId, clipId } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        const originalLength = track.clips.length;
        track.clips = track.clips.filter(c => c.id !== clipId);
        
        // Mark as dirty if a clip was actually removed
        if (track.clips.length < originalLength) {
          state.isDirty = true;
        }
      }
    },
    
    removeSelectedClips: (state) => {
      if (!state.selectedClips) return;
      
      let clipRemoved = false;
      state.tracks.forEach(track => {
        const originalLength = track.clips.length;
        track.clips = track.clips.filter(clip => clip.id !== state.selectedClips);
        if (track.clips.length < originalLength) {
          clipRemoved = true;
        }
      });
      
      // Mark as dirty if a clip was removed
      if (clipRemoved) {
        state.isDirty = true;
      }
      
      state.selectedClips = null;
    },
    
    splitClip: (state, action) => {
      const { currentTime } = action.payload;
      
      // If no clip is selected, don't split anything
      if (!state.selectedClips) {
        return;
      }
      
      state.tracks.forEach(track => {
        const clipIndex = track.clips.findIndex(clip => clip.id === state.selectedClips);
        
        if (clipIndex !== -1) {
          const clip = track.clips[clipIndex];
          const clipStart = clip.start || clip.startTime || 0;
          const clipEnd = clipStart + (clip.duration || 10);
          
          if (currentTime > clipStart && currentTime < clipEnd) {
            // Calculate split
            const firstClipDuration = currentTime - clipStart;
            const secondClipDuration = clipEnd - currentTime;
            
            // Minimum segment size to prevent creating too small clips
            const minSegmentSize = 0.1; // 0.1 seconds minimum
            
            // Only split if both segments would be large enough
            if (firstClipDuration >= minSegmentSize && secondClipDuration >= minSegmentSize) {
              const originalAudioOffset = clip.audioOffset || 0;
              const splitPointInOriginalAudio = originalAudioOffset + firstClipDuration;
              
              const firstClip = {
                ...clip,
                duration: firstClipDuration,
                audioOffset: originalAudioOffset
              };
              
              const secondClip = {
                ...clip,
                id: Date.now().toString() + Math.random(),
                start: currentTime,
                startTime: currentTime,
                duration: secondClipDuration,
                name: clip.name + ' (Split)',
                audioOffset: splitPointInOriginalAudio
              };
              
              // Replace the original clip with the two new clips
              track.clips.splice(clipIndex, 1, firstClip, secondClip);
              
              // Mark as dirty
              state.isDirty = true;
            }
          }
        }
      });
      
      // Clear selection after splitting since the original clip no longer exists
      state.selectedClips = null;
    },
    
    updateClipFile: (state, action) => {
      const { trackId, clipId, file } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          clip.file = file;
          state.isDirty = true;
        }
      }
    },
    
    // Asset management actions
    updateClipAssetId: (state, action) => {
      const { clipId, assetId, serverAssetData } = action.payload;
      state.tracks.forEach(track => {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          clip.assetId = assetId;
          // Remove temporary file reference once asset is uploaded
          if (serverAssetData) {
            clip.file = null;
            clip.uploadProgress = null;
            clip.isUploading = false;
            clip.serverAssetData = serverAssetData;
          }
        }
      });
    },
    
    updateClipUploadProgress: (state, action) => {
      const { clipId, progress } = action.payload;
      state.tracks.forEach(track => {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          clip.uploadProgress = progress;
          clip.isUploading = progress < 100;
        }
      });
    },
    
    markClipAsUploading: (state, action) => {
      const { clipId } = action.payload;
      state.tracks.forEach(track => {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          clip.isUploading = true;
          clip.uploadProgress = 0;
        }
      });
    },
    
    // Timeline settings
    setPixelsPerSecond: (state, action) => {
      state.pixelsPerSecond = action.payload;
    },
    
    setZoomLevel: (state, action) => {
      state.zoomLevel = action.payload;
      state.pixelsPerSecond = 80 * action.payload;
    },
    
    setDuration: (state, action) => {
      state.duration = action.payload;
    },
    
    calculateDuration: (state) => {
      let maxEndTime = 10; // Minimum duration
      
      state.tracks.forEach(track => {
        track.clips.forEach(clip => {
          const clipEnd = (clip.start || clip.startTime || 0) + (clip.duration || 0);
          maxEndTime = Math.max(maxEndTime, clipEnd);
        });
      });
      
      state.duration = Math.ceil(maxEndTime + 2);
    },
    
    // Playback controls
    setCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    
    togglePlayback: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    
    // Selection management - single clip only
    selectClip: (state, action) => {
      const { clipId } = action.payload;
      // Always select just one clip, ignoring multiSelect parameter
      state.selectedClips = clipId || null;
    },
    
    clearSelection: (state) => {
      state.selectedClips = null;
    },
    
    // Batch operations
    updateMultipleClips: (state, action) => {
      const updates = action.payload; // Array of { trackId, clipId, updates }
      let hasUpdates = false;
      updates.forEach(({ trackId, clipId, updates: clipUpdates }) => {
        const track = state.tracks.find(t => t.id === trackId);
        if (track) {
          const clip = track.clips.find(c => c.id === clipId);
          if (clip) {
            Object.assign(clip, clipUpdates);
            hasUpdates = true;
          }
        }
      });
      
      if (hasUpdates) {
        state.isDirty = true;
      }
    },
    
    // Replace all clips for a track (for backward compatibility)
    replaceTrackClips: (state, action) => {
      const { trackId, clips } = action.payload;
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        track.clips = clips.map(clip => ({
          ...clip,
          id: clip.id || Date.now().toString() + Math.random(),
        }));
        state.isDirty = true;
      }
    },
    
    // Auto-save management
    setDirty: (state, action) => {
      state.isDirty = action.payload !== false; // Default to true if no payload
    },
    
    setSaving: (state, action) => {
      state.isSaving = action.payload;
    },
    
    setSaveSuccess: (state) => {
      state.isDirty = false;
      state.isSaving = false;
      state.lastSaved = Date.now();
    },
    
    setSaveError: (state) => {
      state.isSaving = false;
      // Keep isDirty as true since save failed
    },
    
    // Load project data and mark as clean
    loadProjectData: (state, action) => {
      const { tracks } = action.payload;
      
      if (tracks && Array.isArray(tracks)) {
        state.tracks = tracks;
      }
      
      // Mark as clean since we just loaded from server
      state.isDirty = false;
      state.lastSaved = Date.now();
    },
  },
});

export const {
  addTrack,
  removeTrack,
  addClipToTrack,
  addMultipleClipsToTrack,
  updateClip,
  removeClip,
  removeSelectedClips,
  splitClip,
  updateClipFile,
  updateClipAssetId,
  updateClipUploadProgress,
  markClipAsUploading,
  setPixelsPerSecond,
  setZoomLevel,
  setDuration,
  calculateDuration,
  setCurrentTime,
  setIsPlaying,
  togglePlayback,
  selectClip,
  clearSelection,
  updateMultipleClips,
  replaceTrackClips,
  setDirty,
  setSaving,
  setSaveSuccess,
  setSaveError,
  loadProjectData,
} = tracksSlice.actions;

export default tracksSlice.reducer; 