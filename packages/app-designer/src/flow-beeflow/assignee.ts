import { NODE } from './constants';
import type { BeeflowAssignee, BeeflowNode } from './types';

export const ASSIGNEE = {
  SELF: 0,
  SUPERIOR: 1,
  DEPARTMENT_LEADER: 2,
  ROLE: 3,
  ASSIGNEE: 4,
  MULTISTEP_LEADER: 5,
  MULTISTEP_DEPARTMENT_LEADER: 6,
  INITIATOR_CHOICE: 7
} as const;

export function newRid() {
  return `rid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export type AssigneeListMode = 'approve' | 'cc' | 'transact';

export function getAssigneeType(item: BeeflowAssignee, mode: AssigneeListMode): number {
  if (mode === 'cc') return item.ccType ?? item.assigneeType ?? ASSIGNEE.SELF;
  if (mode === 'transact') return item.transactorType ?? item.assigneeType ?? ASSIGNEE.SELF;
  return item.assigneeType ?? ASSIGNEE.SELF;
}

export function setAssigneeType(item: BeeflowAssignee, mode: AssigneeListMode, type: number) {
  if (mode === 'cc') {
    item.ccType = type;
    item.assigneeType = type;
    return;
  }
  if (mode === 'transact') {
    item.transactorType = type;
    item.assigneeType = type;
    return;
  }
  item.assigneeType = type;
}

export function onAssigneeTypeChanged(item: BeeflowAssignee, type: number) {
  if ([ASSIGNEE.SUPERIOR, ASSIGNEE.DEPARTMENT_LEADER, ASSIGNEE.MULTISTEP_LEADER, ASSIGNEE.MULTISTEP_DEPARTMENT_LEADER].includes(type as never)) {
    item.layerType = item.layerType ?? 0;
    item.layer = item.layer ?? 0;
    delete item.roles;
    delete item.assignees;
  } else if ([ASSIGNEE.SELF, ASSIGNEE.INITIATOR_CHOICE].includes(type as never)) {
    delete item.layerType;
    delete item.layer;
    delete item.roles;
    delete item.assignees;
  } else if (type === ASSIGNEE.ROLE) {
    delete item.layerType;
    delete item.layer;
    item.roles = item.roles ?? [];
    delete item.assignees;
  } else if (type === ASSIGNEE.ASSIGNEE) {
    item.assignees = item.assignees ?? [];
    delete item.layerType;
    delete item.layer;
    delete item.roles;
  }
}

export function layerOptionLabel(layer: number, layerType: number, kind: 'superior' | 'dept') {
  if (kind === 'superior') {
    if (layerType === 0) return layer === 0 ? '直属上级' : `直属上级加 ${layer} 级`;
    return layer === 0 ? '最高上级' : `最高上级减 ${layer} 级`;
  }
  if (layerType === 0) return layer === 0 ? '直属部门负责人' : `直属部门负责人加 ${layer} 级`;
  return layer === 0 ? '最高部门负责人' : `最高部门负责人减 ${layer} 级`;
}

export function formatBeeflowNodeAssigneeSummary(node: BeeflowNode): string {
  if (node.type === NODE.APPROVE) {
    const list = node.assignees ?? [];
    if (!list.length) return '';
    if (node.approvalType === 1) return '自动通过';
    if (node.approvalType === 2) return '自动拒绝';
    return list.map((item) => formatAssigneeItem(item, 'approve')).join('、');
  }
  if (node.type === NODE.COPY) {
    return (node.ccs ?? []).map((item) => formatAssigneeItem(item, 'cc')).join('、');
  }
  if (node.type === NODE.TRANSACT) {
    return (node.transactors ?? []).map((item) => formatAssigneeItem(item, 'transact')).join('、');
  }
  return '';
}

export const ASSIGNEE_LABELS: Record<number, string> = {
  [ASSIGNEE.SELF]: '发起人本人',
  [ASSIGNEE.SUPERIOR]: '上级',
  [ASSIGNEE.DEPARTMENT_LEADER]: '部门负责人',
  [ASSIGNEE.ROLE]: '角色',
  [ASSIGNEE.ASSIGNEE]: '指定成员',
  [ASSIGNEE.MULTISTEP_LEADER]: '连续多级上级',
  [ASSIGNEE.MULTISTEP_DEPARTMENT_LEADER]: '连续多级部门负责人',
  [ASSIGNEE.INITIATOR_CHOICE]: '发起人自选'
};

function formatAssigneeItem(item: BeeflowAssignee, mode: AssigneeListMode): string {
  const type = getAssigneeType(item, mode);
  const base = ASSIGNEE_LABELS[type] ?? '审批人';
  if (type === ASSIGNEE.ASSIGNEE && item.assignees?.length) {
    return `${base}: ${item.assignees.join(',')}`;
  }
  if (type === ASSIGNEE.ROLE && item.roles?.length) {
    return `${base}: ${item.roles.join(',')}`;
  }
  if ([ASSIGNEE.SUPERIOR, ASSIGNEE.DEPARTMENT_LEADER].includes(type as never)) {
    const kind = type === ASSIGNEE.SUPERIOR ? 'superior' : 'dept';
    return `${base}（${layerOptionLabel(item.layer ?? 0, item.layerType ?? 0, kind)}）`;
  }
  return base;
}
