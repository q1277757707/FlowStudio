import { evaluateTemplate, runExpression } from '@designer-sandbox/index';
import type { SandboxScope } from '@designer-sandbox/types';
import type { RuntimeContext } from '../types';

const TEMPLATE_SEGMENT = /\{\{\s*([\s\S]+?)\s*\}\}/g;

function toSandboxScope(ctx: RuntimeContext) {
  return {
    form: ctx.form,
    variables: ctx.variables,
    pageState: ctx.pageState,
    components: ctx.components,
    event: ctx.event,
    utils: ctx.utils,
    message: ctx.message
  };
}

function embedExpressionLiteral(value: unknown): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value === null || value === undefined) {
    return 'null';
  }

  return JSON.stringify(value);
}

/** 将 `{{event.value}} === 'A'` 中的模板段替换为字面量后再求值 */
function interpolateExpressionTemplate(expression: string, scope: SandboxScope): string {
  return expression.replace(TEMPLATE_SEGMENT, (_, inner: string) =>
    embedExpressionLiteral(runExpression(inner.trim(), scope))
  );
}

export function resolveExpression(expression: string, ctx: RuntimeContext): unknown {
  const trimmed = expression.trim();

  if (!trimmed) {
    return '';
  }

  const scope = toSandboxScope(ctx);

  if (trimmed.startsWith('{{') && trimmed.endsWith('}}')) {
    return evaluateTemplate(trimmed, scope);
  }

  const code = trimmed.includes('{{') ? interpolateExpressionTemplate(trimmed, scope) : trimmed;

  return runExpression(code, scope);
}

export function resolveConfigValue(value: unknown, ctx: RuntimeContext): unknown {
  if (typeof value === 'string') {
    if (value.includes('{{')) {
      return evaluateTemplate(value, toSandboxScope(ctx));
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveConfigValue(item, ctx));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        resolveConfigValue(item, ctx)
      ])
    );
  }

  return value;
}

export function resolveConfig(
  config: Record<string, unknown> | undefined,
  ctx: RuntimeContext
): Record<string, unknown> {
  return resolveConfigValue(config ?? {}, ctx) as Record<string, unknown>;
}
