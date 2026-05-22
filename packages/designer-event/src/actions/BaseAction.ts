import type { ActionExecuteResult, IAction, RuntimeContext } from '../types';

export abstract class BaseAction implements IAction {
  abstract execute(config: Record<string, unknown>, ctx: RuntimeContext): Promise<ActionExecuteResult | void>;

  protected success(data?: unknown): ActionExecuteResult {
    return { data };
  }
}

export function readString(config: Record<string, unknown>, key: string, fallback = ''): string {
  const value = config[key];
  return typeof value === 'string' ? value : fallback;
}

export function readNumber(config: Record<string, unknown>, key: string, fallback = 0): number {
  const value = config[key];
  return typeof value === 'number' ? value : Number(value) || fallback;
}

export function readBoolean(config: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = config[key];

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return fallback;
}

export function ensureActions(config: Record<string, unknown>, key: string) {
  const value = config[key];
  return Array.isArray(value) ? value : [];
}
