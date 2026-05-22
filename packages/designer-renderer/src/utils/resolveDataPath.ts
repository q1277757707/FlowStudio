/** 按点路径读取对象字段，如 data.list */
export function resolveDataPath(source: unknown, path: string): unknown {
  const normalized = path.trim();

  if (!normalized) {
    return source;
  }

  return normalized.split('.').reduce<unknown>((current, key) => {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, source);
}
