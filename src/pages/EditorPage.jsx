import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { setZoomLevel, loadProjectData } from '../store/slices/tracksSlice';

// Catalyst Components
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { Heading, Subheading } from '../components/heading';
import { 
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from '../components/dropdown';

// Components
import Timeline from '../components/Timeline';
import VideoPreview from '../components/VideoPreview';
import SaveStatusIndicator from '../components/SaveStatusIndicator';

// Custom hooks
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAutoSave } from '../hooks/useAutoSave';

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
  const { saveProject, isDirty, isSaving, lastSaved } = useAutoSave(projectId);

  // Load project data if projectId is provided
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const loadTracks = async (id) => {
    try {
      const response = await projectService.getProjectTracks(id);

      // Try multiple possible response structures
      let tracks;
      if (Array.isArray(response)) {
        tracks = response;
      } else if (response && Array.isArray(response.data)) {
        tracks = response.data;
      } else if (response && Array.isArray(response.tracks)) {
        tracks = response.tracks;
      } else if (response && response.data && Array.isArray(response.data.tracks)) {
        tracks = response.data.tracks;
      } else {
        tracks = [];
      }

      console.log('tracks', tracks);
      const assetIds = [...new Set(tracks.flatMap(track => 
        track.clips.map(clip => clip.assetId)
      ).filter(Boolean))]; // Get unique asset IDs, filtering out falsy values
      console.log('assetIds', assetIds);
      
      // Always dispatch to replace tracks
      dispatch(loadProjectData({ tracks }));
      console.log('Dispatched loadProjectData with tracks');
    } catch (error) {
      console.error('Failed to load project tracks:', error);
      // Dispatch empty tracks on error to clear any existing tracks
      dispatch(loadProjectData({ tracks: [] }));
    }
  }

  const loadAsset = async (projectId, assetId) => {
    const asset = await projectService.getAssetById(projectId, assetId);
    console.log('asset', asset);
  }

  const loadProject = async (id) => {
    try {
      setLoading(true);
      const projectData = await projectService.getProjectById(id);
      setProject(projectData?.data);

      // Load project tracks if they exist
      loadTracks(id);
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
          <Button plain onClick={() => navigate('/projects')} className='text-sm'>
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          
          <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-600" />
          
          <div>
            <Subheading level={1} className="text-lg">
              {project?.name || 'Untitled Project'}
            </Subheading>
            {/* {project?.context && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                {project.context}
              </p>
            )} */}
          </div>
          
          {/* <Badge color="lime">Active</Badge> */}
        </div>

        <div className="flex items-center gap-3">
          {/* Save Status Indicator */}
          <SaveStatusIndicator 
            isDirty={isDirty}
            isSaving={isSaving}
            lastSaved={lastSaved}
          />

          {/* Save Button */}
          <Button 
            size="xs" 
            onClick={saveProject}
            disabled={isSaving || !isDirty}
            className={isDirty && !isSaving ? 'bg-blue-600 text-white' : ''}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          
          <Button size="xs" outline>
            <ShareIcon className="w-4 h-4" />
            {/* Share */}
          </Button>
          
          <Button size="xs" outline>
            <ArrowDownTrayIcon className="w-4 h-4" />
            {/* Export */}
          </Button>

          {/* <Dropdown>
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
          </Dropdown> */}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Conditional Video Preview Section - Takes remaining space */}
        {hasAnyClips && (
          <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800">
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

        {/* Timeline Section - Fixed height at bottom */}
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