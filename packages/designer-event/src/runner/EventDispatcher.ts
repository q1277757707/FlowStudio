import type { EventAction } from "@designer-core/schema";
import { mergeEventPayload } from "../context/RuntimeContext";
import { ActionRunner } from "./ActionRunner";
import type { EventDispatchOptions, RuntimeContext } from "../types";

export class EventDispatcher {
  private readonly runner: ActionRunner;

  constructor(runner = new ActionRunner()) {
    this.runner = runner;
  }

  getRunner(): ActionRunner {
    return this.runner;
  }

  async dispatch(
    actions: EventAction[] | undefined,
    ctx: RuntimeContext,
    options: EventDispatchOptions = {},
  ): Promise<void> {
    const payload = {
      name: options.eventName,
      componentId: options.componentId,
      ...options.payload,
    };

    const context = mergeEventPayload(ctx, payload);

    await this.runner.run(actions, context, options);
  }
}

export const globalEventDispatcher = new EventDispatcher();
