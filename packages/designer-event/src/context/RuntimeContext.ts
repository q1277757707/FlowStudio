import type { RuntimeContext } from '../types';

export function createRuntimeContext(
  partial: Partial<RuntimeContext> & Pick<RuntimeContext, 'form'>
): RuntimeContext {
  return {
    variables: {},
    pageState: {},
    components: {},
    form: partial.form,
    event: {},
    router: partial.router,
    api: partial.api,
    utils: partial.utils ?? {},
    message: partial.message,
    dialog: partial.dialog,
    runActions: partial.runActions
  };
}

export function mergeEventPayload(
  ctx: RuntimeContext,
  payload?: Record<string, unknown>
): RuntimeContext {
  if (!payload) {
    return ctx;
  }

  return {
    ...ctx,
    event: {
      ...ctx.event,
      ...payload
    }
  };
}
