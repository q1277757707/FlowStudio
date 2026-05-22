import type { EventAction, EventActionType } from '@designer-core/schema';

export type { EventAction, EventActionType };

export interface NormalizedAction {
  id: string;
  type: EventActionType;
  config: Record<string, unknown>;
}

export interface ActionLog {
  actionId: string;
  type: string;
  status: 'start' | 'success' | 'error';
  message?: string;
  duration?: number;
}

export interface RuntimeContext {
  variables: Record<string, unknown>;
  pageState: Record<string, unknown>;
  components: Record<string, unknown>;
  form: Record<string, unknown>;
  event: Record<string, unknown>;
  router?: {
    push: (path: string) => void | Promise<void>;
    replace?: (path: string) => void | Promise<void>;
  };
  api?: {
    request: (options: RequestOptions) => Promise<unknown>;
  };
  utils?: Record<string, unknown>;
  message?: (options: string | MessageOptions) => void;
  dialog?: (options: DialogOptions) => Promise<unknown>;
  /** 由 runner 注入，用于 condition / loop / emit */
  runActions?: (actions: EventAction[], ctx: RuntimeContext) => Promise<void>;
  /** 预览态控制组件显隐（设计态画布始终显示） */
  setComponentVisible?: (componentId: string, visible: boolean) => void;
  /** 预览态给表单组件赋值（form[组件ID]） */
  setFormFieldValue?: (componentId: string, value: unknown) => void;
}

export interface RequestOptions {
  url: string;
  method?: string;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface MessageOptions {
  type?: 'success' | 'warning' | 'info' | 'error';
  message?: string;
  content?: string;
}

export interface DialogOptions {
  title?: string;
  message?: string;
  type?: 'alert' | 'confirm';
}

export interface ActionExecuteResult {
  data?: unknown;
  error?: Error;
}

export interface ActionRunnerOptions {
  continueOnError?: boolean;
  onLog?: (log: ActionLog) => void;
}

export interface EventDispatchOptions extends ActionRunnerOptions {
  eventName?: string;
  componentId?: string;
  payload?: Record<string, unknown>;
}

export type ActionExecutor = (
  config: Record<string, unknown>,
  ctx: RuntimeContext
) => Promise<ActionExecuteResult | void>;

export interface IAction {
  execute: ActionExecutor;
}
