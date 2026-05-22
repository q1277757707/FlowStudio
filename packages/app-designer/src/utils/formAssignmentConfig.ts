export interface FormAssignmentRow {
  componentId: string;
  value: string;
}

export function readFormAssignmentRows(assignments: unknown): FormAssignmentRow[] {
  if (!Array.isArray(assignments) || !assignments.length) {
    return [{ componentId: '', value: '' }];
  }

  return assignments
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        componentId: typeof row.componentId === 'string' ? row.componentId : '',
        value: typeof row.value === 'string' ? row.value : String(row.value ?? '')
      };
    });
}

export function buildFormAssignments(rows: FormAssignmentRow[]) {
  return rows
    .map((row) => ({
      componentId: row.componentId.trim(),
      value: row.value
    }))
    .filter((row) => row.componentId);
}
