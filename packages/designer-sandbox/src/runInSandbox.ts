import { SANDBOX_SCOPE_PARAM } from './constants';
import { SandboxError } from './errors';
import { createScopeProxy } from './createScopeProxy';
import type { RunInSandboxOptions, SandboxScope } from './types';

function buildRunner(code: string, mode: 'expression' | 'script'): string {
  const body =
    mode === 'expression'
      ? `return (${code});`
      : String(code).trim().endsWith(';')
        ? String(code)
        : `${code};`;

  // 注意：with 在 strict 模式下非法，沙箱函数体不能加 "use strict"
  return `with (${SANDBOX_SCOPE_PARAM}) {
  ${body}
}`;
}

/**
 * 在 Proxy + with 沙箱中执行用户代码。
 */
export function runInSandbox<T = unknown>(
  code: string,
  scope: SandboxScope,
  options: RunInSandboxOptions = {}
): T {
  const trimmed = code.trim();

  if (!trimmed) {
    throw new SandboxError('沙箱代码不能为空');
  }

  const mode = options.mode ?? 'expression';
  const sandbox = createScopeProxy(scope);

  try {
    const runner = new Function(SANDBOX_SCOPE_PARAM, buildRunner(trimmed, mode)) as (
      sandboxScope: SandboxScope
    ) => T;

    return runner(sandbox);
  } catch (error) {
    throw new SandboxError(
      error instanceof Error ? error.message : '沙箱执行失败',
      { cause: error }
    );
  }
}

/** 执行表达式，例如 form.name */
export function runExpression<T = unknown>(expression: string, scope: SandboxScope): T {
  return runInSandbox<T>(expression, scope, { mode: 'expression' });
}

/** 执行脚本语句，用于 customJS 等 */
export function runScript(code: string, scope: SandboxScope): void {
  runInSandbox(code, scope, { mode: 'script' });
}

const EXPRESSION_PATTERN = /^\{\{\s*([\s\S]+?)\s*\}\}$/;

/** 解析 {{ expr }} 模板并在沙箱中求值 */
export function evaluateTemplate(template: string, scope: SandboxScope): unknown {
  const matched = template.match(EXPRESSION_PATTERN);

  if (!matched) {
    return template;
  }

  return runExpression(matched[1], scope);
}
