export interface RequestParamRow {
  key: string;
  value: string;
}

export function readRequestParamRows(params: unknown): RequestParamRow[] {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return [{ key: '', value: '' }];
  }

  const entries = Object.entries(params as Record<string, unknown>);

  if (!entries.length) {
    return [{ key: '', value: '' }];
  }

  return entries.map(([key, value]) => ({
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value ?? '')
  }));
}

export function buildRequestParams(rows: RequestParamRow[]): Record<string, string> {
  const params: Record<string, string> = {};

  for (const row of rows) {
    const key = row.key.trim();

    if (key) {
      params[key] = row.value;
    }
  }

  return params;
}
