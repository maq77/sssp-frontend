import apiClient from '@/lib/api-client';
import type { MapLayoutDto, ActivePersonDto } from '@/types';

export const mapApi = {
  getLayout: (): Promise<MapLayoutDto> =>
    apiClient.get('/map/layout'),

  getActivePersons: (): Promise<ActivePersonDto[]> =>
    apiClient.get('/map/active-persons'),

  updateZoneLayout: (id: number, payload: {
    layoutX?: number | null;
    layoutY?: number | null;
    layoutW?: number | null;
    layoutH?: number | null;
    floorId?: string | null;
  }) => apiClient.put(`/map/zones/${id}/layout`, payload),

  updateCameraLayout: (id: number, payload: {
    layoutX?: number | null;
    layoutY?: number | null;
    fovHeadingDeg?: number | null;
    fovAngleDeg?: number | null;
    fovRangeUnits?: number | null;
  }) => apiClient.put(`/map/cameras/${id}/layout`, payload),
};
