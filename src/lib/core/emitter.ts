export type Unsubscribe = () => void;

export class Emitter<T> {
  private listeners = new Set<(v: T) => void>();

  emit(v: T) {
    for (const fn of this.listeners) fn(v);
  }

  subscribe(fn: (v: T) => void): Unsubscribe {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
