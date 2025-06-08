// ClipInspector.jsx - Component to display clicked clip context
import React from 'react';
import { useSelector } from 'react-redux';
import { formatTime } from '../utils/timeFormat';

const ClipInspector = () => {
  const selectedClipContext = useSelector(state => state.clipSelection.selectedClipContext);

  if (!selectedClipContext) {
    return (
      <div className="w-72 h-full bg-surface-900/50 backdrop-blur-lg border-l border-surface-600/30 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-neutral-700/40 to-neutral-800/60 flex items-center justify-center backdrop-blur-md border border-neutral-600/30">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-neutral-400 text-sm">Click on a clip to see its properties</p>
        </div>
      </div>
    );
  }

  const { clip, trackInfo } = selectedClipContext;

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, unitIndex)).toFixed(1);
    return `${size} ${units[unitIndex] || 'B'}`;
  };

  // Get file extension
  const getFileExtension = (filename) => {
    if (!filename) return 'Unknown';
    const extension = filename.split('.').pop();
    return extension ? extension.toUpperCase() : 'Unknown';
  };

  // Get dimensions text
  const getDimensionsText = () => {
    if (clip.type === 'IMAGE') {
      if (clip.width && clip.height) {
        return `${clip.width} × ${clip.height}`;
      }
    } else if (clip.type === 'VIDEO') {
      if (clip.width && clip.height) {
        return `${clip.width} × ${clip.height}`;
      }
    }
    return 'N/A';
  };

  // Get clip type icon and color
  const getClipTypeInfo = () => {
    switch (clip.type) {
      case 'EMPTY':
        return { icon: '⭕', color: 'from-neutral-500/80 to-neutral-600/90', textColor: 'text-neutral-300' };
      case 'IMAGE':
        return { icon: '🖼️', color: 'from-blue-500/80 to-blue-600/90', textColor: 'text-blue-300' };
      case 'VIDEO':
        return { icon: '🎬', color: 'from-red-500/80 to-red-600/90', textColor: 'text-red-300' };
      default:
        return { icon: '🎵', color: 'from-accent-500/80 to-accent-600/90', textColor: 'text-accent-300' };
    }
  };

  const typeInfo = getClipTypeInfo();

  return (
    <div className="w-72 h-full bg-surface-900/50 backdrop-blur-lg border-l border-surface-600/30 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${typeInfo.color} flex items-center justify-center backdrop-blur-md border border-neutral-600/30 shadow-glass`}>
            <span className="text-xl">{typeInfo.icon}</span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-100 mb-1">Clip Inspector</h3>
          <p className={`text-sm ${typeInfo.textColor} font-medium`}>
            {clip.type || 'AUDIO'} CLIP
          </p>
        </div>

        {/* Basic Information */}
        <div className="bg-surface-800/40 backdrop-blur-md rounded-xl p-4 border border-surface-600/30 shadow-glass">
          <h4 className="text-sm font-semibold text-neutral-200 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-400 rounded-full"></span>
            Basic Information
          </h4>
          
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Name</span>
              <span className="text-xs text-neutral-200 font-medium max-w-32 truncate">
                {clip.name || 'Untitled Clip'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Duration</span>
              <span className="text-xs text-neutral-200 font-mono">
                {formatTime(clip.duration || 0)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Start Time</span>
              <span className="text-xs text-neutral-200 font-mono">
                {formatTime(clip.start || clip.startTime || 0)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">End Time</span>
              <span className="text-xs text-neutral-200 font-mono">
                {formatTime((clip.start || clip.startTime || 0) + (clip.duration || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* File Information */}
        {clip.file && (
          <div className="bg-surface-800/40 backdrop-blur-md rounded-xl p-4 border border-surface-600/30 shadow-glass">
            <h4 className="text-sm font-semibold text-neutral-200 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-400 rounded-full"></span>
              File Information
            </h4>
            
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Format</span>
                <span className="text-xs text-neutral-200 font-medium">
                  {getFileExtension(clip.name)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">File Size</span>
                <span className="text-xs text-neutral-200 font-mono">
                  {formatFileSize(clip.file?.size)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400">Dimensions</span>
                <span className="text-xs text-neutral-200 font-mono">
                  {getDimensionsText()}
                </span>
              </div>
              
              {clip.audioOffset !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-400">Audio Offset</span>
                  <span className="text-xs text-neutral-200 font-mono">
                    {formatTime(clip.audioOffset)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Track Information */}
        <div className="bg-surface-800/40 backdrop-blur-md rounded-xl p-4 border border-surface-600/30 shadow-glass">
          <h4 className="text-sm font-semibold text-neutral-200 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-violet-400 rounded-full"></span>
            Track Information
          </h4>
          
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Track</span>
              <span className="text-xs text-neutral-200 font-medium">
                {trackInfo?.label || 'Unknown Track'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Track Type</span>
              <span className="text-xs text-neutral-200 font-medium uppercase">
                {trackInfo?.type || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Technical Information */}
        <div className="bg-surface-800/40 backdrop-blur-md rounded-xl p-4 border border-surface-600/30 shadow-glass">
          <h4 className="text-sm font-semibold text-neutral-200 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
            Technical Info
          </h4>
          
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Clip ID</span>
              <span className="text-xs text-neutral-200 font-mono">
                {clip.id || 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-neutral-400">Track ID</span>
              <span className="text-xs text-neutral-200 font-mono">
                {trackInfo?.id || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button className="w-full bg-gradient-to-r from-primary-600/80 to-primary-700/90 hover:from-primary-500/90 hover:to-primary-600/95 text-neutral-100 text-xs font-semibold py-2.5 px-4 rounded-lg backdrop-blur-md border border-primary-500/30 hover:border-primary-400/50 transition-all duration-200 shadow-glass hover:shadow-glass-lg">
            Edit Properties
          </button>
          
          {clip.file && (
            <button className="w-full bg-gradient-to-r from-accent-600/80 to-accent-700/90 hover:from-accent-500/90 hover:to-accent-600/95 text-neutral-100 text-xs font-semibold py-2.5 px-4 rounded-lg backdrop-blur-md border border-accent-500/30 hover:border-accent-400/50 transition-all duration-200 shadow-glass hover:shadow-glass-lg">
              Replace File
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClipInspector; 