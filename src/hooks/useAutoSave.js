import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSaving, setSaveSuccess, setSaveError } from '../store/slices/tracksSlice';
import { projectService } from '../services/projectService';
import { API_ROUTES } from '../constants/apiRoutes';

export const useAutoSave = (projectId) => {
  const dispatch = useDispatch();
  const { tracks, isDirty, isSaving, lastSaved } = useSelector(state => state.tracks);
  const autoSaveIntervalRef = useRef(null);
  const isUnloadingRef = useRef(false);

  // Save function that sends timeline data to API
  const saveProject = useCallback(async (force = false) => {
    // Don't save if already saving or no changes (unless forced)
    if (isSaving || (!isDirty && !force) || !projectId) {
      return Promise.resolve();
    }

    try {
      dispatch(setSaving(true));
      
      const projectData = {
        tracks,
        lastModified: new Date().toISOString()
      };
      console.log('tracks', tracks);

      await projectService.updateProjectTracks(projectId, tracks);
      
      dispatch(setSaveSuccess());
      console.log('Project auto-saved successfully');
      
      return Promise.resolve();
    } catch (error) {
      dispatch(setSaveError());
      console.error('Auto-save failed:', error);
      throw error;
    }
  }, [projectId, tracks, isDirty, isSaving, dispatch]);

  // Set up periodic auto-save (every 10 seconds)
  useEffect(() => {
    if (!projectId) return;

    // Clear existing interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    // Set up new interval
    autoSaveIntervalRef.current = setInterval(() => {
      if (isDirty && !isSaving) {
        saveProject().catch(error => {
          console.error('Periodic auto-save failed:', error);
        });
      }
    }, 10000); // 10 seconds

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [projectId, isDirty, isSaving, saveProject]);

  // Handle tab/window change events
  useEffect(() => {
    if (!projectId) return;

    const handleVisibilityChange = () => {
      // Save when tab becomes hidden (user switches tabs)
      if (document.hidden && isDirty && !isSaving) {
        saveProject().catch(error => {
          console.error('Tab change auto-save failed:', error);
        });
      }
    };

    const handleBeforeUnload = (event) => {
      isUnloadingRef.current = true;
      
      // If there are unsaved changes, show confirmation dialog
      if (isDirty && !isSaving) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        event.returnValue = message;
        
        // Try to save synchronously (though this is limited by browser)
        saveProject(true).catch(error => {
          console.error('Before unload save failed:', error);
        });
        
        return message;
      }
    };

    const handleUnload = () => {
      // Final attempt to save when page is actually unloading
      if (isDirty && !isSaving && !isUnloadingRef.current) {
        // Use sendBeacon for more reliable last-ditch save
        if (navigator.sendBeacon && projectId) {
          const data = JSON.stringify({
            tracks,
            lastModified: new Date().toISOString()
          });
          
          // Use the quick-save endpoint for sendBeacon
          navigator.sendBeacon(API_ROUTES.PROJECTS.QUICK_SAVE(projectId), data);
        }
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [projectId, isDirty, isSaving, tracks, saveProject]);

  // Manual save function that can be called by UI components
  const manualSave = useCallback(() => {
    return saveProject(true); // Force save regardless of dirty state
  }, [saveProject]);

  return {
    saveProject: manualSave,
    isDirty,
    isSaving,
    lastSaved: lastSaved ? new Date(lastSaved) : null
  };
}; 