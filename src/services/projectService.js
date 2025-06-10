import { apiGet, apiPost, apiPut, apiDelete, uploadFile } from './api';
import { API_ROUTES } from '../constants/apiRoutes';

/**
 * Project Service - Higher level API abstractions for project operations
 */

export const projectService = {
  // Project CRUD operations
  async getAllProjects() {
    const response = await apiGet(API_ROUTES.PROJECTS.GET_ALL);
    return response.data || [];
  },

  async getProjectById(projectId) {
    return await apiGet(API_ROUTES.PROJECTS.GET_BY_ID(projectId));
  },

  async createProject(projectData) {
    const defaultSettings = {
      resolution: '1920x1080',
      frameRate: 30,
      audioSampleRate: 44100,
      ...projectData.settings
    };

    return await apiPost(API_ROUTES.PROJECTS.CREATE, {
      ...projectData,
      settings: defaultSettings
    });
  },

  async updateProject(projectId, updates) {
    return await apiPut(API_ROUTES.PROJECTS.UPDATE(projectId), updates);
  },

  async deleteProject(projectId) {
    return await apiDelete(API_ROUTES.PROJECTS.DELETE(projectId));
  },

  async saveProject(projectId, projectData) {
    return await apiPost(API_ROUTES.PROJECTS.SAVE(projectId), projectData);
  },

  async exportProject(projectId, exportSettings = {}) {
    const defaultExportSettings = {
      format: 'mp4',
      quality: 'high',
      resolution: '1920x1080',
      ...exportSettings
    };

    return await apiPost(API_ROUTES.PROJECTS.EXPORT(projectId), defaultExportSettings);
  },

  // Timeline operations
  async getProjectTracks(projectId) {
    return await apiGet(API_ROUTES.TIMELINE.GET_TRACKS(projectId));
  },

  async updateProjectTracks(projectId, tracks) {
    return await apiPut(API_ROUTES.TIMELINE.UPDATE_TRACKS(projectId), { tracks });
  },

  async addClipToProject(projectId, clipData) {
    return await apiPost(API_ROUTES.TIMELINE.ADD_CLIP(projectId), clipData);
  },

  async updateClipInProject(projectId, clipId, updates) {
    return await apiPut(API_ROUTES.TIMELINE.UPDATE_CLIP(projectId, clipId), updates);
  },

  async deleteClipFromProject(projectId, clipId) {
    return await apiDelete(API_ROUTES.TIMELINE.DELETE_CLIP(projectId, clipId));
  }
};

/**
 * Media Service - Handle media file operations
 */
export const mediaService = {
  // Video operations
  async getAllVideos() {
    const response = await apiGet(API_ROUTES.VIDEOS.GET_ALL);
    return response.videos || [];
  },

  async uploadVideo(file, onProgress = null) {
    return await uploadFile(API_ROUTES.VIDEOS.UPLOAD, file, onProgress);
  },

  async deleteVideo(videoId) {
    return await apiDelete(API_ROUTES.VIDEOS.DELETE(videoId));
  },

  // Audio operations
  async getAllAudios() {
    const response = await apiGet(API_ROUTES.AUDIO.GET_ALL);
    return response.audios || [];
  },

  async uploadAudio(file, onProgress = null) {
    return await uploadFile(API_ROUTES.AUDIO.UPLOAD, file, onProgress);
  },

  async deleteAudio(audioId) {
    return await apiDelete(API_ROUTES.AUDIO.DELETE(audioId));
  },

  // Utility functions for media handling
  async processVideoFile(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve({
          name: file.name,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          type: file.type
        });
      };
      
      video.onerror = () => {
        reject(new Error('Failed to process video file'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  },

  async processAudioFile(file) {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        resolve({
          name: file.name,
          duration: audio.duration,
          size: file.size,
          type: file.type
        });
      };
      
      audio.onerror = () => {
        reject(new Error('Failed to process audio file'));
      };
      
      audio.src = URL.createObjectURL(file);
    });
  }
};

/**
 * User Service - Handle user-related operations (if authentication is needed)
 */
export const userService = {
  async login(credentials) {
    const response = await apiPost(API_ROUTES.USER.LOGIN, credentials);
    
    // Store auth token if login successful
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    
    return response;
  },

  async register(userData) {
    return await apiPost(API_ROUTES.USER.REGISTER, userData);
  },

  async logout() {
    await apiPost(API_ROUTES.USER.LOGOUT);
    localStorage.removeItem('authToken');
  },

  async getProfile() {
    return await apiGet(API_ROUTES.USER.PROFILE);
  },

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }
}; 