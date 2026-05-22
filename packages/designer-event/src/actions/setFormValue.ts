import { applyFormAssignments } from '../utils/applyFormAssignments';
import { BaseAction } from './BaseAction';
import type { RuntimeContext } from '../types';

export class SetFormValueAction extends BaseAction {
  async execute(config: Record<string, unknown>, ctx: RuntimeContext) {
    const result = await applyFormAssignments(config.assignments, ctx);

    return this.success(result);
  }
}
