import { resolveConfigValue } from '../expression/ExpressionResolver';
import { readSetVariableEntries } from '../utils/setVariableConfig';
import { BaseAction } from './BaseAction';
import type { RuntimeContext } from '../types';

export class SetVariableAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    const entries = readSetVariableEntries(config);

    if (!entries.length) {
      throw new Error('setVariable 动作至少配置一个变量');
    }

    const result: Record<string, unknown> = {};

    for (const entry of entries) {
      const value = resolveConfigValue(entry.value, ctx);
      ctx.variables[entry.key] = value;
      result[entry.key] = value;
    }

    return this.success(result);
  }
}
