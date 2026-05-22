import { resolveConfigValue } from '../expression/ExpressionResolver';
import { BaseAction, readString } from './BaseAction';
import type { RuntimeContext } from '../types';

export class SetVariableAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    const key = readString(config, 'key');

    if (!key) {
      throw new Error('setVariable 动作缺少 key');
    }

    ctx.variables[key] = resolveConfigValue(config.value, ctx);

    return this.success(ctx.variables[key]);
  }
}
