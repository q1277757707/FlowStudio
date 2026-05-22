import type { EventAction } from '@designer-core/schema';
import { resolveExpression } from '../expression/ExpressionResolver';
import { BaseAction, ensureActions, readString } from './BaseAction';
import type { RuntimeContext } from '../types';

export class LoopAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    const dataSourceExpr = readString(config, 'dataSource', '[]');
    const list = resolveExpression(dataSourceExpr, ctx);
    const actions = ensureActions(config, 'actions') as EventAction[];

    if (!Array.isArray(list) || !ctx.runActions) {
      return this.success();
    }

    for (let index = 0; index < list.length; index += 1) {
      ctx.variables.currentItem = list[index];
      ctx.variables.currentIndex = index;
      await ctx.runActions(actions, ctx);
    }

    return this.success(list.length);
  }
}
