import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";
import { getRuntimeConfig } from "@/lib/config/runtimeConfig";

const { apiBase } = getRuntimeConfig();

export type ApiErrorBody =
  | { message?: string; Message?: string; details?: string; Details?: string }
  | Record<string, unknown>
  | string
  | null;

export function getErrorMessage(err: unknown, fallback = "Request failed") {
  if (isAxiosError(err)) {
    const data = err.response?.data as ApiErrorBody;
    if (typeof data === "string" && data.trim()) return data;

    if (data && typeof data === "object") {
      const msg = (data as any).message ?? (data as any).Message;
      if (typeof msg === "string" && msg.trim()) return msg;

      const details = (data as any).details ?? (data as any).Details;
      if (typeof details === "string" && details.trim()) return details;
    }

    return err.message || fallback;
  }

  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

export function getErrorStatus(err: unknown): number | undefined {
  if (isAxiosError(err)) return err.response?.status;
  return undefined;
}

// In-memory cache for GET requests
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  getPending<T>(key: string): Promise<T> | null {
    return this.pendingRequests.get(key) || null;
  }

  setPending<T>(key: string, promise: Promise<T>): void {
    this.pendingRequests.set(key, promise);
    promise.finally(() => this.pendingRequests.delete(key));
  }
}

class ApiClient {
  private client: AxiosInstance;
  private cache = new RequestCache();
  
  // Default cache TTL: 30 seconds (prevents excessive requests)
  private defaultCacheTTL = 30000;

  constructor() {
    this.client = axios.create({
      baseURL: apiBase || "",
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          (config.headers as any) = {
            ...(config.headers as any),
            Authorization: `Bearer ${token}`,
          };
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getCacheKey(url: string, params?: Record<string, unknown>): string {
    const paramStr = params ? JSON.stringify(params) : "";
    return `${url}${paramStr}`;
  }

  raw(): AxiosInstance {
    return this.client;
  }

  /**
   * Invalidate cache by pattern
   * Example: invalidateCache('/api/Camera') - clears all camera-related cache
   */
  invalidateCache(pattern?: string): void {
    this.cache.invalidate(pattern);
  }

  async get<T>(
    url: string, 
    params?: Record<string, unknown>,
    options?: { cache?: boolean; cacheTTL?: number }
  ): Promise<T> {
    const useCache = options?.cache ?? true;
    const cacheTTL = options?.cacheTTL ?? this.defaultCacheTTL;
    const cacheKey = this.getCacheKey(url, params);

    // Check cache first
    if (useCache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) return cached;

      // Check if request is already in flight (request deduplication)
      const pending = this.cache.getPending<T>(cacheKey);
      if (pending) return pending;
    }

    // Make request
    const promise = this.client.get<T>(url, { params }).then(response => {
      if (useCache) {
        this.cache.set(cacheKey, response.data, cacheTTL);
      }
      return response.data;
    });

    if (useCache) {
      this.cache.setPending(cacheKey, promise);
    }

    return promise;
  }

  async post<T, D = unknown>(url: string, data?: D): Promise<T> {
    // Invalidate related GET cache on POST
    this.cache.invalidate(url.split('?')[0]);
    
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T, D = unknown>(url: string, data?: D): Promise<T> {
    this.cache.invalidate(url.split('?')[0]);
    
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T, D = unknown>(url: string, data?: D): Promise<T> {
    this.cache.invalidate(url.split('?')[0]);
    
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    this.cache.invalidate(url.split('?')[0]);
    
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  async postFormData<T>(url: string, formData: FormData): Promise<T> {
    this.cache.invalidate(url.split('?')[0]);
    
    const response = await this.client.post<T>(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;