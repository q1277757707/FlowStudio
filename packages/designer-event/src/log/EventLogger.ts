import type { ActionLog } from '../types';

export class EventLogger {
  private readonly logs: ActionLog[] = [];

  push(log: ActionLog): void {
    this.logs.push(log);
  }

  list(): ActionLog[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs.length = 0;
  }
}
