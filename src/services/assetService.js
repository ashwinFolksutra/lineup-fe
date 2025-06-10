import { apiGet, apiPost, apiPut, apiDelete, uploadFile } from './api';
import { API_ROUTES } from '../constants/apiRoutes';

/**
 * Asset Service - Handle asset file operations
 * Assets are files (audio, video, images) that are used in projects
 */

export const assetService = {
  /**
   * Generate a temporary asset ID
   * @returns {string} Temporary asset ID
   */
  generateTempAssetId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${random}`;
  },

  /**
   * Upload an asset file to the server
   * @param {File} file - The file to upload
   * @param {Function} onProgress - Progress callback function
   * @param {Object} metadata - Additional metadata for the asset
   * @returns {Promise} Upload response with asset information
   */
  async uploadAsset(projectId, file, onProgress = null, metadata = {}) {
    try {
      console.log("Project ID", projectId);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      
      // Add metadata to the form data
      if (metadata.name) formData.append('name', metadata.name);
      if (metadata.type) formData.append('type', metadata.type);
      if (metadata.duration) formData.append('duration', metadata.duration.toString());
      if (metadata.size) formData.append('size', metadata.size.toString());
      if (metadata.tempId) formData.append('tempId', metadata.tempId);

      const response = await uploadFile(API_ROUTES.ASSETS.UPLOAD, formData, onProgress);
      return response;
    } catch (error) {
      console.error('Asset upload failed:', error);
      throw error;
    }
  },

  /**
   * Process audio file to extract metadata
   * @param {File} file - Audio file to process
   * @returns {Promise} Object with audio metadata
   */
  async processAudioFile(file) {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        resolve({
          name: file.name,
          duration: audio.duration,
          size: file.size,
          type: file.type,
          originalName: file.name
        });
      };
      
      audio.onerror = () => {
        reject(new Error('Failed to process audio file'));
      };
      
      audio.src = URL.createObjectURL(file);
    });
  },

  /**
   * Upload audio asset with metadata extraction
   * @param {File} file - Audio file to upload
   * @param {string} tempId - Temporary asset ID
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} Upload response
   */
  async uploadAudioAsset(projectId, file, tempId, onProgress = null) {
    try {
      // First, process the file to get metadata
      const metadata = await this.processAudioFile(file);
      
      // Add temp ID to metadata
      metadata.tempId = tempId;
      metadata.assetType = 'audio';
      
      // Upload the file with metadata
      return await this.uploadAsset(projectId, file, onProgress, metadata);
    } catch (error) {
      console.error('Audio asset upload failed:', error);
      throw error;
    }
  },

  /**
   * Get all assets
   * @returns {Promise} Array of assets
   */
  async getAllAssets() {
    const response = await apiGet(API_ROUTES.ASSETS.GET_ALL);
    return response.assets || [];
  },

  /**
   * Get asset by ID
   * @param {string} assetId - Asset ID
   * @returns {Promise} Asset data
   */
  async getAssetById(assetId) {
    return await apiGet(API_ROUTES.ASSETS.GET_BY_ID(assetId));
  },

  /**
   * Update asset metadata
   * @param {string} assetId - Asset ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise} Updated asset data
   */
  async updateAsset(assetId, updates) {
    return await apiPut(API_ROUTES.ASSETS.UPDATE(assetId), updates);
  },

  /**
   * Delete an asset
   * @param {string} assetId - Asset ID
   * @returns {Promise} Delete response
   */
  async deleteAsset(assetId) {
    return await apiDelete(API_ROUTES.ASSETS.DELETE(assetId));
  },

  /**
   * Create a temporary asset reference before upload
   * This allows the UI to show the asset immediately while upload happens in background
   * @param {File} file - The file
   * @param {string} tempId - Temporary asset ID
   * @returns {Object} Temporary asset object
   */
  createTempAssetReference(file, tempId) {
    return {
      id: tempId,
      tempId: tempId,
      name: file.name,
      originalName: file.name,
      type: file.type,
      size: file.size,
      assetType: file.type.startsWith('audio/') ? 'audio' : 'unknown',
      isUploading: true,
      uploadProgress: 0,
      file: file, // Keep reference to file for ObjectURL creation
      url: null, // Will be set after upload
      createdAt: new Date().toISOString()
    };
  }
};

export default assetService; 