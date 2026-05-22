import { resolveConfig } from '../expression/ExpressionResolver';
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

    const requester =
      ctx.api?.request ??
      (async (options: { url: string; method: string; params: Record<string, unknown> }) => {
        const init: RequestInit = {
          method: options.method,
          headers: { 'Content-Type': 'application/json' }
        };

        if (options.method !== 'GET' && options.method !== 'HEAD') {
          init.body = JSON.stringify(options.params);
        }

        const target =
          options.method === 'GET'
            ? `${options.url}?${new URLSearchParams(
                Object.entries(options.params).map(([k, v]) => [k, String(v)])
              )}`
            : options.url;

        const response = await fetch(target, init);

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') ?? '';

        if (contentType.includes('application/json')) {
          return response.json();
        }

        return response.text();
      });

    const data = await requester({ url, method, params });

    ctx.variables.lastResponse = data;

    return this.success(data);
  }
}
