import { useEffect } from 'react';
import { useMapStore } from '@/store/mapStore';
import { fitViewport, clampScale } from '@/lib/map/coordTransform';
import type { RefObject } from 'react';

export function useMapHotkeys(containerRef: RefObject<HTMLDivElement | null>) {
  const store = useMapStore();

  useEffect(() => {
    const el = containerRef.current ?? window;

    const handle = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case '3':
          store.setViewMode(store.viewMode === '2d' ? '3d' : '2d');
          break;
        case 'Escape':
          store.selectCamera(null);
          store.selectZone(null);
          store.selectPerson(null);
          break;
        case '=':
        case '+':
          store.setViewport({ scale: clampScale(store.viewport.scale * 1.2) });
          break;
        case '-':
          store.setViewport({ scale: clampScale(store.viewport.scale / 1.2) });
          break;
        case '0':
        case 'z':
        case 'Z': {
          const w = containerRef.current?.clientWidth ?? window.innerWidth;
          const h = containerRef.current?.clientHeight ?? window.innerHeight;
          const vp = fitViewport(w, h);
          store.setViewport(vp);
          break;
        }
        case 'f':
        case 'F':
          store.togglePanel('filters');
          break;
        case 'm':
        case 'M':
          store.togglePanel('minimap');
          break;
        case 'p':
        case 'P':
          store.togglePanel('persons');
          break;
        case 'i':
        case 'I':
          store.togglePanel('incidents');
          break;
      }
    };

    el.addEventListener('keydown', handle as EventListener);
    return () => el.removeEventListener('keydown', handle as EventListener);
  }, [store, containerRef]);
}
