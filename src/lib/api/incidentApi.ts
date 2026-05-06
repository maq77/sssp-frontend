import apiClient from "@/lib/api-client";
import type {
  IncidentResponse,
  CreateIncidentRequest,
} from "@/types";

export const incidentApi = {
  /**
   * Get all open incidents
   */
  async getOpen(): Promise<IncidentResponse[]> {
    return apiClient.get<IncidentResponse[]>("/Incident/open");
  },

  /**
   * Get incidents by operator
   */
  async getByOperator(operatorId: number): Promise<IncidentResponse[]> {
    return apiClient.get<IncidentResponse[]>(`/Incident/operator/${operatorId}`);
  },

  /**
   * Create new incident
   */
  async create(data: CreateIncidentRequest): Promise<IncidentResponse> {
    return apiClient.post<IncidentResponse>("/Incident", data);
  },

  /**
   * Assign incident to user
   */
  async assign(incidentId: number, userId: string): Promise<void> {
    return apiClient.post(`/Incident/${incidentId}/assign/${userId}`);
  },

  /**
   * Start work on incident
   */
  async startWork(incidentId: number, userId: string): Promise<void> {
    return apiClient.post(`/Incident/${incidentId}/start/${userId}`);
  },

  /**
   * Resolve incident
   */
  async resolve(incidentId: number, userId: string): Promise<void> {
    return apiClient.post(`/Incident/${incidentId}/resolve/${userId}`);
  },

  /**
   * Close incident
   */
  async close(incidentId: number): Promise<void> {
    return apiClient.post(`/Incident/${incidentId}/close`);
  },
};