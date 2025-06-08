import { configureStore } from '@reduxjs/toolkit';
import tracksReducer from './slices/tracksSlice';
import clipSelectionReducer from './slices/clipSelectionSlice';

export const store = configureStore({
  reducer: {
    tracks: tracksReducer,
    clipSelection: clipSelectionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'tracks/updateClipFile',
          'tracks/addClipToTrack',
          'tracks/addMultipleClipsToTrack',
          'tracks/selectClip',
          'tracks/clearSelection',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: [
          'payload.file',
          'payload.clip.file',
          'payload.clips',
          'payload.multiSelect',
          'meta.arg',
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'tracks.tracks',
          'tracks.selectedClips',
          'clipSelection',
        ],
      },
    }),
}); 