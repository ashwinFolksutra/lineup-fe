import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const SaveStatusIndicator = ({ isDirty, isSaving, lastSaved }) => {
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
        <ArrowPathIcon className="w-4 h-4 text-blue-600 animate-spin" />
        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
          Saving...
        </span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full">
        <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
        <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
          Unsaved changes
        </span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
        <CheckCircleIcon className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-700 dark:text-green-300 font-medium">
          Saved {formatTimeAgo(lastSaved)}
        </span>
      </div>
    );
  }

  return null;
};

export default SaveStatusIndicator; 