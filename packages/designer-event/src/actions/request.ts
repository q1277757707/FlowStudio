import { resolveConfig } from '../expression/ExpressionResolver';
import { applyFormAssignments } from '../utils/applyFormAssignments';
import { httpRequest } from '../utils/httpRequest';
import { BaseAction, readString } from './BaseAction';
import type { RuntimeContext } from '../types';

export class RequestAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    // assignments 需在请求成功后再解析（含 variables.lastResponse），不可参与 resolveConfig
    const { assignments, ...requestOnly } = config;
    const resolved = resolveConfig(requestOnly, ctx);
    const url = readString(resolved, 'url');
    const method = readString(resolved, 'method', 'GET').toUpperCase();
    const params = (resolved.params ?? {}) as Record<string, unknown>;

    if (!url) {
      throw new Error('request 动作缺少 url');
    }

    const requester = ctx.api?.request ?? httpRequest;

    const data = await requester({ url, method, params });

    ctx.variables.lastResponse = data;

    const assigned = await applyFormAssignments(assignments, ctx);

    return this.success({ response: data, assigned });
  }
}
