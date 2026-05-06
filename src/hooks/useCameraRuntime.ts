import { useEffect, useState } from "react";
import { cameraApi } from "@/lib/api/cameraApi";
import { CameraRuntimeStatus } from "@/types/runtime";

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;

  // common axios shape
  const anyE = e as any;
  return (
    anyE?.response?.data?.message ||
    anyE?.response?.data ||
    anyE?.message ||
    "Failed to load runtime"
  );
}

export function useCameraRuntime(cameraId: number, refreshMs = 2000) {
  const [data, setData] = useState<CameraRuntimeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cameraId) return;

    let alive = true;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const r = await cameraApi.runtime(cameraId);
        if (!alive) return;
        setData(r);
        setError(null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load runtime");
      } finally {
        if (!alive) return;
        timer = window.setTimeout(tick, refreshMs);
      }
    };

    tick();

    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [cameraId, refreshMs]);

  const errorMessage = error ? getErrorMessage(error) : null;

  return { data, error, errorMessage };
}
