import { resolveConfig } from '../expression/ExpressionResolver';
import { BaseAction, readBoolean, readString } from './BaseAction';
import type { RuntimeContext } from '../types';

export class SetVisibleAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    const resolved = resolveConfig(config, ctx);
    const componentId = readString(resolved, 'componentId');

    if (!componentId) {
      throw new Error('setVisible 动作缺少 componentId');
    }

    const visible = readBoolean(resolved, 'visible', true);

    if (!ctx.setComponentVisible) {
      throw new Error('当前环境不支持 setVisible');
    }

    ctx.setComponentVisible(componentId, visible);

    return this.success({ componentId, visible });
  }
}
