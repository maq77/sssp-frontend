import { useEffect } from "react";
import signalRService from "@/lib/signalr-service";
import type { IncidentResponse, RealtimeEnvelope } from "@/types";

export function useIncidentRealtime(
  onIncident: (incident: IncidentResponse, event: string) => void
) {
  useEffect(() => {
    const handler = (envelope: RealtimeEnvelope<IncidentResponse>) => {
      onIncident(envelope.Data, envelope.Event);
    };

    signalRService.on("ReceiveIncident", handler);

    return () => {
      signalRService.off("ReceiveIncident", handler);
    };
  }, [onIncident]);
}