import { useQuery } from '@tanstack/react-query';
import { mapApi } from '@/lib/api/mapApi';

export function useMapLayout() {
  return useQuery({
    queryKey: ['map', 'layout'],
    queryFn: mapApi.getLayout,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
