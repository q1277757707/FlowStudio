import { createActionId } from '@designer-core/id';
import type { EventAction } from '@designer-core/schema';
import type { NormalizedAction } from '../types';

export function normalizeAction(action: EventAction): NormalizedAction {
  const type = action.type ?? action.action;

  return {
    id: action.id ?? createActionId(),
    type,
    config: action.config ?? {}
  };
}
