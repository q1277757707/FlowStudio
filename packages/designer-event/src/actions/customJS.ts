import { runScript } from '@designer-sandbox/index';
import { BaseAction, readString } from './BaseAction';
import type { RuntimeContext } from '../types';

function toSandboxScope(ctx: RuntimeContext) {
  return {
    form: ctx.form,
    variables: ctx.variables,
    pageState: ctx.pageState,
    components: ctx.components,
    event: ctx.event,
    utils: ctx.utils,
    message: ctx.message
  };
}

export class CustomJSAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    const code = readString(config, 'code');

    if (!code) {
      return this.success();
    }

    runScript(code, toSandboxScope(ctx));

    return this.success();
  }
}
