# Redux Integration Documentation

## Overview

This document outlines the comprehensive refactoring of the video editor application to use Redux for consistent state management across all components. The application has been migrated from a prop-drilling architecture to a centralized Redux-based state management system.

## Architecture Changes

### Previous Architecture
- **State Management**: Local component state with prop drilling
- **Clip Data**: Managed individually in each component
- **Track Data**: Passed down through props
- **Playback Controls**: Scattered across multiple components
- **Selection State**: Managed locally in Timeline component

### New Redux Architecture
- **Centralized State**: All application state managed through Redux store
- **Consistent Data Flow**: Unidirectional data flow with actions and reducers
- **Component Communication**: Through Redux selectors and dispatchers
- **State Persistence**: Centralized state makes persistence easier
- **Debugging**: Redux DevTools integration for better debugging

## Redux Store Structure

### Main Store Configuration (`src/store/index.js`)
```javascript
{
  tracks: tracksReducer,        // Main application state
  clipSelection: clipSelectionReducer  // Clip selection context
}
```

### Tracks Slice (`src/store/slices/tracksSlice.js`)
```javascript
{
  // Track Management
  tracks: [
    {
      id: string,
      label: string,
      type: 'video' | 'audio1' | 'audio2',
      clips: [ClipObject...]
    }
  ],
  
  // Timeline Settings
  pixelsPerSecond: number,
  zoomLevel: number,
  duration: number,
  
  // Playback State
  currentTime: number,
  isPlaying: boolean,
  
  // UI State
  selectedClips: Set<string>
}
```

### Clip Selection Slice (`src/store/slices/clipSelectionSlice.js`)
```javascript
{
  activeClipContext: {
    clipId: string,
    trackId: string,
    clipType: string,
    clipData: object
  },
  selectedClipContext: {
    clip: object,
    trackInfo: object
  }
}
```

## Component Integration

### App.jsx
**Before**: Local state for `currentTime`, `duration`, `isPlaying`, `zoomLevel`, `audioClips`
**After**: All state managed through Redux
- Uses `useSelector` to access playback state
- Uses `useDispatch` to update timeline and playback controls
- Keyboard shortcuts dispatch Redux actions

### Timeline.jsx
**Before**: Received props and managed local `selectedClips` state
**After**: Complete Redux integration
- Accesses all data through `useSelector`
- Dispatches actions for clip operations
- Auto-scroll functionality based on Redux state
- File drop handling creates clips through Redux actions

### Track.jsx (Audio Tracks)
**Before**: Callback functions for clip updates and selection changes
**After**: Redux-first approach
- Uses `useDispatch` for all clip operations
- Accesses `selectedClips` from Redux state
- Drag and drop operations dispatch Redux actions
- Conditional rendering based on track type

### VideoTrack.jsx
**Before**: Already using Redux (was ahead of other components)
**After**: Enhanced integration with new Redux structure
- Maintains existing Redux integration
- Works with updated store structure
- Create Placeholders feature uses Redux for audio duration calculation

### ClipInspector.jsx
**Before**: Received clip context through props
**After**: Accesses clip context directly from Redux
- Uses `selectedClipContext` from Redux state
- No longer requires props from parent components
- Responsive to clip selection changes automatically

## Key Reducers and Actions

### Track Management
- `addTrack(track)` - Add new track to timeline
- `removeTrack(trackId)` - Remove track from timeline
- `replaceTrackClips({ trackId, clips })` - Replace all clips in a track

### Clip Management
- `addClipToTrack({ trackId, clip })` - Add single clip to track
- `addMultipleClipsToTrack({ trackId, clips })` - Add multiple clips to track
- `updateClip({ trackId, clipId, updates })` - Update clip properties
- `removeClip({ trackId, clipId })` - Remove clip from track
- `splitClip({ trackId, clipId, splitTime })` - Split clip at time position

### Timeline Controls
- `setPixelsPerSecond(value)` - Update timeline zoom
- `setZoomLevel(level)` - Set zoom level
- `setDuration(duration)` - Update timeline duration

### Playback Controls
- `setCurrentTime(time)` - Update playback position
- `setIsPlaying(playing)` - Set play/pause state
- `togglePlayback()` - Toggle play/pause

### Selection Management
- `selectClip({ clipId, multiSelect })` - Select/deselect clips
- `clearSelection()` - Clear all selections

## Communication Logic Changes

### Old Flow (Prop Drilling)
```
App → Timeline → Track → Clip
  ↓ props        ↓ callbacks
ClipInspector ← ← ← ←
```

### New Flow (Redux)
```
   Redux Store
       ↓ ↑
All Components ← → All Components
```

### Benefits of New Architecture

1. **Eliminated Prop Drilling**: Components access data directly from Redux
2. **Consistent State**: Single source of truth for all application state
3. **Better Performance**: Components only re-render when their specific data changes
4. **Easier Testing**: Pure functions and predictable state changes
5. **Developer Experience**: Redux DevTools for debugging and time-travel
6. **Future Features**: Easier to add features like undo/redo, state persistence

## Data Flow Examples

### Adding a Clip
1. User drops file on track
2. Track component dispatches `addClipToTrack` action
3. Redux reducer adds clip to store
4. All subscribed components automatically update
5. ClipInspector updates if clip is selected

### Selecting a Clip
1. User clicks on clip
2. Component dispatches `selectClip` action
3. Redux updates `selectedClips` Set
4. Visual feedback updates across all components
5. ClipInspector receives selection context

### Playback Control
1. User clicks play button in App
2. App dispatches `setIsPlaying(true)`
3. Timeline updates playhead position
4. All components reflect playing state

## Migration Checklist

- [x] **Store Configuration**: Updated with proper middleware
- [x] **Tracks Slice**: Complete state management for tracks and clips
- [x] **Clip Selection Slice**: Context management for clip inspector
- [x] **App Component**: Migrated to Redux for playback and timeline controls
- [x] **Timeline Component**: Full Redux integration with selection management
- [x] **Track Component**: Redux-first approach for audio tracks
- [x] **VideoTrack Component**: Enhanced integration with new store structure
- [x] **ClipInspector Component**: Direct Redux access for clip context

## Performance Considerations

### Optimizations Implemented
1. **Selective Subscriptions**: Components only subscribe to relevant state slices
2. **Set Usage**: Using JavaScript Set for selectedClips for O(1) operations
3. **Middleware Configuration**: Proper serialization handling for File objects
4. **Memoization Ready**: Structure supports React.memo and useCallback optimizations

### Future Optimizations
- Implement clip virtualization for large timelines
- Add state normalization for nested data structures
- Consider state persistence for user sessions

## Testing Strategy

### Unit Testing
- Test reducers with various action types
- Test component integration with Redux
- Mock Redux store for component tests

### Integration Testing
- Test complete workflows (add clip → select → edit)
- Test state consistency across components
- Test error handling and edge cases

## Debugging Tools

### Redux DevTools Integration
- Action logging and replay
- State diff visualization
- Time-travel debugging
- Performance monitoring

### Console Logging
- Action dispatches logged in development
- State changes tracked
- Performance metrics available

## Conclusion

The Redux integration provides a solid foundation for the video editor application with:
- Consistent state management
- Improved developer experience
- Better performance characteristics
- Easier feature development
- Enhanced debugging capabilities

The application now follows Redux best practices and provides a scalable architecture for future enhancements. 