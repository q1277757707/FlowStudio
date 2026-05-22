import { readString } from '../actions/BaseAction';

export interface SetVariableEntry {
  key: string;
  value: unknown;
}

/** 解析设置变量 config（兼容旧版 key/value 与新版 variables 数组） */
export function readSetVariableEntries(config: Record<string, unknown>): SetVariableEntry[] {
  if (Array.isArray(config.variables)) {
    const entries: SetVariableEntry[] = [];

    for (const raw of config.variables) {
      if (!raw || typeof raw !== 'object') {
        continue;
      }

      const row = raw as Record<string, unknown>;
      const key = readString(row, 'key');

      if (key) {
        entries.push({ key, value: row.value });
      }
    }

    return entries;
  }

  const legacyKey = readString(config, 'key');

  if (legacyKey) {
    return [{ key: legacyKey, value: config.value }];
  }

  return [];
}
