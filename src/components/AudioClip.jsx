// AudioClip.jsx
import React, { useState, useRef } from 'react';
import './AudioClip.css';

const PIXELS_PER_SECOND = 80;

export default function AudioClip({ clip, onUpdate, onDelete }) {
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
        const newDuration = Math.max(0.5, initialDuration - timeDelta);
        
        if (onUpdate) {
          onUpdate({ start: newStart, duration: newDuration });
        }
      } else {
        // Right resize: only adjust duration
        const newDuration = Math.max(0.5, initialDuration + timeDelta);
        
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
      className={`audio-clip ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{ 
        left: clipLeft, 
        width: clipWidth,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleDragStart}
      onDoubleClick={handleDoubleClick}
      title="Double-click to delete"
    >
      <div 
        className="resize-handle left" 
        onMouseDown={(e) => handleResize(e, 'left')}
        title="Resize from left"
      />
      <div className="clip-body">
        <span className="clip-name">{clip.name}</span>
        <span className="clip-time">{clip.duration.toFixed(1)}s</span>
      </div>
      <div 
        className="resize-handle right" 
        onMouseDown={(e) => handleResize(e, 'right')}
        title="Resize from right"
      />
    </div>
  );
}