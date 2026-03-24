import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import i18n from '../i18n/i18n';

declare module 'axios' {
  export interface AxiosRequestConfig {
    customErrorToast?: string;
    skipErrorToast?: boolean;
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      try {
        const currentRefreshToken = useAuthStore.getState().refreshToken;
        if (!currentRefreshToken) throw new Error('No refresh token');
        
        const response = await axios.post(`${baseURL}/auth/refresh`, { refreshToken: currentRefreshToken });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        useAuthStore.getState().setTokens(accessToken, newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        // Only toast if it's not a direct login attempt
        if (!originalRequest.url?.includes('/auth/login')) {
          toast.error(i18n.t('common.sessionExpired', 'Session expired. Please login again.'));
        }
        return Promise.reject(refreshError);
      }
    }
    // Show toast for other errors
    const config = error.config;
    if (!config?.skipErrorToast) {
      if (config?.customErrorToast) {
        toast.error(config.customErrorToast);
      } else {
        const data = error.response?.data;
        const serverMessage = typeof data === 'string' ? data : (data?.message || data?.error);
        const message = serverMessage || error.message || i18n.t('common.error', 'An error occurred');
        toast.error(message);
      }
    }
    
    return Promise.reject(error);
  }
);
