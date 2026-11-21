// Centralized API Client (Axios + Refresh Token Interceptor + Envelope Unwrapping)
export * from './apiClient';
import { api, getEnvApiUrl } from './apiClient';

export const DEFAULT_API_URL = getEnvApiUrl();
export default api;
