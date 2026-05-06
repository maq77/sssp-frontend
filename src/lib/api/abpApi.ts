import apiClient from "@/lib/api-client";
import type {
  ABPProactiveRequest,
  ABPProactiveResult,
  ABPSuspicionEvent,
  ABPWeightsSnapshot,
} from "@/types";

export interface ABPEventsQuery {
  cameraId?: string;
  from?: string;
  to?: string;
}

export const abpApi = {
  /**
   * Submit operator feedback for a suspicion event.
   * POST /api/abp/feedback
   */
  async submitFeedback(eventId: string, isSuspicious: boolean): Promise<void> {
    await apiClient.post<void, { eventId: string; isSuspicious: boolean }>(
      "/abp/feedback",
      { eventId, isSuspicious }
    );
  },

  /**
   * Get current ABP weights snapshot (online learner state).
   * GET /api/abp/weights
   */
  async getWeights(): Promise<ABPWeightsSnapshot> {
    return apiClient.get<ABPWeightsSnapshot>("/abp/weights");
  },

  /**
   * List recent ABP suspicion events for review.
   * GET /api/abp/events
   */
  async getEvents(params?: ABPEventsQuery): Promise<ABPSuspicionEvent[]> {
    const query: Record<string, unknown> = {};
    if (params?.cameraId) query.cameraId = params.cameraId;
    if (params?.from) query.from = params.from;
    if (params?.to) query.to = params.to;

    const rows = await apiClient.get<ABPSuspicionEvent[]>(
      "/abp/events",
      Object.keys(query).length ? query : undefined
    );
    return Array.isArray(rows) ? rows : [];
  },

  /**
   * Admin proactively labels behavior on a camera (no prior alert needed).
   * POST /api/abp/proactive
   */
  async submitProactiveFeedback(req: ABPProactiveRequest): Promise<ABPProactiveResult> {
    return apiClient.post<ABPProactiveResult, ABPProactiveRequest>("/abp/proactive", req);
  },
};

export default abpApi;
