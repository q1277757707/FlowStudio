import { resolveConfig } from '../expression/ExpressionResolver';
import { BaseAction, readString } from './BaseAction';
import type { RuntimeContext } from '../types';

export class NavigateAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    const url = readString(resolveConfig(config, ctx), 'url');

    if (!url) {
      throw new Error('navigate 动作缺少 url');
    }

    if (ctx.router?.push) {
      await ctx.router.push(url);
    } else {
      window.location.assign(url);
    }

    return this.success();
  }
}
