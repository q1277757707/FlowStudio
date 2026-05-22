import type { LowCodeNode } from '@designer-core/schema';
import type { RuntimeContext } from '@designer-event/types';
import type { OptionItem } from '../types';
import { resolveDataPath } from './resolveDataPath';

function readPropString(node: LowCodeNode, key: string, fallback: string): string {
  const value = node.props[key];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function parseRequestParams(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }

  if (typeof raw !== 'string' || !raw.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function mapOptionItems(
  list: unknown[],
  labelField: string,
  valueField: string,
  childrenField: string
): OptionItem[] {
  return list
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const record = item as Record<string, unknown>;
      const childrenRaw = record[childrenField];
      const mapped: OptionItem = {
        label: String(record[labelField] ?? ''),
        value: (record[valueField] ?? '') as string | number | boolean
      };

      if (Array.isArray(childrenRaw) && childrenRaw.length) {
        mapped.children = mapOptionItems(childrenRaw, labelField, valueField, childrenField);
      }

      return mapped;
    });
}

export async function fetchOptionsFromApi(
  node: LowCodeNode,
  ctx: RuntimeContext
): Promise<OptionItem[]> {
  const url = readPropString(node, 'requestUrl', '');
  const method = readPropString(node, 'requestMethod', 'GET').toUpperCase();
  const params = parseRequestParams(node.props.requestParams);
  const dataPath = readPropString(node, 'dataPath', 'data.list');
  const labelField = readPropString(node, 'labelField', 'label');
  const valueField = readPropString(node, 'valueField', 'value');
  const childrenField = readPropString(node, 'childrenField', 'children');

  if (!url) {
    return [];
  }

  const requester = ctx.api?.request;

  if (!requester) {
    throw new Error('运行时未提供 api.request');
  }

  const response = await requester({
    url,
    method: method === 'POST' ? 'POST' : 'GET',
    params
  });

  const list = resolveDataPath(response, dataPath);

  if (!Array.isArray(list)) {
    return [];
  }

  return mapOptionItems(list, labelField, valueField, childrenField);
}
