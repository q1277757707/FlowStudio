import { resolveConfigValue } from '../expression/ExpressionResolver';
import { readString } from '../actions/BaseAction';
import type { RuntimeContext } from '../types';

export interface FormAssignmentEntry {
  componentId: string;
  value: unknown;
}

export function readFormAssignmentEntries(assignments: unknown): FormAssignmentEntry[] {
  if (!Array.isArray(assignments)) {
    return [];
  }

  const entries: FormAssignmentEntry[] = [];

  for (const raw of assignments) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }

    const row = raw as Record<string, unknown>;
    const componentId = readString(row, 'componentId');

    if (componentId) {
      entries.push({ componentId, value: row.value });
    }
  }

  return entries;
}

/** 将解析后的值写入预览表单（form[组件ID]） */
export async function applyFormAssignments(
  assignments: unknown,
  ctx: RuntimeContext
): Promise<Record<string, unknown>> {
  const entries = readFormAssignmentEntries(assignments);

  if (!entries.length) {
    return {};
  }

  if (!ctx.setFormFieldValue) {
    throw new Error('当前环境不支持组件赋值');
  }

  const result: Record<string, unknown> = {};

  for (const entry of entries) {
    const value = resolveConfigValue(entry.value, ctx);
    ctx.setFormFieldValue(entry.componentId, value);
    result[entry.componentId] = value;
  }

  return result;
}
