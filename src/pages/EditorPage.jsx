import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { setZoomLevel } from '../store/slices/tracksSlice';

// Catalyst Components
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { Heading } from '../components/heading';
import { 
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from '../components/dropdown';

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

// Icons
import {
  ArrowLeftIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  EllipsisVerticalIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const EditorPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const scrollContainerRef = useRef();
  const dispatch = useDispatch();
  
  // Redux state
  const { zoomLevel, duration, tracks } = useSelector(state => state.tracks);
  
  // Check if there are any clips anywhere
  const hasAnyClips = tracks.some(track => track.clips && track.clips.length > 0);
  
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

  if (loading) {
    return (
      <div className="h-screen bg-white dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="flex items-center gap-4">
          <Button plain onClick={() => navigate('/projects')}>
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Projects
          </Button>
          
          <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-600" />
          
          <div>
            <Heading level={1} className="text-lg">
              {project?.name || 'Untitled Project'}
            </Heading>
            {project?.context && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                {project.context}
              </p>
            )}
          </div>
          
          <Badge color="lime">Active</Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" outline>
            <ShareIcon className="w-4 h-4" />
            Share
          </Button>
          
          <Button size="sm" color="indigo">
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
          </Button>

          <Dropdown>
            <DropdownButton plain>
              <EllipsisVerticalIcon className="w-5 h-5" />
            </DropdownButton>
            <DropdownMenu anchor="bottom end">
              <DropdownItem>
                <Cog6ToothIcon className="w-4 h-4" />
                Project Settings
              </DropdownItem>
              <DropdownItem>Save As Template</DropdownItem>
              <DropdownItem>Duplicate Project</DropdownItem>
              <DropdownItem>Delete Project</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Conditional Video Preview Section - Only show when there are clips */}
        {hasAnyClips && (
          <div className="h-120 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800">
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
          </div>
        )}

        {/* Timeline Section */}
        <div className="h-auto">
          <Timeline 
            currentTime={currentTime} 
            duration={duration}
            onSeek={seekTo}
            zoomLevel={zoomLevel}
            onZoomChange={(newZoom) => dispatch(setZoomLevel(newZoom))}
            scrollContainerRef={scrollContainerRef}
            projectId={projectId}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            videoCurrentTime={currentTime}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorPage; 