import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { GlobalSecurityBanner } from "@/components/security/GlobalSecurityBanner";
import { useRealtimeBootstrap } from "@/hooks/useRealtimeBootstrap";
import { useAuthStore } from "@/store/authStore";
import { useMediaQuery } from "./useMediaQuery";

const LS_KEY = "sssp.sidebarCollapsed";

// Memoized outlet wrapper to prevent unnecessary re-renders
const MemoizedOutlet = memo(() => <Outlet />);
MemoizedOutlet.displayName = "MemoizedOutlet";

// Memoized animated content wrapper
const AnimatedContent = memo(({ children, pathname }: { children: React.ReactNode; pathname: string }) => (
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
));
AnimatedContent.displayName = "AnimatedContent";

// Memoized background (static, no need to re-render)
const BackgroundEffects = memo(() => (
  <div className="fixed inset-0 pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-background to-purple-950/20" />
    <div className="absolute top-[-120px] left-[10%] w-[520px] h-[520px] bg-blue-500/10 rounded-full blur-3xl" />
    <div className="absolute bottom-[-120px] right-[10%] w-[520px] h-[520px] bg-purple-500/10 rounded-full blur-3xl" />
  </div>
));
BackgroundEffects.displayName = "BackgroundEffects";

// Memoized mobile overlay
const MobileOverlay = memo(({ onClose }: { onClose: () => void }) => (
  <motion.button
    type="button"
    aria-label="Close sidebar"
    onClick={onClose}
    className="fixed inset-0 z-40 bg-black/60"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  />
));
MobileOverlay.displayName = "MobileOverlay";

// Memoized mobile drawer
const MobileDrawer = memo(({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) => (
  <motion.aside
    role="dialog"
    aria-modal="true"
    aria-label="Sidebar"
    className="fixed z-50 left-0 top-0 h-full w-[min(86vw,320px)]"
    initial={{ x: -360 }}
    animate={{ x: 0 }}
    exit={{ x: -360 }}
    transition={{ type: "spring", stiffness: 320, damping: 34 }}
  >
    <div className="pt-16 h-full">
      <div className="h-[calc(100%-4rem)] shadow-2xl">
        <Sidebar collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </div>
  </motion.aside>
));
MobileDrawer.displayName = "MobileDrawer";

export const MainLayout = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useRealtimeBootstrap(isAuthenticated);

  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    const stored = localStorage.getItem(LS_KEY);
    return stored === "1";
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem(LS_KEY, desktopCollapsed ? "1" : "0");
  }, [desktopCollapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile drawer when switching to desktop
  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  // Callbacks (stable references)
  const handleOpenMobileSidebar = useCallback(() => setMobileOpen(true), []);
  const handleCloseMobileSidebar = useCallback(() => setMobileOpen(false), []);
  const handleToggleDesktopCollapse = useCallback(() => setDesktopCollapsed(v => !v), []);

  const sidebarWidth = useMemo(() => (desktopCollapsed ? 88 : 280), [desktopCollapsed]);

  return (
    <div className="min-h-screen bg-background">
      <GlobalSecurityBanner />
      <BackgroundEffects />

      <Header
        onOpenMobileSidebar={handleOpenMobileSidebar}
        onToggleDesktopCollapse={handleToggleDesktopCollapse}
        isDesktopCollapsed={desktopCollapsed}
      />

      <div
        className="relative z-10"
        style={{ ["--sidebar-w" as any]: `${sidebarWidth}px` }}
      >
        {/* Desktop layout */}
        <div className="hidden lg:grid lg:grid-cols-[var(--sidebar-w)_1fr]">
          <aside className="sticky top-16 h-[calc(100vh-4rem)]">
            <Sidebar collapsed={desktopCollapsed} />
          </aside>

          <main
            id="main-content"
            className="min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8"
          >
            <AnimatedContent pathname={location.pathname}>
              <MemoizedOutlet />
            </AnimatedContent>
          </main>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden">
          <main id="main-content" className="px-4 sm:px-6 py-6">
            <AnimatedContent pathname={location.pathname}>
              <MemoizedOutlet />
            </AnimatedContent>
          </main>

          {/* Mobile drawer with AnimatePresence inline to avoid import issues */}
          {mobileOpen && (
            <>
              <MobileOverlay onClose={handleCloseMobileSidebar} />
              <MobileDrawer collapsed={false} onNavigate={handleCloseMobileSidebar} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};