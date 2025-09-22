/**
 * API Configuration for Ignite E-commerce
 * Handles all API requests with base URL and auth headers
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiConfig = {
  baseUrl: API_URL.replace(/\/+$/, ''), // clean trailing slash
  headers: {
    'Content-Type': 'application/json',
  },
  getAuthHeaders: (): Record<string, string> => {
    const token = localStorage.getItem('ignite_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

/**
 * Generic fetch wrapper with error handling
 */
export const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Ensure leading slash is removed from endpoint
  const sanitizedEndpoint = endpoint.replace(/^\/+/, '');

  const url = `${apiConfig.baseUrl}/${sanitizedEndpoint}`;

  const headers = {
    ...apiConfig.headers,
    ...options.headers,
    ...apiConfig.getAuthHeaders(),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // for cookies or sessions
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API Error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  } catch (error: any) {
    console.error(`❌ API Fetch Failed [${url}]`, error.message);
    throw error;
  }
};

export default fetchApi;
