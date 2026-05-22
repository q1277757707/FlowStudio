import type { EventActionType } from '@designer-core/schema';
import type { IAction } from '../types';

export class ActionRegistry {
  private readonly actions = new Map<EventActionType, IAction>();

  register(type: EventActionType, action: IAction): void {
    this.actions.set(type, action);
  }

  get(type: EventActionType): IAction | undefined {
    return this.actions.get(type);
  }

  has(type: EventActionType): boolean {
    return this.actions.has(type);
  }

  list(): EventActionType[] {
    return [...this.actions.keys()];
  }
}

export const globalActionRegistry = new ActionRegistry();
