import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedClips: new Set(),
  activeClipContext: null, // Will store the context of the clicked clip
};

const clipSelectionSlice = createSlice({
  name: 'clipSelection',
  initialState,
  reducers: {
    selectClip: (state, action) => {
      const { clipId, multiSelect } = action.payload;
      if (multiSelect) {
        // Convert Set to array for Redux serialization
        const currentSelection = Array.from(state.selectedClips);
        if (currentSelection.includes(clipId)) {
          state.selectedClips = currentSelection.filter(id => id !== clipId);
        } else {
          state.selectedClips = [...currentSelection, clipId];
        }
      } else {
        state.selectedClips = [clipId];
      }
    },
    
    selectMultipleClips: (state, action) => {
      const clipIds = action.payload;
      state.selectedClips = clipIds;
    },
    
    clearSelection: (state) => {
      state.selectedClips = [];
    },
    
    setActiveClipContext: (state, action) => {
      const { clipId, trackId, clipType, clipData } = action.payload;
      state.activeClipContext = {
        clipId,
        trackId,
        clipType,
        clipData,
        timestamp: Date.now(),
      };
    },
    
    clearActiveClipContext: (state) => {
      state.activeClipContext = null;
    },
  },
});

export const {
  selectClip,
  selectMultipleClips,
  clearSelection,
  setActiveClipContext,
  clearActiveClipContext,
} = clipSelectionSlice.actions;

export default clipSelectionSlice.reducer; 