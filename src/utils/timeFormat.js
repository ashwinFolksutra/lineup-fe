/**
 * Time formatting utilities for the video editor
 */

/**
 * Format seconds into a human-readable time string
 * @param {number} seconds - Time in seconds
 * @param {Object} options - Formatting options
 * @param {boolean} options.showHours - Whether to show hours (default: auto)
 * @param {boolean} options.showMilliseconds - Whether to show milliseconds (default: false)
 * @param {number} options.precision - Decimal places for seconds (default: 1)
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds, options = {}) => {
  const {
    showHours = null,
    showMilliseconds = false,
    precision = 1
  } = options;

  // Handle invalid input
  if (!seconds || isNaN(seconds) || seconds < 0) {
    seconds = 0;
  }

  const totalSeconds = Math.abs(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  // Determine if we should show hours
  const shouldShowHours = showHours !== null ? showHours : hours > 0;

  if (showMilliseconds) {
    const ms = Math.floor((remainingSeconds % 1) * 1000);
    const wholeSeconds = Math.floor(remainingSeconds);
    
    if (shouldShowHours) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${wholeSeconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    } else {
      return `${minutes}:${wholeSeconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
  } else {
    const formattedSeconds = remainingSeconds.toFixed(precision);
    
    if (shouldShowHours) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${formattedSeconds.padStart(precision + 3, '0')}`;
    } else {
      return `${minutes}:${formattedSeconds.padStart(precision + 3, '0')}`;
    }
  }
};

/**
 * Format time for timeline display (shorter format)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string for timeline
 */
export const formatTimelineTime = (seconds) => {
  return formatTime(seconds, { precision: 0 });
};

/**
 * Format duration for display in UI components
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds <= 0) {
    return '0s';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join(' ');
};

/**
 * Parse time string into seconds
 * Supports formats like "1:30", "1:30.5", "90", "1h 30m", etc.
 * @param {string} timeString - Time string to parse
 * @returns {number} Time in seconds
 */
export const parseTimeString = (timeString) => {
  if (!timeString || typeof timeString !== 'string') {
    return 0;
  }

  const str = timeString.trim();
  
  // Handle pure number (seconds)
  if (/^\d+(\.\d+)?$/.test(str)) {
    return parseFloat(str);
  }

  // Handle MM:SS or HH:MM:SS format
  const timeMatch = str.match(/^(\d+):(\d+)(?::(\d+))?(?:\.(\d+))?$/);
  if (timeMatch) {
    const [, h, m, s = 0, ms = 0] = timeMatch;
    
    // If only two parts, treat as MM:SS
    if (!timeMatch[3]) {
      const minutes = parseInt(h, 10);
      const seconds = parseFloat(`${m}.${ms || 0}`);
      return minutes * 60 + seconds;
    } else {
      // HH:MM:SS format
      const hours = parseInt(h, 10);
      const minutes = parseInt(m, 10);
      const seconds = parseFloat(`${s}.${ms || 0}`);
      return hours * 3600 + minutes * 60 + seconds;
    }
  }

  // Handle human-readable format like "1h 30m 45s"
  const humanMatch = str.match(/(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+(?:\.\d+)?)s)?/);
  if (humanMatch) {
    const [, h = 0, m = 0, s = 0] = humanMatch;
    return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseFloat(s);
  }

  return 0;
};

/**
 * Get time at percentage of duration
 * @param {number} percentage - Percentage (0-100)
 * @param {number} duration - Total duration in seconds
 * @returns {number} Time in seconds
 */
export const getTimeAtPercentage = (percentage, duration) => {
  return Math.max(0, Math.min(duration, (percentage / 100) * duration));
};

/**
 * Get percentage of time within duration
 * @param {number} time - Current time in seconds
 * @param {number} duration - Total duration in seconds
 * @returns {number} Percentage (0-100)
 */
export const getPercentageOfTime = (time, duration) => {
  if (!duration || duration <= 0) return 0;
  return Math.max(0, Math.min(100, (time / duration) * 100));
};

/**
 * Round time to nearest frame based on framerate
 * @param {number} time - Time in seconds
 * @param {number} framerate - Frames per second (default: 30)
 * @returns {number} Time rounded to nearest frame
 */
export const snapToFrame = (time, framerate = 30) => {
  const frameTime = 1 / framerate;
  return Math.round(time / frameTime) * frameTime;
};

export default {
  formatTime,
  formatTimelineTime,
  formatDuration,
  parseTimeString,
  getTimeAtPercentage,
  getPercentageOfTime,
  snapToFrame
}; 