import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { splitClip, removeSelectedClips } from '../store/slices/tracksSlice';

export const useKeyboardShortcuts = (togglePlay, currentTime) => {
  const dispatch = useDispatch();
  const { selectedClips } = useSelector(state => state.tracks);

  // Handle split clip functionality
  const handleSplitClip = () => {
    // Check if any clip is selected
    if (!selectedClips) {
      console.log('No clip selected for splitting. Please select a clip first.');
      return;
    }
    
    dispatch(splitClip({ currentTime }));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent shortcuts when user is typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
      }

      // Split clip with 'S' key
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleSplitClip();
      }
      
      // Toggle play with spacebar
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
      
      // Delete selected clips with Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClips) {
        e.preventDefault();
        dispatch(removeSelectedClips());
      }

      // Zoom controls
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          // Zoom in - this could be passed as a callback
          console.log('Zoom in shortcut');
        }
        
        if (e.key === '-') {
          e.preventDefault();
          // Zoom out - this could be passed as a callback
          console.log('Zoom out shortcut');
        }
        
        if (e.key === '0') {
          e.preventDefault();
          // Fit to view - this could be passed as a callback
          console.log('Fit view shortcut');
        }
      }

      // Navigation shortcuts
      if (e.key === 'ArrowLeft' && !e.shiftKey) {
        e.preventDefault();
        // Move backward 1 second - this could be passed as a callback
        console.log('Navigate backward');
      }
      
      if (e.key === 'ArrowRight' && !e.shiftKey) {
        e.preventDefault();
        // Move forward 1 second - this could be passed as a callback
        console.log('Navigate forward');
      }

      // Fine navigation with Shift
      if (e.key === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault();
        // Move backward 0.1 seconds - this could be passed as a callback
        console.log('Fine navigate backward');
      }
      
      if (e.key === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        // Move forward 0.1 seconds - this could be passed as a callback
        console.log('Fine navigate forward');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, currentTime, selectedClips, dispatch]);

  return {
    handleSplitClip
  };
}; 