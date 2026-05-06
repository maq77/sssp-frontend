export interface RuntimeConfig {
  apiBase: string;
  whepBase: string | null;
  signalrHub: string;
  env: string;
}

// Cache the config to avoid re-computing on every call
let cachedConfig: RuntimeConfig | null = null;
let hasLogged = false;

export function getRuntimeConfig(): RuntimeConfig {
  if (cachedConfig) return cachedConfig;

  const env = import.meta.env.VITE_ENV || 'development';
  const apiBase = import.meta.env.VITE_API_BASE || '/api';
  const signalrHub = import.meta.env.VITE_SIGNALR_HUB || '/hubs/notifications';

  // Simplified WHEP base logic
  const envWhep = import.meta.env.VITE_WHEP_BASE?.trim();
  let whepBase: string | null = null;

  if (envWhep && envWhep.length > 0) {
    // Use explicitly configured WHEP base
    whepBase = envWhep;
  } else if (env === 'development' && typeof window !== 'undefined') {
    // Development fallback - construct from window.location
    whepBase = `${window.location.protocol}//${window.location.hostname}:8889`;
  }
  // Production: null = use relative paths (proxied)

  cachedConfig = {
    apiBase,
    whepBase,
    signalrHub,
    env,
  };

  // Only log once
  if (!hasLogged) {
    console.log('[RuntimeConfig] Initialized:', cachedConfig);
    hasLogged = true;
  }

  return cachedConfig;
}

// Optional: Reset cache (useful for testing)
export function resetRuntimeConfig(): void {
  cachedConfig = null;
}