import { API_TIMEOUT, HTTP_STATUS } from '../constants/apiRoutes.js';

// Generic API error class
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Default headers for API requests
const getDefaultHeaders = () => ({
  'Content-Type': 'application/json',
  // Add authentication header if user is logged in
  ...(localStorage.getItem('authToken') && {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  })
});

// Generic request handler with timeout and error handling
const apiRequest = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getDefaultHeaders(),
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle different HTTP status codes
    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // If response isn't JSON, use status text
        errorData = { message: response.statusText };
      }

      throw new ApiError(
        errorData.message || `HTTP Error: ${response.status}`,
        response.status,
        errorData
      );
    }

    // Handle no content responses
    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return null;
    }

    // Try to parse JSON response
    try {
      return await response.json();
    } catch {
      // If response isn't JSON, return response text
      return await response.text();
    }

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error.message || 'Network error occurred',
      0,
      { originalError: error }
    );
  }
};

// GET request helper
export const apiGet = async (url, options = {}) => {
  return apiRequest(url, {
    method: 'GET',
    ...options,
  });
};

// POST request helper
export const apiPost = async (url, data = null, options = {}) => {
  const requestOptions = {
    method: 'POST',
    ...options,
  };

  // Handle different types of data
  if (data instanceof FormData) {
    // For file uploads, don't set Content-Type header (browser will set it with boundary)
    requestOptions.body = data;
    // Remove Content-Type header for FormData
    const { 'Content-Type': removed, ...restHeaders } = getDefaultHeaders();
    requestOptions.headers = {
      ...restHeaders,
      ...options.headers,
    };
  } else if (data !== null) {
    requestOptions.body = JSON.stringify(data);
  }

  return apiRequest(url, requestOptions);
};

// PUT request helper
export const apiPut = async (url, data = null, options = {}) => {
  const requestOptions = {
    method: 'PUT',
    ...options,
  };

  if (data instanceof FormData) {
    requestOptions.body = data;
    const { 'Content-Type': removed, ...restHeaders } = getDefaultHeaders();
    requestOptions.headers = {
      ...restHeaders,
      ...options.headers,
    };
  } else if (data !== null) {
    requestOptions.body = JSON.stringify(data);
  }

  return apiRequest(url, requestOptions);
};

// DELETE request helper
export const apiDelete = async (url, options = {}) => {
  return apiRequest(url, {
    method: 'DELETE',
    ...options,
  });
};

// PATCH request helper
export const apiPatch = async (url, data = null, options = {}) => {
  const requestOptions = {
    method: 'PATCH',
    ...options,
  };

  if (data !== null) {
    requestOptions.body = JSON.stringify(data);
  }

  return apiRequest(url, requestOptions);
};

// Utility function for handling file uploads with progress
export const uploadFile = async (url, formData, onProgress = null) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Add auth header if available
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(new ApiError(`Upload failed: ${xhr.statusText}`, xhr.status));
      }
    };

    xhr.onerror = () => {
      reject(new ApiError('Upload failed', 0));
    };

    xhr.open('POST', url);
    xhr.send(formData);
  });
};

// Helper function to handle API errors in components
export const handleApiError = (error, showToast = null) => {
  console.error('API Error:', error);
  
  let message = 'An unexpected error occurred';
  
  if (error instanceof ApiError) {
    switch (error.status) {
      case HTTP_STATUS.UNAUTHORIZED:
        message = 'Please log in to continue';
        // Optionally redirect to login
        break;
      case HTTP_STATUS.FORBIDDEN:
        message = 'You don\'t have permission to perform this action';
        break;
      case HTTP_STATUS.NOT_FOUND:
        message = 'The requested resource was not found';
        break;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        message = 'Server error. Please try again later';
        break;
      case 408:
        message = 'Request timeout. Please check your connection';
        break;
      default:
        message = error.message || message;
    }
  }
  
  // If you have a toast notification system, use it
  if (showToast) {
    showToast(message, 'error');
  }
  
  return message;
}; 