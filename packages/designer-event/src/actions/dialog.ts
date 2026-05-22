import { resolveConfig } from '../expression/ExpressionResolver';
import { BaseAction, readString } from './BaseAction';
import type { RuntimeContext } from '../types';

export class DialogAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    const resolved = resolveConfig(config, ctx);
    const title = readString(resolved, 'title', '提示');
    const message = readString(resolved, 'message', '');
    const type = readString(resolved, 'type', 'alert');

    if (ctx.dialog) {
      const result = await ctx.dialog({ title, message, type: type as 'alert' | 'confirm' });
      ctx.variables.dialogResult = result;
      return this.success(result);
    }

    if (type === 'confirm') {
      const ok = window.confirm(message || title);
      ctx.variables.dialogResult = ok;
      return this.success(ok);
    }

    window.alert(message || title);
    return this.success(true);
  }
}
