export * from './types';
export * from './context/RuntimeContext';
export * from './expression/ExpressionResolver';
export * from './registry/ActionRegistry';
export { registerBuiltinActions } from './registry/registerBuiltinActions';
export * from './runner/ActionRunner';
export * from './runner/EventDispatcher';
export * from './log/EventLogger';
export { normalizeAction } from './utils/normalizeAction';
export { httpRequest } from './utils/httpRequest';

import { globalEventDispatcher } from './runner/EventDispatcher';
import type { EventAction } from '@designer-core/schema';
import type { EventDispatchOptions, RuntimeContext } from './types';

/** 便捷方法：执行动作链 */
export async function runEventActions(
  actions: EventAction[] | undefined,
  ctx: RuntimeContext,
  options?: EventDispatchOptions
): Promise<void> {
  await globalEventDispatcher.dispatch(actions, ctx, options);
}
