import { resolveConfigValue } from '../expression/ExpressionResolver';
import { BaseAction, readString } from './BaseAction';
import type { RuntimeContext } from '../types';

export class MessageAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    const resolved = resolveConfigValue(config, ctx) as Record<string, unknown>;
    const type = readString(resolved, 'type', 'info');
    const content =
      readString(resolved, 'content') || readString(resolved, 'message', '操作成功');

    if (ctx.message) {
      ctx.message({
        type: type as 'success' | 'warning' | 'info' | 'error',
        message: content
      });
    } else {
      console.info(`[message:${type}]`, content);
    }

    return this.success();
  }
}
