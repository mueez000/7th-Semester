import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultBaseUrl = isLocal ? 'http://localhost:5001/api' : '/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    // Check if network error and it's a mutating request (not a GET request and not already from sync queue)
    if (!navigator.onLine || error.message === 'Network Error') {
      if (config && ['post', 'put', 'patch', 'delete'].includes(config.method) && !config.headers['X-From-Sync-Queue']) {
        // Dynamically import to avoid circular dependency
        const { addToSyncQueue } = await import('./syncQueue');
        await addToSyncQueue({
          method: config.method,
          url: config.url,
          data: config.data ? JSON.parse(config.data) : undefined,
        });

        // Show a visual toast/alert or dispatch a custom event
        window.dispatchEvent(new CustomEvent('offline-sync-queued'));

        // Resolve with a fake success so the app doesn't crash
        return Promise.resolve({ data: { success: true, offline: true, message: 'Saved locally. Will sync when online.' } });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
