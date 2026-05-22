import { BaseAction } from './BaseAction';
import type { RuntimeContext } from '../types';

export class ReloadAction extends BaseAction {
  async execute(_config: Record<string, unknown>, _ctx: RuntimeContext) {
    window.location.reload();
    return this.success();
  }
}
