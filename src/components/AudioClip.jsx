// AudioClip.jsx - Professional Catalyst Design
import React, { useState, useRef } from 'react';
import { Badge } from './badge';

const PIXELS_PER_SECOND = 80;

export default function AudioClip({ clip, onUpdate, onDelete, isSelected, onSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const clipRef = useRef();

  const handleDragStart = (e) => {
    if (isResizing) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const startX = e.clientX;
    const initialStart = clip.start;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const timeDelta = delta / PIXELS_PER_SECOND;
      const newStart = Math.max(0, initialStart + timeDelta);
      
      if (onUpdate) {
        onUpdate({ start: newStart });
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResize = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const initialStart = clip.start;
    const initialDuration = clip.duration;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const timeDelta = delta / PIXELS_PER_SECOND;
      
      if (direction === 'left') {
        // Left resize: adjust start position and duration
        const newStart = Math.max(0, initialStart + timeDelta);
        const newDuration = Math.max(0.1, initialDuration - timeDelta);
        
        if (onUpdate) {
          onUpdate({ start: newStart, duration: newDuration });
        }
      } else {
        // Right resize: only adjust duration
        const newDuration = Math.max(0.1, initialDuration + timeDelta);
        
        if (onUpdate) {
          onUpdate({ duration: newDuration });
        }
      }
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect();
    }
  };

  const handleDoubleClick = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const clipWidth = clip.duration * PIXELS_PER_SECOND;
  const clipLeft = clip.start * PIXELS_PER_SECOND;

  return (
    <div
      ref={clipRef}
      className={`
        absolute h-12 rounded-md border transition-all duration-200
        ${isSelected 
          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-md ring-2 ring-indigo-400/50' 
          : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500 shadow-sm'
        }
        ${isDragging ? 'cursor-grabbing shadow-lg z-10' : 'cursor-grab'}
        ${isResizing ? 'cursor-ew-resize' : ''}
      `}
      style={{ 
        left: clipLeft, 
        width: Math.max(clipWidth, 10) // Minimum width for usability
      }}
      onMouseDown={handleDragStart}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title="Click to select, drag to move, double-click to delete"
    >
      {/* Left resize handle */}
      <div 
        className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-indigo-500 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-l-md"
        onMouseDown={(e) => handleResize(e, 'left')}
        title="Resize from left"
      />
      
      {/* Clip content */}
      <div className="flex flex-col justify-center px-3 h-full min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {clip.name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {clip.duration.toFixed(1)}s
            </p>
          </div>
          
          {/* Status indicators */}
          <div className="flex-shrink-0">
            {clip.isUploading && (
              <Badge color="amber" className="text-xs">
                {clip.uploadProgress >= 0 ? `${clip.uploadProgress}%` : 'Error'}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Right resize handle */}
      <div 
        className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-indigo-500 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-r-md"
        onMouseDown={(e) => handleResize(e, 'right')}
        title="Resize from right"
      />
      
      {/* Waveform placeholder */}
      <div className="absolute inset-x-3 bottom-1 h-0.5 bg-zinc-200 dark:bg-zinc-600 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-400 w-1/3 rounded-full"></div>
      </div>
    </div>
  );
}