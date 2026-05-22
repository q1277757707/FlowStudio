import { OPTION_SOURCE_COMPONENT_TYPES } from '@designer-materials/optionDataSource';
import type { OptionItem } from '../types';

export function isOptionFieldType(type: string): boolean {
  return (OPTION_SOURCE_COMPONENT_TYPES as readonly string[]).includes(type);
}

function mapOptionNodes(list: unknown[], childrenField = 'children'): OptionItem[] {
  const items: OptionItem[] = [];

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }

    const record = raw as Record<string, unknown>;
    const hasShape = 'label' in record || 'value' in record;

    if (!hasShape) {
      continue;
    }

    const mapped: OptionItem = {
      label: String(record.label ?? record.value ?? ''),
      value: (record.value ?? '') as string | number | boolean
    };

    const childrenRaw = record[childrenField];

    if (Array.isArray(childrenRaw) && childrenRaw.length) {
      mapped.children = mapOptionNodes(childrenRaw, childrenField);
    }

    items.push(mapped);
  }

  return items;
}

/** 判断是否为可写入下拉/单选等的选项数组（{ label, value }[]） */
export function normalizeToOptionItems(value: unknown): OptionItem[] | null {
  if (!Array.isArray(value) || !value.length) {
    return null;
  }

  const items = mapOptionNodes(value);

  return items.length ? items : null;
}

/** 赋值为空：清空预览态动态选项与选中值 */
export function isEmptyOptionClearValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') {
    return true;
  }

  return Array.isArray(value) && value.length === 0;
}

/** 赋值字符串 "[]"（未走表达式解析时） */
export function parseOptionClearLiteral(value: unknown): 'clear' | 'unchanged' {
  if (typeof value !== 'string') {
    return 'unchanged';
  }

  const trimmed = value.trim();

  if (trimmed === '[]' || trimmed === '{{[]}}') {
    return 'clear';
  }

  return 'unchanged';
}

export function isOptionListAssignment(type: string, value: unknown): boolean {
  return isOptionFieldType(type) && normalizeToOptionItems(value) !== null;
}
