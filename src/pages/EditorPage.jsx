import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { setZoomLevel } from '../store/slices/tracksSlice';

// Components
import Timeline from '../components/Timeline';
import VideoPreview from '../components/VideoPreview';

// Custom hooks
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Services
import { projectService } from '../services/projectService';
import { handleApiError } from '../services/api';

// Utils
import { formatTime } from '../utils/timeFormat';

const EditorPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const scrollContainerRef = useRef();
  const dispatch = useDispatch();
  
  // Redux state
  const { zoomLevel, duration } = useSelector(state => state.tracks);
  
  // Local state
  const [videoFile] = useState('/sample.mp4');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(!!projectId);

  // Custom hooks for separated concerns
  const { videoRef, currentTime, isPlaying, togglePlay, seekTo } = useVideoPlayer(videoFile);
  const { audioClips, stopAllAudios } = useAudioPlayer();
  const { handleSplitClip } = useKeyboardShortcuts(togglePlay, currentTime);

  // Load project data if projectId is provided
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const loadProject = async (id) => {
    try {
      setLoading(true);
      const projectData = await projectService.getProjectById(id);
      setProject(projectData);
      
      // Load project tracks if they exist
      if (projectData.tracks) {
        // You would dispatch actions to load tracks into Redux store here
        // dispatch(setTracks(projectData.tracks));
      }
    } catch (error) {
      const message = handleApiError(error);
      console.error('Failed to load project:', message);
      
      // If project not found, redirect to projects page
      if (error.status === 404) {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  // Save project periodically (auto-save)
  useEffect(() => {
    if (!projectId || !project) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        // Get current tracks from Redux store
        const currentTracks = useSelector(state => state.tracks.tracks);
        
        await projectService.saveProject(projectId, {
          tracks: currentTracks,
          lastModified: new Date().toISOString()
        });
        
        console.log('Project auto-saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [projectId, project]);

  // Zoom controls
  const handleFitView = () => {
    const timelineContainer = scrollContainerRef?.current || document.querySelector('[ref="scrollContainerRef"]');
    if (timelineContainer && duration > 0) {
      const containerWidth = timelineContainer.clientWidth;
      const newZoom = containerWidth / (duration * 80);
      dispatch(setZoomLevel(Math.max(0.1, Math.min(5, newZoom))));
    }
  };

  const handleZoomIn = () => {
    dispatch(setZoomLevel(Math.min(5, zoomLevel * 1.2)));
  };

  const handleZoomOut = () => {
    dispatch(setZoomLevel(Math.max(0.1, zoomLevel / 1.2)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800 text-neutral-100 overflow-hidden">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0">
        {/* Primary gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-surface-900/40 to-violet-900/20"></div>
        {/* Sophisticated pattern overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(49, 130, 206, 0.15) 0%, transparent 60%), 
            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.12) 0%, transparent 60%),
            radial-gradient(circle at 40% 80%, rgba(245, 158, 11, 0.08) 0%, transparent 50%)
          `
        }}></div>
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}></div>
      </div>
      
      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Project Header (if project is loaded) */}
        {project && (
          <div className="bg-surface-800/30 backdrop-blur-sm border-b border-white/10 px-6 py-3">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-semibold text-white">{project.name}</h1>
              <div className="flex items-center space-x-4">
                <button className="text-neutral-300 hover:text-white text-sm font-medium transition-colors duration-200">
                  Save
                </button>
                <button className="text-neutral-300 hover:text-white text-sm font-medium transition-colors duration-200">
                  Export
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Video Preview Section */}
        <VideoPreview 
          ref={videoRef}
          videoFile={videoFile}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          currentTime={currentTime}
          duration={duration}
          formatTime={formatTime}
          onSeek={seekTo}
        />

        {/* Timeline Section */}
        <div className="flex-shrink-0">
          {/* Timeline Container with enhanced glass effect */}
          <div className="backdrop-blur-xl bg-gradient-to-r from-surface-800/60 via-surface-700/40 to-surface-800/60 border-t border-white/10 shadow-inner-glass">
            <Timeline 
              currentTime={currentTime} 
              duration={duration}
              onSeek={seekTo}
              zoomLevel={zoomLevel}
              onZoomChange={(newZoom) => dispatch(setZoomLevel(newZoom))}
              scrollContainerRef={scrollContainerRef}
              projectId={projectId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage; 