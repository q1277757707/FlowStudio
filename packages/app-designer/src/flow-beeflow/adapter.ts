import type {
  WorkflowFlowItem,
  WorkflowStartSettings,
  WorkflowStepDraft,
  WorkflowStepKind,
  WorkflowTemplate
} from '@designer-core/workflow';
import {
  createDefaultBranchBlock,
  createEmptyStep,
  formatInitiatorLabel
} from '@designer-core/workflow';
import {
  beeflowGroupsToDraft,
  draftGroupsToBeeflow,
  formatConditionSummary,
  normalizeConditionGroups
} from './condition';
import { isBeeflowStepNodeType, NODE } from './constants';
import type { BeeflowConditionNode, BeeflowFlowPermission, BeeflowNode } from './types';

function newKey(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialFlowPermission(): BeeflowFlowPermission {
  return { type: 0 };
}

export function createInitialNodeConfig(): BeeflowNode {
  return { key: 'start', name: '开始', type: NODE.START, childNode: null };
}

function startSettingsToPermission(settings: WorkflowStartSettings): BeeflowFlowPermission {
  if (settings.initiatorMode === 'all') return { type: 0 };
  if (settings.initiatorMode === 'user') {
    const ids = (settings.initiatorValue ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return { type: 1, flowInitiators: ids.map((id) => ({ id, type: 0 })) };
  }
  return { type: 1, flowInitiators: [{ id: settings.initiatorValue ?? '', type: 2 }] };
}

function permissionToStartSettings(permission: BeeflowFlowPermission): WorkflowStartSettings {
  if (permission.type === 0) return { initiatorMode: 'all' };
  const first = permission.flowInitiators?.[0];
  if (!first) return { initiatorMode: 'all' };
  if (first.type === 2) return { initiatorMode: 'role', initiatorValue: first.id };
  const users = (permission.flowInitiators ?? []).filter((i) => i.type === 0).map((i) => i.id).join(',');
  return { initiatorMode: 'user', initiatorValue: users };
}

function assigneeModeToBeeflow(mode: WorkflowStepDraft['assigneeMode']): number {
  switch (mode) {
    case 'initiatorSelf': return 0;
    case 'initiatorManager': return 1;
    case 'specifiedRoles': return 3;
    case 'specifiedUsers': return 4;
    default: return 0;
  }
}

function stepToBeeflowNode(step: WorkflowStepDraft, childNode: BeeflowNode | null): BeeflowNode {
  const base = { key: step.key, name: step.name, childNode };
  const assigneeType = assigneeModeToBeeflow(step.assigneeMode);
  const assigneeVal = step.assigneeValue ?? '';
  const assigneeObj = {
    rid: newKey('a'),
    assigneeType,
    ...(assigneeType === 4 ? { assignees: assigneeVal.split(',').filter(Boolean) } : {}),
    ...(assigneeType === 3 ? { roles: [assigneeVal] } : {})
  };

  if (step.kind === 'approval') {
    const multi = step.approveMode === 'and' ? 1 : step.approveMode === 'or' ? 2 : 0;
    return {
      ...base,
      type: NODE.APPROVE,
      approvalType: 0,
      multiInstanceApprovalType: multi,
      flowNodeNoAuditorType: 0,
      flowNodeSelfAuditorType: 0,
      assignable: true,
      signable: true,
      backable: true,
      assignees: [assigneeObj]
    };
  }
  if (step.kind === 'cc') {
    return {
      ...base,
      type: NODE.COPY,
      ccs: [{ ...assigneeObj, ccType: assigneeType, assigneeType }]
    };
  }
  return {
    ...base,
    type: NODE.TRANSACT,
    transactors: [{ ...assigneeObj, transactorType: assigneeType, assigneeType }]
  };
}

function beeflowAssigneeToMode(assignee?: {
  assigneeType?: number;
  ccType?: number;
  transactorType?: number;
}): WorkflowStepDraft['assigneeMode'] {
  if (!assignee) return 'initiatorSelf';
  const type = assignee.ccType ?? assignee.transactorType ?? assignee.assigneeType ?? 0;
  switch (type) {
    case 0: return 'initiatorSelf';
    case 1: return 'initiatorManager';
    case 3: return 'specifiedRoles';
    case 4: return 'specifiedUsers';
    default: return 'initiatorSelf';
  }
}

function beeflowAssigneeValue(assignee?: {
  assigneeType?: number;
  ccType?: number;
  transactorType?: number;
  assignees?: string[];
  roles?: string[];
}) {
  if (!assignee) return '';
  const type = assignee.ccType ?? assignee.transactorType ?? assignee.assigneeType ?? 0;
  if (type === 4) return (assignee.assignees ?? []).join(',');
  if (type === 3) return assignee.roles?.[0] ?? '';
  return '';
}

function beeflowToStep(node: BeeflowNode): WorkflowStepDraft | null {
  if (node.type === NODE.APPROVE) {
    const assignee = node.assignees?.[0];
    const approveMode =
      node.multiInstanceApprovalType === 1 ? 'and' : node.multiInstanceApprovalType === 2 ? 'or' : 'or';
    return {
      key: node.key ?? newKey('approval'),
      kind: 'approval',
      name: node.name || '审批',
      assigneeMode: beeflowAssigneeToMode(assignee),
      assigneeValue: beeflowAssigneeValue(assignee),
      approveMode
    };
  }
  if (node.type === NODE.COPY) {
    const cc = node.ccs?.[0];
    return { key: node.key ?? newKey('cc'), kind: 'cc', name: node.name || '抄送', assigneeMode: beeflowAssigneeToMode(cc), assigneeValue: beeflowAssigneeValue(cc) };
  }
  if (node.type === NODE.TRANSACT) {
    const t = node.transactors?.[0];
    return { key: node.key ?? newKey('handler'), kind: 'handler', name: node.name || '办理', assigneeMode: beeflowAssigneeToMode(t), assigneeValue: beeflowAssigneeValue(t) };
  }
  return null;
}

function branchToGateway(block: ReturnType<typeof createDefaultBranchBlock>, childNode: BeeflowNode | null): BeeflowNode {
  const conditionNodes: BeeflowConditionNode[] = block.branches
    .filter((b) => !b.isDefault)
    .map((branch, index) => ({
      key: branch.key,
      name: branch.label,
      type: NODE.CONDITION,
      priorityLevel: branch.priority ?? index + 1,
      conditionGroups: branch.conditionGroups?.length
        ? draftGroupsToBeeflow(branch.conditionGroups)
        : branch.condition?.trim()
          ? normalizeConditionGroups([
              { conditions: [{ varName: 'expr', operator: 0, val: branch.condition }] }
            ])
          : [],
      childNode: flowItemsToChildNode(branch.steps)
    }));

  return {
    key: block.key,
    name: '条件分支',
    type: NODE.EXCLUSIVE_GATEWANY,
    childNode,
    conditionNodes: conditionNodes.length
      ? conditionNodes
      : block.branches.map((branch, index) => ({
          key: branch.key,
          name: branch.label,
          type: NODE.CONDITION,
          priorityLevel: branch.priority ?? index + 1,
          conditionGroups: [],
          childNode: null
        }))
  };
}

/** 新建排他网关：默认 2 条条件，条件 1 承接原 childNode */
export function createBeeflowGatewayNode(mergeChildNode: BeeflowNode | null): BeeflowNode {
  const block = createDefaultBranchBlock();
  return {
    key: block.key,
    name: '条件分支',
    type: NODE.EXCLUSIVE_GATEWANY,
    childNode: null,
    conditionNodes: block.branches.map((branch, index) => ({
      key: branch.key,
      name: branch.label,
      type: NODE.CONDITION,
      priorityLevel: branch.priority ?? index + 1,
      conditionGroups: [],
      childNode: index === 0 ? mergeChildNode : null
    }))
  };
}

function flowItemsToChildNode(items: WorkflowFlowItem[]): BeeflowNode | null {
  if (!items.length) return null;
  return flowItemsToChain(items, 0);
}

function flowItemsToChain(items: WorkflowFlowItem[], index: number): BeeflowNode | null {
  if (index >= items.length) return null;
  const item = items[index];
  const rest = flowItemsToChain(items, index + 1);
  if (item.type === 'step') return stepToBeeflowNode(item.step, rest);
  return branchToGateway(item.block, rest);
}

export function flowItemsToNodeConfig(
  flowItems: WorkflowFlowItem[],
  startSettings: WorkflowStartSettings
): { nodeConfig: BeeflowNode; flowPermission: BeeflowFlowPermission } {
  return {
    nodeConfig: { key: 'start', name: '开始', type: NODE.START, childNode: flowItemsToChildNode(flowItems) },
    flowPermission: startSettingsToPermission(startSettings)
  };
}

function collectBranchSteps(condition: BeeflowConditionNode): WorkflowFlowItem[] {
  const items: WorkflowFlowItem[] = [];
  if (condition.childNode) walkBeeflowChain(condition.childNode, items);
  return items;
}

function extractConditionText(cond: BeeflowConditionNode): string {
  return formatConditionSummary(cond.conditionGroups);
}

function gatewayToFlowItems(node: BeeflowNode): WorkflowFlowItem[] {
  const block = createDefaultBranchBlock();
  block.key = node.key ?? block.key;
  const branches = (node.conditionNodes ?? [])
    .filter((cond) => cond.name !== '默认条件')
    .map((cond, index) => ({
      key: cond.key ?? `${block.key}_c${index + 1}`,
      label: cond.name || `条件${index + 1}`,
      priority: cond.priorityLevel ?? index + 1,
      isDefault: false,
      condition: extractConditionText(cond),
      conditionGroups: beeflowGroupsToDraft(cond.conditionGroups),
      steps: collectBranchSteps(cond)
    }));
  block.branches = branches.length ? branches : createDefaultBranchBlock().branches;
  return [{ type: 'branch' as const, block }];
}

function walkBeeflowChain(node: BeeflowNode, out: WorkflowFlowItem[]) {
  if (node.type === NODE.EXCLUSIVE_GATEWANY) {
    out.push(...gatewayToFlowItems(node));
    if (node.childNode) walkBeeflowChain(node.childNode, out);
    return;
  }
  if (isBeeflowStepNodeType(node.type)) {
    const step = beeflowToStep(node);
    if (step) out.push({ type: 'step', step });
    if (node.childNode) walkBeeflowChain(node.childNode, out);
  }
}

export function nodeConfigToFlowItems(nodeConfig: BeeflowNode): WorkflowFlowItem[] {
  const items: WorkflowFlowItem[] = [];
  if (nodeConfig.childNode) walkBeeflowChain(nodeConfig.childNode, items);
  return items;
}

export function nodeConfigToStartSettings(
  _nodeConfig: BeeflowNode,
  flowPermission: BeeflowFlowPermission
): WorkflowStartSettings {
  return permissionToStartSettings(flowPermission);
}

export function formatBeeflowStartSummary(permission: BeeflowFlowPermission): string {
  return formatInitiatorLabel(permissionToStartSettings(permission));
}

export function createBeeflowNodeForKind(kind: WorkflowStepKind, childNode: BeeflowNode | null): BeeflowNode {
  if (kind === 'condition') return createBeeflowGatewayNode(childNode);
  return stepToBeeflowNode(createEmptyStep(kind), childNode);
}

export function ensureNodeKeys(node: BeeflowNode | null | undefined): BeeflowNode | null {
  if (!node) return null;
  if (!node.key) node.key = newKey('node');
  if (node.conditionNodes) {
    node.conditionNodes.forEach((branch, index) => {
      if (!branch.key) branch.key = `${node.key}_c${index + 1}`;
      branch.childNode = ensureNodeKeys(branch.childNode);
    });
  }
  node.childNode = ensureNodeKeys(node.childNode);
  return node;
}

export function compileFromBeeflow(
  meta: Pick<WorkflowTemplate, 'code' | 'name' | 'version' | 'status'>,
  nodeConfig: BeeflowNode,
  flowPermission: BeeflowFlowPermission,
  compile: (meta: Pick<WorkflowTemplate, 'code' | 'name' | 'version' | 'status'>, flowItems: WorkflowFlowItem[], start: WorkflowStartSettings) => WorkflowTemplate
): WorkflowTemplate {
  const flowItems = nodeConfigToFlowItems(nodeConfig);
  const startSettings = nodeConfigToStartSettings(nodeConfig, flowPermission);
  return compile(meta, flowItems, startSettings);
}
