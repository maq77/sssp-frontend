// Collapses rapid SignalR bursts into a single rAF-batched callback.
type Fn = () => void;

export function createEventBatcher(flush: Fn): { schedule: Fn; cancel: Fn } {
  let rafId: number | null = null;

  const schedule = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      flush();
    });
  };

  const cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return { schedule, cancel };
}
