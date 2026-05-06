import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Optimized media query hook using useSyncExternalStore for better performance
 * and consistency with React 18's concurrent features
 */

// Cache for MediaQueryList instances to avoid recreating them
const mediaQueryLists = new Map<string, MediaQueryList>();

function getMediaQueryList(query: string): MediaQueryList {
  if (!mediaQueryLists.has(query)) {
    mediaQueryLists.set(query, window.matchMedia(query));
  }
  return mediaQueryLists.get(query)!;
}

/**
 * Modern approach using useSyncExternalStore (React 18+)
 * This prevents tearing and ensures consistent state across concurrent renders
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const mql = getMediaQueryList(query);
    
    // Use modern addEventListener if available
    if (mql.addEventListener) {
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    }
    
    // Fallback for older browsers
    mql.addListener(callback);
    return () => mql.removeListener(callback);
  };

  const getSnapshot = () => {
    return getMediaQueryList(query).matches;
  };

  const getServerSnapshot = () => {
    // For SSR, return false by default
    // You can customize this based on your SSR strategy
    return false;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Legacy approach for React <18 (kept for compatibility)
 * Falls back to this if useSyncExternalStore is not available
 */
export function useMediaQueryLegacy(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  return matches;
}

/**
 * Common breakpoint hooks for convenience
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery("(min-width: 1280px)");
}

/**
 * Hook for detecting touch devices
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery("(hover: none) and (pointer: coarse)");
}

/**
 * Hook for detecting reduced motion preference (accessibility)
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Hook for detecting dark mode preference
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}

/**
 * Hook for multiple breakpoints at once
 * Returns an object with all breakpoint states
 */
export function useBreakpoints() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isLargeDesktop = useIsLargeDesktop();

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Computed convenience properties
    isMobileOrTablet: isMobile || isTablet,
    isDesktopOrLarger: isDesktop || isLargeDesktop,
  };
}