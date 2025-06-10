# Video Editor - Improved Directory Structure

## Overview
This document outlines the comprehensive refactoring of the video editor codebase to improve maintainability, separation of concerns, and scalability.

## New Directory Structure

```
src/
├── components/              # Reusable UI components
│   ├── Timeline.jsx
│   ├── VideoPreview.jsx
│   ├── TransportBar.jsx
│   ├── ClipInspector.jsx
│   ├── AudioClip.jsx
│   ├── Layout.jsx          # New: Navigation layout
│   └── ...
├── pages/                  # New: Page-level components
│   ├── ProjectsPage.jsx    # Project management page
│   └── EditorPage.jsx      # Video editor page
├── hooks/                  # New: Custom React hooks
│   ├── useVideoPlayer.js   # Video player logic
│   ├── useAudioPlayer.js   # Audio player logic
│   └── useKeyboardShortcuts.js # Keyboard shortcuts
├── services/               # New: API layer
│   ├── api.js              # Generic API helpers (GET, POST, etc.)
│   └── projectService.js   # Project-specific API operations
├── constants/              # New: Application constants
│   └── apiRoutes.js        # API endpoint definitions
├── router/                 # New: Routing configuration
│   └── AppRouter.jsx       # Main router component
├── store/                  # Redux state management
│   ├── index.js
│   ├── hooks.js
│   └── slices/
├── utils/                  # Utility functions
│   └── timeFormat.js
└── assets/                 # Static assets
```

## Key Improvements

### 1. Separation of Concerns

**Before:** App.jsx contained 352 lines with mixed concerns:
- Video player logic
- Audio synchronization
- Keyboard shortcuts
- UI rendering
- Business logic

**After:** Logic is separated into focused modules:
- **Custom Hooks:** Encapsulate specific functionality
- **Services:** Handle API communications
- **Pages:** Manage page-level state and UI
- **Components:** Pure UI components

### 2. Routing System

**Added:** React Router for navigation between:
- `/projects` - Project management page
- `/editor` - General editor page
- `/editor/:projectId` - Project-specific editor

**Features:**
- Navigation layout component
- 404 error handling
- Clean URL structure

### 3. API Layer

**Created:** Centralized API management:

#### `src/constants/apiRoutes.js`
```javascript
export const API_ROUTES = {
  PROJECTS: {
    GET_ALL: `${API_BASE_URL}/projects`,
    CREATE: `${API_BASE_URL}/projects`,
    // ... more routes
  },
  VIDEOS: { /* ... */ },
  AUDIO: { /* ... */ }
};
```

#### `src/services/api.js`
Generic API helpers with:
- Error handling
- Request timeouts
- Authentication headers
- File upload support

#### `src/services/projectService.js`
High-level service abstractions:
```javascript
export const projectService = {
  async getAllProjects() { /* ... */ },
  async createProject(data) { /* ... */ },
  async deleteProject(id) { /* ... */ }
};
```

### 4. Custom Hooks

#### `useVideoPlayer.js`
Handles all video player functionality:
- Video element management
- Play/pause control
- Seeking
- Duration tracking

#### `useAudioPlayer.js`
Manages audio synchronization:
- Audio clip playback
- Timeline synchronization
- Multiple audio track handling

#### `useKeyboardShortcuts.js`
Centralized keyboard shortcut handling:
- Play/pause (Spacebar)
- Split clip (S key)
- Delete clips (Delete/Backspace)

## Benefits of New Structure

### 1. **Maintainability**
- Smaller, focused files
- Clear responsibility boundaries
- Easier to locate and fix issues

### 2. **Reusability**
- Custom hooks can be reused across components
- API services can be used by any component
- Modular architecture supports feature expansion

### 3. **Testability**
- Individual hooks and services can be unit tested
- Separation makes mocking easier
- Clear input/output contracts

### 4. **Scalability**
- Easy to add new pages/routes
- API layer supports backend integration
- Consistent patterns for new features

### 5. **Developer Experience**
- Clear navigation between related code
- Consistent file organization
- Better IDE support and autocomplete

## Migration Guide

### From Old App.jsx to New Structure

1. **Video Logic** → `useVideoPlayer` hook
2. **Audio Logic** → `useAudioPlayer` hook
3. **Keyboard Shortcuts** → `useKeyboardShortcuts` hook
4. **API Calls** → Service layer (`projectService`, etc.)
5. **Constants** → `apiRoutes.js`
6. **Navigation** → React Router with Layout component

### Example Usage in Components

```javascript
// Old way (in App.jsx)
const [isPlaying, setIsPlaying] = useState(false);
const togglePlay = () => { /* complex logic */ };

// New way (in EditorPage.jsx)
const { isPlaying, togglePlay } = useVideoPlayer(videoFile);
```

## Future Enhancements

With this improved structure, the following can be easily added:

1. **Authentication** - User service already scaffolded
2. **Real-time Collaboration** - WebSocket integration in services
3. **Plugin System** - Modular hook architecture supports plugins
4. **Advanced Routing** - Nested routes, protected routes
5. **State Persistence** - Easy to add localStorage/sessionStorage
6. **Testing Suite** - Clear boundaries make testing straightforward

## Installation Requirements

To use the routing functionality, install React Router DOM:

```bash
npm install react-router-dom
```

All other functionality uses existing dependencies.

## Conclusion

This refactoring transforms a monolithic 352-line App.jsx into a well-structured, maintainable application following React best practices. The separation of concerns, introduction of routing, and creation of a proper API layer provide a solid foundation for future development. 