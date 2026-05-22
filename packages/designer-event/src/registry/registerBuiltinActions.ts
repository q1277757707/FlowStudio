import { ConditionAction } from '../actions/condition';
import { CustomJSAction } from '../actions/customJS';
import { DelayAction } from '../actions/delay';
import { DialogAction } from '../actions/dialog';
import { EmitAction } from '../actions/emit';
import { LoopAction } from '../actions/loop';
import { MessageAction } from '../actions/message';
import { NavigateAction } from '../actions/navigate';
import { ReloadAction } from '../actions/reload';
import { RequestAction } from '../actions/request';
import { SetVariableAction } from '../actions/setVariable';
import { SetVisibleAction } from '../actions/setVisible';
import type { ActionRegistry } from './ActionRegistry';

export function registerBuiltinActions(registry: ActionRegistry): void {
  registry.register('request', new RequestAction());
  registry.register('setVariable', new SetVariableAction());
  registry.register('message', new MessageAction());
  registry.register('dialog', new DialogAction());
  registry.register('navigate', new NavigateAction());
  registry.register('reload', new ReloadAction());
  registry.register('emit', new EmitAction());
  registry.register('condition', new ConditionAction());
  registry.register('loop', new LoopAction());
  registry.register('delay', new DelayAction());
  registry.register('customJS', new CustomJSAction());
  registry.register('setVisible', new SetVisibleAction());
}
