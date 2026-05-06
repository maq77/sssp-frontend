import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { mapApi } from '@/lib/api/mapApi';
import { useMapStore } from '@/store/mapStore';

export function useActivePersonsBootstrap(enabled: boolean) {
  const hydrate = useMapStore(s => s.hydrateActivePersons);

  const query = useQuery({
    queryKey: ['map', 'active-persons'],
    queryFn: mapApi.getActivePersons,
    enabled,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) hydrate(query.data);
  }, [query.data, hydrate]);

  return query;
}
