import { useEffect } from "react";
import signalRService from "@/lib/signalr-service";

export function useRealtimeBootstrap(isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated) return;

    const tokenFactory = () => localStorage.getItem("access_token") ?? "";

    if (!signalRService.isConnected()) {
      signalRService.connect(tokenFactory);
    }
  }, [isAuthenticated]);
}
