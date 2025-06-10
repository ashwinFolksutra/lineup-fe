// require('dotenv').config();

// // API base URL - change this based on your environment
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const API_BASE_URL = 'http://localhost:3000/api';

// API endpoints
export const API_ROUTES = {
  // Video related endpoints
  VIDEOS: {
    GET_ALL: `${API_BASE_URL}/videos`,
    GET_BY_ID: (id) => `${API_BASE_URL}/videos/${id}`,
    UPLOAD: `${API_BASE_URL}/videos/upload`,
    DELETE: (id) => `${API_BASE_URL}/videos/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/videos/${id}`,
  },
  
  // Audio related endpoints
  AUDIO: {
    GET_ALL: `${API_BASE_URL}/audio`,
    GET_BY_ID: (id) => `${API_BASE_URL}/audio/${id}`,
    UPLOAD: `${API_BASE_URL}/audio/upload`,
    DELETE: (id) => `${API_BASE_URL}/audio/${id}`,
  },
  
  // Asset related endpoints
  ASSETS: {
    GET_ALL: (project_id) => `${API_BASE_URL}/assets/${project_id}`,
    GET_BY_ID: (project_id, asset_id) => `${API_BASE_URL}/assets/${project_id}/${asset_id}`,
    UPLOAD: `${API_BASE_URL}/assets/`,
    UPDATE: (project_id, asset_id) => `${API_BASE_URL}/assets/${project_id}/${asset_id}`,
    DELETE: (project_id, asset_id) => `${API_BASE_URL}/assets/${project_id}/${asset_id}`,
  },
  
  // Project related endpoints
  PROJECTS: {
    GET_ALL: `${API_BASE_URL}/projects`,
    GET_BY_ID: (id) => `${API_BASE_URL}/projects/${id}`,
    CREATE: `${API_BASE_URL}/projects`,
    UPDATE: (id) => `${API_BASE_URL}/projects/${id}`,
    DELETE: (id) => `${API_BASE_URL}/projects/${id}`,
    SAVE: (id) => `${API_BASE_URL}/projects/${id}/save`,
    EXPORT: (id) => `${API_BASE_URL}/projects/${id}/export`,
  },
  
  // Timeline related endpoints
  TIMELINE: {
    GET_TRACKS: (projectId) => `${API_BASE_URL}/projects/${projectId}/tracks`,
    UPDATE_TRACKS: (projectId) => `${API_BASE_URL}/projects/${projectId}/tracks`,
    ADD_CLIP: (projectId) => `${API_BASE_URL}/projects/${projectId}/clips`,
    UPDATE_CLIP: (projectId, clipId) => `${API_BASE_URL}/projects/${projectId}/clips/${clipId}`,
    DELETE_CLIP: (projectId, clipId) => `${API_BASE_URL}/projects/${projectId}/clips/${clipId}`,
  },
  
  // User related endpoints (if you have user authentication)
  USER: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    PROFILE: `${API_BASE_URL}/user/profile`,
  }
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// API request timeouts
export const API_TIMEOUT = 30000; // 30 seconds 