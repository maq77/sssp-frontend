import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSecurityStore } from "@/store/securityStore";
import { useNavigate } from "react-router-dom";

export function GlobalSecurityBanner() {
  const nav = useNavigate();
  const { storm, lastUnknown, unknownCountWindow, clearStorm } = useSecurityStore();

  if (!storm) return null;

  const camId = lastUnknown?.CameraId;

  return (
    <div className="w-full bg-red-600/90 text-white px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4" />
        <div className="text-sm font-semibold">SECURITY STORM MODE</div>
        <div className="text-xs opacity-90">
          Unknown detections: {unknownCountWindow} / 30s
          {camId ? ` • Last: Camera ${camId}` : ""}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {camId && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => nav(`/cameras/${camId}`)}
          >
            Open Camera
          </Button>
        )}

        <Button size="sm" variant="secondary" onClick={clearStorm}>
          <X className="w-4 h-4 mr-1" />
          Acknowledge
        </Button>
      </div>
    </div>
  );
}
