import type { EventAction } from '@designer-core/schema';
import { BaseAction, ensureActions, readString } from './BaseAction';
import type { RuntimeContext } from '../types';

export class EmitAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    const eventName = readString(config, 'eventName');

    if (!eventName) {
      throw new Error('emit 动作缺少 eventName');
    }

    const actions = ensureActions(config, 'actions') as EventAction[];

    if (ctx.runActions && actions.length) {
      await ctx.runActions(actions, {
        ...ctx,
        event: {
          ...ctx.event,
          name: eventName
        }
      });
    }

    return this.success();
  }
}
