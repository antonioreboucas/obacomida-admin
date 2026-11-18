// API Client for Oba Comida Central Admin (FastAPI + PostgreSQL)

const STORAGE_KEYS = {
  TOKEN: 'obacomida_access_token',
  REFRESH_TOKEN: 'obacomida_refresh_token',
  API_URL: 'obacomida_api_url',
};

export const DEFAULT_API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const isMockEnabled = (): boolean => {
  return import.meta.env.VITE_USE_MOCK === 'true';
};

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type ApiStatusListener = (connected: boolean, url: string) => void;

class ApiClient {
  private baseUrl: string;
  private statusListeners: Set<ApiStatusListener> = new Set();
  private isOnline: boolean = false;
  private onUnauthorizedCallback?: () => void;

  constructor() {
    this.baseUrl = this.getStoredBaseUrl();
  }

  public getStoredBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.API_URL);
      if (stored) return stored;

      // In production environment (e.g. Vercel), default to Railway API
      if (
        window.location.hostname &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        return 'https://web-oba-api.up.railway.app/api/v1';
      }
    }
    return DEFAULT_API_URL;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.trim().replace(/\/+$/, '');
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

  public onUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
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

  /**
   * Health check to probe whether the FastAPI backend is currently reachable
   */
  public async checkHealth(): Promise<{ connected: boolean; url: string; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      // Probe health endpoint or root of API
      const rootUrl = this.baseUrl.replace(/\/api\/v1\/?$/, '');
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }).catch(async () => {
        // Fallback probe to root OpenAPI docs / docs
        return fetch(`${rootUrl}/docs`, {
          signal: controller.signal,
          method: 'HEAD',
        });
      });

      clearTimeout(timeoutId);

      const ok = res.status < 500;
      this.isOnline = ok;
      this.notifyStatus();
      return { connected: ok, url: this.baseUrl };
    } catch (err: any) {
      this.isOnline = false;
      this.notifyStatus();
      return {
        connected: false,
        url: this.baseUrl,
        error: err.name === 'AbortError' ? 'Tempo de conexão esgotado (Timeout)' : err.message,
      };
    }
  }

  public async request<T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      params?: Record<string, any>;
      headers?: Record<string, string>;
      isFormData?: boolean;
      isRefreshAttempt?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params, headers = {}, isFormData = false, isRefreshAttempt = false } = options;

    // Construct URL with query parameters
    let url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    const requestHeaders: Record<string, string> = { ...headers };

    if (!isFormData && body && typeof body === 'object') {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token && !requestHeaders['Authorization']) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      });

      // Parse body first so error details and data are accessible
      const contentType = response.headers.get('content-type') || '';
      let data: any = null;

      if (response.status !== 204) {
        if (contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch {
            data = null;
          }
        } else {
          try {
            data = await response.text();
          } catch {
            data = null;
          }
        }
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        const isAuthEndpoint =
          endpoint.includes('/auth/login') ||
          endpoint.includes('/auth/register') ||
          endpoint.includes('/auth/forgot-password');

        if (isAuthEndpoint) {
          const errorMsg =
            data?.error?.message ||
            data?.detail ||
            data?.message ||
            'E-mail ou senha incorretos.';
          throw new ApiError(errorMsg, 401, data);
        }

        // Token refresh rotation for protected endpoints
        const refreshToken = this.getRefreshToken();
        if (refreshToken && !isRefreshAttempt && !endpoint.includes('/auth/refresh')) {
          try {
            const refreshRes = await this.request<any>('/auth/refresh', {
              method: 'POST',
              body: { refresh_token: refreshToken },
              isRefreshAttempt: true,
            });

            const newAccessToken =
              refreshRes?.data?.access_token ||
              refreshRes?.access_token ||
              refreshRes?.token;

            if (newAccessToken) {
              this.setToken(newAccessToken);
              const newRefreshToken =
                refreshRes?.data?.refresh_token ||
                refreshRes?.refresh_token;
              if (newRefreshToken) {
                this.setRefreshToken(newRefreshToken);
              }
              const retryHeaders = { ...headers, Authorization: `Bearer ${newAccessToken}` };
              return await this.request<T>(endpoint, {
                ...options,
                headers: retryHeaders,
                isRefreshAttempt: true,
              });
            }
          } catch (refreshErr) {
            console.warn('Falha na renovação via POST /auth/refresh:', refreshErr);
          }
        }

        this.clearToken();
        if (this.onUnauthorizedCallback) {
          this.onUnauthorizedCallback();
        }
        const errorMsg =
          data?.error?.message ||
          data?.detail ||
          data?.message ||
          'Sessão expirada ou não autorizada. Faça login novamente.';
        throw new ApiError(errorMsg, 401, data);
      }

      // Check if response is empty (204)
      if (response.status === 204) {
        this.isOnline = true;
        return {} as T;
      }

      if (!response.ok) {
        const errorDetail =
          data?.error?.message ||
          data?.detail ||
          data?.message ||
          (typeof data === 'string' ? data : `Erro ${response.status}: ${response.statusText}`);
        throw new ApiError(errorDetail, response.status, data);
      }

      this.isOnline = true;

      // Automatically unwrap FastAPI standard envelope: { success: true, data: ..., message: "..." }
      if (data && typeof data === 'object' && data.success === true && data.data !== undefined) {
        return data.data as T;
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }

      // Network error or server offline
      this.isOnline = false;
      this.notifyStatus();
      throw new ApiError(
        `Falha de conexão com a API (${this.baseUrl}): ${err.message || 'Servidor indisponível'}`,
        0,
        err
      );
    }
  }

  // Convenience methods
  public get<T>(endpoint: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params, headers });
  }

  public post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  public put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  public patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  }

  public delete<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', params });
  }

  public upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  }
}

export const api = new ApiClient();
