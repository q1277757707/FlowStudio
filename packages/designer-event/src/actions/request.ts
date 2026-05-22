import { resolveConfig } from '../expression/ExpressionResolver';
import { httpRequest } from '../utils/httpRequest';
import { BaseAction, readString } from './BaseAction';
import type { RuntimeContext } from '../types';

export class RequestAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    const resolved = resolveConfig(config, ctx);
    const url = readString(resolved, 'url');
    const method = readString(resolved, 'method', 'GET').toUpperCase();
    const params = (resolved.params ?? {}) as Record<string, unknown>;

    if (!url) {
      throw new Error('request 动作缺少 url');
    }

    const requester = ctx.api?.request ?? httpRequest;

    const data = await requester({ url, method, params });

    ctx.variables.lastResponse = data;

    return this.success(data);
  }
}
