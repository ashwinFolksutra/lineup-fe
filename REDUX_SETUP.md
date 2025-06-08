# Redux Setup and Video Track Enhancement

## Required Dependencies

To use the new Redux state management and enhanced video track functionality, you need to install the following dependencies:

```bash
npm install @reduxjs/toolkit react-redux
```

## New Features

### 1. Redux State Management
- **Store Configuration**: Centralized state management with Redux Toolkit
- **Tracks Slice**: Manages all track data including video and audio tracks
- **Clip Selection Slice**: Handles clip selection and active clip context

### 2. Video Track Component
A specialized component for video tracks that supports three types of clips:

#### Clip Types:
- **Empty Clip**: Placeholder clip that can be filled with content
- **Image Clip**: Static image that displays for the specified duration
- **Video Clip**: Full video file with playback capabilities

#### Features:
- Drag and drop video/image files
- Click to view clip context and properties
- Visual differentiation between clip types
- Resize and move functionality
- Integration with Redux for state management

### 3. Clip Inspector
A floating panel that displays detailed information about clicked clips:
- Clip type and properties
- File information (size, format, dimensions)
- Timeline position and duration
- Technical details (clip ID, track ID)
- Action buttons for editing and replacing files

## File Structure

```
src/
├── store/
│   ├── index.js                 # Redux store configuration
│   ├── hooks.js                 # Custom Redux hooks
│   └── slices/
│       ├── tracksSlice.js       # Track and clip state management
│       └── clipSelectionSlice.js # Selection and context management
├── components/
│   ├── VideoTrack.jsx           # Specialized video track component
│   ├── ClipInspector.jsx        # Clip context display panel
│   └── Track.jsx                # Enhanced to use VideoTrack for video tracks
└── main.jsx                     # Updated with Redux Provider
```

## Usage

### Adding a Video Track
Video tracks are automatically handled by the `VideoTrack` component when `trackType === 'video'`:

```jsx
<Track 
  trackId={track.id}
  trackType="video"
  label="Video Track"
  clips={clips}
  pixelsPerSecond={50}
  duration={300}
  hasAnyClips={false}
/>
```

### Redux Actions
Use the provided actions to manage state:

```javascript
// Add a new track
dispatch(addTrack({ trackType: 'video', label: 'Video Track 1' }));

// Add a clip to a track
dispatch(addClipToTrack({ 
  trackId: trackId, 
  clip: {
    id: Date.now(),
    name: 'video.mp4',
    start: 0,
    duration: 10,
    clipType: 'video',
    file: fileObject
  }
}));

// Update clip properties
dispatch(updateClip({ 
  trackId: trackId, 
  clipId: clipId, 
  updates: { start: 5, duration: 15 } 
}));

// Select a clip and show context
dispatch(selectClip({ clipId: clipId, multiSelect: false }));
dispatch(setActiveClipContext({
  clipId: clipId,
  trackId: trackId,
  clipType: 'video',
  clipData: { /* clip properties */ }
}));
```

### Custom Hooks
Use the provided hooks for easier state access:

```javascript
import { useTracksData, useSelectedClips, useActiveClipContext } from './store/hooks';

const tracks = useTracksData();
const selectedClips = useSelectedClips();
const activeClipContext = useActiveClipContext();
```

## Integration Notes

1. The existing `Track` component automatically renders `VideoTrack` for video tracks
2. Audio tracks continue to use the original Track component logic
3. All state is now managed through Redux for better communication between components
4. The ClipInspector appears when any clip is clicked and shows contextual information
5. File uploads via drag-and-drop automatically determine clip type based on MIME type

## Next Steps

1. Install the required dependencies: `npm install @reduxjs/toolkit react-redux`
2. The Redux store is automatically configured and provided to the app
3. Video tracks will now use the enhanced VideoTrack component
4. Click any clip to see the ClipInspector panel with detailed information 