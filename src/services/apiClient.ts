import axios from 'axios';
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse, LoginResponseData, UserResponse } from '../types/api';

export const STORAGE_KEYS = {
  TOKEN: 'obacomida_access_token',
  REFRESH_TOKEN: 'obacomida_refresh_token',
  API_URL: 'obacomida_api_url',
};

// Base URL resolution: NEXT_PUBLIC_API_URL -> VITE_API_URL -> default
export const getEnvApiUrl = (): string => {
  const envNext = typeof import.meta !== 'undefined' ? (import.meta.env as any)?.NEXT_PUBLIC_API_URL : undefined;
  const envVite = typeof import.meta !== 'undefined' ? (import.meta.env as any)?.VITE_API_URL : undefined;
  const processEnv = typeof globalThis !== 'undefined' ? (globalThis as any).process?.env : undefined;

  return (
    envNext ||
    envVite ||
    processEnv?.NEXT_PUBLIC_API_URL ||
    processEnv?.VITE_API_URL ||
    'http://localhost:8000/api/v1'
  );
};

export const isMockEnabled = (): boolean => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCK === 'true') {
    return true;
  }
  return false;
};

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public data: any;
  public details?: Array<{ loc?: string[]; msg: string; type?: string }>;

  constructor(message: string, status: number, data?: any, code?: string, details?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = code;
    this.details = details;
  }
}

type ApiStatusListener = (connected: boolean, url: string) => void;
type UnauthorizedListener = () => void;
type ForbiddenListener = (message?: string) => void;

interface QueuedPromise {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private failedQueue: QueuedPromise[] = [];
  private statusListeners: Set<ApiStatusListener> = new Set();
  private unauthorizedListeners: Set<UnauthorizedListener> = new Set();
  private forbiddenListeners: Set<ForbiddenListener> = new Set();
  private isOnline: boolean = false;

  constructor() {
    this.baseUrl = this.getStoredBaseUrl();

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 20000,
    });

    this.setupInterceptors();
  }

  public getStoredBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.API_URL);
      if (stored) return stored.trim().replace(/\/+$/, '');

      // In hosted/production environment, default to Railway production API
      if (
        window.location.hostname &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        return 'https://web-oba-api.up.railway.app/api/v1';
      }
    }
    return getEnvApiUrl().trim().replace(/\/+$/, '');
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.trim().replace(/\/+$/, '');
    this.axiosInstance.defaults.baseURL = this.baseUrl;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.API_URL, this.baseUrl);
    }
    this.notifyStatus();
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  public setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  public getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  public setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  public clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  public onUnauthorized(callback: UnauthorizedListener) {
    this.unauthorizedListeners.add(callback);
    return () => this.unauthorizedListeners.delete(callback);
  }

  public onForbidden(callback: ForbiddenListener) {
    this.forbiddenListeners.add(callback);
    return () => this.forbiddenListeners.delete(callback);
  }

  public onStatusChange(listener: ApiStatusListener) {
    this.statusListeners.add(listener);
    listener(this.isOnline, this.baseUrl);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus() {
    this.statusListeners.forEach((listener) => listener(this.isOnline, this.baseUrl));
  }

  private notifyUnauthorized() {
    this.unauthorizedListeners.forEach((callback) => callback());
  }

  private notifyForbidden(message?: string) {
    this.forbiddenListeners.forEach((callback) => callback(message));
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else if (token) {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private setupInterceptors() {
    // Request Interceptor: Attach Authorization header
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor: Handle unwrap, 401 refresh token lifecycle, 403 RBAC
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.isOnline = true;
        return response;
      },
      async (error) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (!error.response) {
          // Network Error or Server Offline
          this.isOnline = false;
          this.notifyStatus();
          return Promise.reject(
            new ApiError(
              `Falha de conexão com a API (${this.baseUrl}): Servidor indisponível ou offline.`,
              0,
              error
            )
          );
        }

        const status = error.response.status;
        const data = error.response.data;

        // Parse standard error message and details
        let errorMessage = 'Ocorreu um erro na requisição.';
        let errorCode: string | undefined = undefined;
        let errorDetails: any[] | undefined = undefined;

        if (data && typeof data === 'object') {
          if (data.error && typeof data.error === 'object') {
            errorMessage = data.error.message || errorMessage;
            errorCode = data.error.code;
            errorDetails = data.error.details;
          } else if (data.detail) {
            if (typeof data.detail === 'string') {
              errorMessage = data.detail;
            } else if (Array.isArray(data.detail)) {
              // FastAPI Pydantic ValidationError
              errorDetails = data.detail;
              const firstErr = data.detail[0];
              errorMessage = firstErr?.msg ? `${firstErr.msg} (${firstErr.loc?.join('.')})` : errorMessage;
            }
          } else if (data.message) {
            errorMessage = data.message;
          }
        }

        // 403 Forbidden: RBAC check
        if (status === 403) {
          this.notifyForbidden(errorMessage || 'Acesso negado: Perfil de administrador necessário.');
          return Promise.reject(new ApiError(errorMessage || 'Acesso negado', 403, data, errorCode, errorDetails));
        }

        // 401 Unauthorized handling
        if (status === 401 && originalRequest) {
          const requestUrl = originalRequest.url || '';
          const isAuthEndpoint =
            requestUrl.includes('/auth/login') ||
            requestUrl.includes('/auth/register') ||
            requestUrl.includes('/auth/forgot-password');

          if (isAuthEndpoint) {
            return Promise.reject(
              new ApiError(errorMessage || 'E-mail ou senha incorretos.', 401, data, errorCode)
            );
          }

          // If request is already the refresh attempt, renewal failed! Clear session & redirect
          if (requestUrl.includes('/auth/refresh') || originalRequest._retry) {
            this.clearToken();
            this.notifyUnauthorized();
            return Promise.reject(
              new ApiError('Sessão expirada. Faça login novamente.', 401, data, 'TOKEN_EXPIRED')
            );
          }

          // Automatic Token Renewal Queue
          const refreshToken = this.getRefreshToken();
          if (!refreshToken) {
            this.clearToken();
            this.notifyUnauthorized();
            return Promise.reject(
              new ApiError('Sessão inválida ou sem refresh token.', 401, data, 'UNAUTHORIZED')
            );
          }

          if (this.isRefreshing) {
            // Another request is already refreshing the token, wait for it
            return new Promise<AxiosResponse>((resolve, reject) => {
              this.failedQueue.push({
                resolve: (newToken: string) => {
                  if (originalRequest.headers) {
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                  }
                  resolve(this.axiosInstance(originalRequest));
                },
                reject: (err: any) => reject(err),
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Direct POST to refresh without interceptor infinite loop
            const refreshRes = await axios.post<ApiResponse<LoginResponseData> | LoginResponseData>(
              `${this.baseUrl}/auth/refresh`,
              { refresh_token: refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );

            const refreshData: any = refreshRes.data;
            const tokenPayload: LoginResponseData =
              refreshData && refreshData.success && refreshData.data
                ? refreshData.data
                : refreshData;

            const newAccessToken = tokenPayload?.access_token;
            const newRefreshToken = tokenPayload?.refresh_token;

            if (!newAccessToken) {
              throw new Error('Novo token não retornado pelo servidor.');
            }

            this.setToken(newAccessToken);
            if (newRefreshToken) {
              this.setRefreshToken(newRefreshToken);
            }

            // Update Authorization header for original request
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            }

            this.processQueue(null, newAccessToken);
            this.isRefreshing = false;

            return this.axiosInstance(originalRequest);
          } catch (refreshErr) {
            this.processQueue(refreshErr, null);
            this.isRefreshing = false;
            this.clearToken();
            this.notifyUnauthorized();
            return Promise.reject(
              new ApiError('Falha ao renovar credenciais de acesso.', 401, refreshErr, 'REFRESH_FAILED')
            );
          }
        }

        return Promise.reject(new ApiError(errorMessage, status, data, errorCode, errorDetails));
      }
    );
  }

  /**
   * Health check to probe whether the FastAPI backend is currently reachable
   */
  public async checkHealth(): Promise<{ connected: boolean; url: string; error?: string }> {
    try {
      const res = await axios.get(`${this.baseUrl}/health`, {
        timeout: 3000,
        validateStatus: () => true,
      });

      const ok = res.status < 500;
      this.isOnline = ok;
      this.notifyStatus();
      return { connected: ok, url: this.baseUrl };
    } catch (err: any) {
      // Fallback probe to root OpenAPI docs
      try {
        const rootUrl = this.baseUrl.replace(/\/api\/v1\/?$/, '');
        const docsRes = await axios.get(`${rootUrl}/docs`, {
          timeout: 3000,
          validateStatus: () => true,
        });
        const ok = docsRes.status < 500;
        this.isOnline = ok;
        this.notifyStatus();
        return { connected: ok, url: this.baseUrl };
      } catch {
        this.isOnline = false;
        this.notifyStatus();
        return {
          connected: false,
          url: this.baseUrl,
          error: err.code === 'ECONNABORTED' ? 'Tempo de conexão esgotado (Timeout)' : err.message,
        };
      }
    }
  }

  /**
   * Flexible request method supporting either:
   * 1. request<T>(config: AxiosRequestConfig)
   * 2. request<T>(endpoint: string, options?: AxiosRequestConfig)
   */
  public async request<T = any>(
    endpointOrConfig: string | AxiosRequestConfig,
    options?: AxiosRequestConfig & {
      body?: any;
      params?: Record<string, any>;
      isFormData?: boolean;
    }
  ): Promise<T> {
    let finalConfig: AxiosRequestConfig;

    if (typeof endpointOrConfig === 'string') {
      const { body, ...restOptions } = options || {};
      finalConfig = {
        url: endpointOrConfig,
        data: body !== undefined ? body : restOptions.data,
        ...restOptions,
      };
    } else {
      finalConfig = endpointOrConfig;
    }

    const response = await this.axiosInstance.request<ApiResponse<T> | T>(finalConfig);
    const data = response.data;

    // Standard unwrap: if { success: true, data: T, message: "..." }
    if (data && typeof data === 'object' && 'success' in data && (data as ApiResponse<T>).success === true) {
      return (data as ApiResponse<T>).data;
    }

    return data as T;
  }

  // HTTP Helper Methods

  public async get<T>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
      ...config,
    });
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }

  public async delete<T>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      url,
      params,
      ...config,
    });
  }

  /**
   * Multipart/form-data upload helper for POST /uploads/image?category=...
   */
  public async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(config?.headers || {}),
      },
      ...config,
    });
  }

  /**
   * Validates if current user returned by GET /auth/me has ADMIN or SUPER_ADMIN role
   */
  public validateAdminAccess(user: UserResponse): boolean {
    if (!user || !user.roles) return false;
    const adminRoles: string[] = ['ADMIN', 'SUPER_ADMIN'];
    return user.roles.some((role) => adminRoles.includes(role.toUpperCase()));
  }
}

export const api = new ApiClient();
export default api;
