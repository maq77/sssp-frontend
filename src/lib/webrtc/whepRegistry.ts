import { WhepController } from "./whepController";

type Entry = { controller: WhepController; refs: number };

export class WhepControllerRegistry {
  private map = new Map<string, Entry>();

  acquire(key: string, create: () => WhepController) {
    const existing = this.map.get(key);
    if (existing) {
      existing.refs += 1;
      return existing.controller;
    }

    const controller = create();
    this.map.set(key, { controller, refs: 1 });
    return controller;
  }

  async release(key: string) {
    const entry = this.map.get(key);
    if (!entry) return;

    entry.refs -= 1;
    if (entry.refs <= 0) {
      // stop & cleanup best effort
      await entry.controller.stop().catch(() => {});
      this.map.delete(key);
    }
  }
}

export const whepRegistry = new WhepControllerRegistry();
