import type { EventAction } from '@designer-core/schema';
import { resolveExpression } from '../expression/ExpressionResolver';
import { BaseAction, ensureActions, readString } from './BaseAction';
import type { RuntimeContext } from '../types';

export class ConditionAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    const expression = readString(config, 'expression', 'true');
    const result = Boolean(resolveExpression(expression, ctx));
    const branchKey = result ? 'trueActions' : 'falseActions';
    const actions = ensureActions(config, branchKey) as EventAction[];

    if (ctx.runActions && actions.length) {
      await ctx.runActions(actions, ctx);
    }

    return this.success(result);
  }
}
