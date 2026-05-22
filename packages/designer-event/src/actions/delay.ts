import { BaseAction, readNumber } from './BaseAction';
import type { RuntimeContext } from '../types';

export class DelayAction extends BaseAction {
  async execute(config: Record<string, unknown>, _ctx: RuntimeContext) {
    const ms = readNumber(config, 'ms', 300);

    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

    return this.success();
  }
}
