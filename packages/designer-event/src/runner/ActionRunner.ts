import type { EventAction } from '@designer-core/schema';
import { ActionRegistry, globalActionRegistry } from '../registry/ActionRegistry';
import { registerBuiltinActions } from '../registry/registerBuiltinActions';
import { normalizeAction } from '../utils/normalizeAction';
import { EventLogger } from '../log/EventLogger';
import type { ActionLog, ActionRunnerOptions, RuntimeContext } from '../types';

let registryBootstrapped = false;

function ensureRegistry(registry: ActionRegistry): ActionRegistry {
  if (!registryBootstrapped) {
    registerBuiltinActions(registry);
    registryBootstrapped = true;
  }

  return registry;
}

export class ActionRunner {
  private readonly registry: ActionRegistry;
  private readonly logger = new EventLogger();

  constructor(registry: ActionRegistry = globalActionRegistry) {
    this.registry = ensureRegistry(registry);
  }

  getLogs(): ActionLog[] {
    return this.logger.list();
  }

  clearLogs(): void {
    this.logger.clear();
  }

  async run(
    actions: EventAction[] | undefined,
    ctx: RuntimeContext,
    options: ActionRunnerOptions = {}
  ): Promise<void> {
    if (!actions?.length) {
      return;
    }

    const runNested = async (nested: EventAction[], nestedCtx: RuntimeContext) => {
      await this.run(nested, nestedCtx, options);
    };

    const context: RuntimeContext = {
      ...ctx,
      runActions: runNested
    };

    for (const raw of actions) {
      await this.executeAction(raw, context, options);
    }
  }

  private async executeAction(
    raw: EventAction,
    ctx: RuntimeContext,
    options: ActionRunnerOptions
  ): Promise<void> {
    const action = normalizeAction(raw);
    const startedAt = performance.now();
    const logBase: ActionLog = {
      actionId: action.id,
      type: action.type,
      status: 'start'
    };

    this.logger.push(logBase);
    options.onLog?.(logBase);

    try {
      const executor = this.registry.get(action.type);

      if (!executor) {
        throw new Error(`未注册的 Action: ${action.type}`);
      }

      await executor.execute(action.config, ctx);

      const successLog: ActionLog = {
        actionId: action.id,
        type: action.type,
        status: 'success',
        duration: Math.round(performance.now() - startedAt)
      };

      this.logger.push(successLog);
      options.onLog?.(successLog);
    } catch (error) {
      const message = error instanceof Error ? error.message : '动作执行失败';
      const errorLog: ActionLog = {
        actionId: action.id,
        type: action.type,
        status: 'error',
        message,
        duration: Math.round(performance.now() - startedAt)
      };

      this.logger.push(errorLog);
      options.onLog?.(errorLog);

      if (!options.continueOnError) {
        throw error;
      }
    }
  }
}
