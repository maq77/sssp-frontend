import { QueryClient, DefaultOptions } from "@tanstack/react-query";

/**
 * Optimized React Query configuration to prevent excessive API calls
 * and rate limiting
 */

const queryConfig: DefaultOptions = {
  queries: {
    // Prevent automatic refetching on window focus (major source of excess requests)
    refetchOnWindowFocus: false,
    
    // Prevent refetch on component mount if data is fresh
    refetchOnMount: false,
    
    // Don't refetch on reconnect by default
    refetchOnReconnect: false,
    
    // Keep data fresh for 5 minutes (adjustable per query)
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Cache data for 10 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    
    // Retry failed requests with exponential backoff
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry up to 2 times for 5xx errors
      return failureCount < 2;
    },
    
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  
  mutations: {
    // Retry mutations once
    retry: 1,
    retryDelay: 1000,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

/**
 * Query key factories for consistent cache management
 */
export const queryKeys = {
  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // Operators
  operators: {
    all: ["operators"] as const,
    lists: () => [...queryKeys.operators.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.operators.lists(), filters] as const,
    details: () => [...queryKeys.operators.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.operators.details(), id] as const,
  },
  
  // Cameras
  cameras: {
    all: ["cameras"] as const,
    lists: () => [...queryKeys.cameras.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.cameras.lists(), filters] as const,
    details: () => [...queryKeys.cameras.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.cameras.details(), id] as const,
    runtime: () => [...queryKeys.cameras.all, "runtime"] as const,
    status: (id: string) => [...queryKeys.cameras.all, "status", id] as const,
  },
  
  // Incidents
  incidents: {
    all: ["incidents"] as const,
    lists: () => [...queryKeys.incidents.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.incidents.lists(), filters] as const,
    open: () => [...queryKeys.incidents.lists(), { status: "open" }] as const,
    details: () => [...queryKeys.incidents.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.incidents.details(), id] as const,
    stats: () => [...queryKeys.incidents.all, "stats"] as const,
  },
  
  // Dashboard stats
  dashboard: {
    all: ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
    adminStats: () => [...queryKeys.dashboard.all, "admin", "stats"] as const,
  },
} as const;

/**
 * Custom hook configurations for common queries
 */
export const queryOptions = {
  // Real-time data (short stale time, frequent updates via SignalR)
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: false, // Use SignalR instead of polling
  },
  
  // Static/rarely changing data (long stale time)
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },
  
  // Frequently changing data (moderate stale time)
  dynamic: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },
  
  // User-specific data (moderate stale time, refresh on focus)
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  },
} as const;

/**
 * Utility to invalidate related queries after mutations
 */
export const invalidateQueries = {
  users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  operators: () => queryClient.invalidateQueries({ queryKey: queryKeys.operators.all }),
  cameras: () => queryClient.invalidateQueries({ queryKey: queryKeys.cameras.all }),
  incidents: () => queryClient.invalidateQueries({ queryKey: queryKeys.incidents.all }),
  dashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
  
  // Invalidate multiple at once
  all: () => queryClient.invalidateQueries(),
};

/**
 * Pre-configured query hooks examples
 */

// Example usage in a component:
/*
import { useQuery } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '@/lib/query-config';
import apiClient from '@/lib/api-client';

export function useIncidentsOpen() {
  return useQuery({
    queryKey: queryKeys.incidents.open(),
    queryFn: () => apiClient.get('/api/Incident/open'),
    ...queryOptions.realtime, // Use realtime config
  });
}

export function useCameras() {
  return useQuery({
    queryKey: queryKeys.cameras.list(),
    queryFn: () => apiClient.get('/api/Camera'),
    ...queryOptions.dynamic, // Use dynamic config
  });
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: () => apiClient.get('/api/Admin/users'),
    ...queryOptions.static, // Use static config (rarely changes)
  });
}
*/