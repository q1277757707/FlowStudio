import type { WorkflowConditionGroupDraft, WorkflowConditionRuleDraft } from '@designer-core/workflow';
import type { WorkflowConditionGroup, WorkflowConditionRule } from './types';

export const CONDITION_OPERATORS: Array<{ value: number; label: string }> = [
  { value: 0, label: '等于' },
  { value: 1, label: '不等于' },
  { value: 2, label: '大于' },
  { value: 3, label: '小于' },
  { value: 4, label: '大于等于' },
  { value: 5, label: '小于等于' },
  { value: 6, label: '包含' },
  { value: 7, label: '不包含' }
];

export const CONDITION_FIELD_PRESETS: Array<{ value: string; label: string }> = [
  { value: 'initiator', label: '发起人' }
];

const OPERATOR_LABEL = Object.fromEntries(
  CONDITION_OPERATORS.map((item) => [item.value, item.label])
) as Record<number, string>;

function newConditionId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyConditionRule(): WorkflowConditionRule {
  return {
    id: newConditionId('rule'),
    varName: 'initiator',
    operator: 0,
    val: ''
  };
}

export function createEmptyConditionGroup(): WorkflowConditionGroup {
  return {
    id: newConditionId('group'),
    conditions: [createEmptyConditionRule()]
  };
}

export function normalizeConditionGroups(
  groups?: WorkflowConditionGroup[] | WorkflowConditionGroupDraft[] | null
): WorkflowConditionGroup[] {
  if (!groups?.length) return [createEmptyConditionGroup()];
  return groups.map((group) => ({
    id: group.id ?? newConditionId('group'),
    conditions: (group.conditions ?? []).map((rule) => {
      const row = rule as WorkflowConditionRule;
      return {
        id: row.id ?? newConditionId('rule'),
        varName: row.varName || 'initiator',
        operator: typeof row.operator === 'number' ? row.operator : 0,
        val: row.val ?? ''
      };
    })
  }));
}

export function formatConditionRuleLabel(
  rule: WorkflowConditionRule,
  fieldLabelMap: Record<string, string> = {}
): string {
  const field =
    fieldLabelMap[rule.varName] ??
    CONDITION_FIELD_PRESETS.find((item) => item.value === rule.varName)?.label ??
    rule.varName;
  const op = OPERATOR_LABEL[rule.operator] ?? '';
  if (!rule.val?.trim()) return field;
  return `${field} ${op} ${rule.val}`.trim();
}

export function formatConditionSummary(
  groups?: WorkflowConditionGroup[] | null,
  fieldLabelMap: Record<string, string> = {}
): string {
  const normalized = normalizeConditionGroups(groups);
  const groupTexts = normalized
    .map((group) => {
      const rules = group.conditions
        .map((rule) => formatConditionRuleLabel(rule, fieldLabelMap))
        .filter(Boolean);
      return rules.length ? rules.join(' 且 ') : '';
    })
    .filter(Boolean);
  return groupTexts.join(' 或 ');
}

export function conditionGroupsToExpression(groups?: WorkflowConditionGroup[] | null): string {
  return formatConditionSummary(groups);
}

export function draftGroupsToCondition(
  groups?: WorkflowConditionGroupDraft[] | null
): WorkflowConditionGroup[] {
  return normalizeConditionGroups(groups as WorkflowConditionGroup[] | undefined);
}

export function conditionGroupsToDraft(
  groups?: WorkflowConditionGroup[] | null
): WorkflowConditionGroupDraft[] {
  return normalizeConditionGroups(groups) as WorkflowConditionGroupDraft[];
}
