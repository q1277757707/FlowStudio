import { cloneDeep } from 'lodash-es';

// ─── 基础类型 ──────────────────────────────────────────────────────────────────

export type WorkflowStepKind = 'approval' | 'cc' | 'handler' | 'condition';
export type WorkflowTemplateStatus = 'draft' | 'published' | 'disabled';
export type WorkflowAssigneeMode =
  | 'initiatorSelf'
  | 'initiatorManager'
  | 'specifiedUsers'
  | 'specifiedRoles'
  | 'formContact';

export interface WorkflowStartSettings {
  initiatorMode: 'all' | 'role' | 'user';
  initiatorValue?: string;
}

export interface WorkflowStepDraft {
  key: string;
  kind: WorkflowStepKind;
  name: string;
  assigneeMode: WorkflowAssigneeMode;
  assigneeValue: string;
  approveMode?: 'or' | 'and';
  condition?: string;
}

export interface WorkflowConditionBranchDraft {
  key: string;
  label: string;
  priority: number;
  isDefault: boolean;
  condition: string;
  steps: WorkflowFlowItem[];
}

export interface WorkflowBranchBlockDraft {
  key: string;
  branches: WorkflowConditionBranchDraft[];
}

export type WorkflowFlowItem =
  | { type: 'step'; step: WorkflowStepDraft }
  | { type: 'branch'; block: WorkflowBranchBlockDraft };

// ─── 节点类型（编译产物）──────────────────────────────────────────────────────

export type WorkflowNodeType = 'start' | 'end' | 'approval' | 'cc' | 'handler' | 'condition';

export interface WorkflowStartNode {
  key: string;
  type: 'start';
  nextKey: string;
  initiatorMode?: WorkflowStartSettings['initiatorMode'];
  initiatorValue?: string;
  initiatorLabel?: string;
}

export interface WorkflowEndNode {
  key: string;
  type: 'end';
}

export interface WorkflowApprovalNode {
  key: string;
  type: 'approval';
  name: string;
  assignee: { type: 'user' | 'role'; value: string; mode: WorkflowAssigneeMode };
  approveMode?: 'or' | 'and';
  condition?: string;
  nextKey: string;
}

export interface WorkflowCcNode {
  key: string;
  type: 'cc';
  name: string;
  assignee: { type: 'user' | 'role'; value: string; mode: WorkflowAssigneeMode };
  nextKey: string;
}

export interface WorkflowHandlerNode {
  key: string;
  type: 'handler';
  name: string;
  assignee: { type: 'user' | 'role'; value: string; mode: WorkflowAssigneeMode };
  nextKey: string;
}

export interface WorkflowConditionNode {
  key: string;
  type: 'condition';
  name: string;
  branches?: Array<{ key: string; expression: string; nextKey: string }>;
  nextKey: string;
}

export type WorkflowNode =
  | WorkflowStartNode
  | WorkflowEndNode
  | WorkflowApprovalNode
  | WorkflowCcNode
  | WorkflowHandlerNode
  | WorkflowConditionNode;

export interface WorkflowTemplate {
  code: string;
  name: string;
  version: number;
  status: WorkflowTemplateStatus;
  nodes: WorkflowNode[];
  updatedAt?: string;
}

// ─── 校验 ─────────────────────────────────────────────────────────────────────

export interface WorkflowValidationIssue {
  key: string;
  message: string;
}

export interface WorkflowValidationResult {
  valid: boolean;
  issues: WorkflowValidationIssue[];
}

export function validateWorkflowTemplate(template: WorkflowTemplate): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = [];

  for (const node of template.nodes) {
    if (node.type === 'approval' || node.type === 'cc' || node.type === 'handler') {
      if (!node.assignee?.value && node.assignee?.mode !== 'initiatorSelf') {
        issues.push({ key: node.key, message: `节点「${node.name}」未设置执行人` });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

// ─── Key 生成 ─────────────────────────────────────────────────────────────────

let _keySeq = 0;

export function createWorkflowStepKey(kind: WorkflowStepKind): string {
  _keySeq += 1;
  return `${kind}_${Date.now()}_${_keySeq}`;
}

// ─── 默认名称 ─────────────────────────────────────────────────────────────────

const DEFAULT_STEP_NAME: Record<WorkflowStepKind, string> = {
  approval: '审批',
  cc: '抄送',
  handler: '办理',
  condition: '条件分支'
};

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

export function getWorkflowStepKindLabel(kind: WorkflowStepKind): string {
  return DEFAULT_STEP_NAME[kind] ?? kind;
}

export function formatAssigneeSummary(step: WorkflowStepDraft): string {
  switch (step.assigneeMode) {
    case 'initiatorSelf':
      return '发起人本人';
    case 'initiatorManager':
      return '发起人主管';
    case 'formContact':
      return '表单内联系人';
    case 'specifiedUsers':
      return step.assigneeValue ? `成员: ${step.assigneeValue}` : '';
    case 'specifiedRoles':
      return step.assigneeValue ? `角色: ${step.assigneeValue}` : '';
    default:
      return '';
  }
}

export function formatInitiatorLabel(settings: WorkflowStartSettings): string {
  if (settings.initiatorMode === 'all') return '全员可提交';
  if (settings.initiatorMode === 'role') return `角色: ${settings.initiatorValue ?? ''}`;
  if (settings.initiatorMode === 'user') return `成员: ${settings.initiatorValue ?? ''}`;
  return '';
}

// ─── 初始模板 ─────────────────────────────────────────────────────────────────

export function createInitialWorkflowTemplate(): WorkflowTemplate {
  return {
    code: 'wf_default',
    name: '默认审批流',
    version: 1,
    status: 'draft',
    nodes: [
      {
        key: 'start',
        type: 'start',
        nextKey: 'end',
        initiatorMode: 'all',
        initiatorLabel: '全员可提交'
      },
      { key: 'end', type: 'end' }
    ],
    updatedAt: new Date().toISOString()
  };
}

export function isStartEndOnlyWorkflowTemplate(template: WorkflowTemplate): boolean {
  const start = template.nodes.find((n) => n.type === 'start');
  if (!start || start.type !== 'start' || start.nextKey !== 'end') return false;
  const middle = template.nodes.filter((n) => n.type !== 'start' && n.type !== 'end');
  return middle.length === 0 && template.nodes.some((n) => n.type === 'end');
}

// ─── 创建空节点 ───────────────────────────────────────────────────────────────

export function createEmptyStep(kind: WorkflowStepKind): WorkflowStepDraft {
  return {
    key: createWorkflowStepKey(kind),
    kind,
    name: DEFAULT_STEP_NAME[kind],
    assigneeMode: kind === 'approval' ? 'initiatorSelf' : 'specifiedRoles',
    assigneeValue: '',
    approveMode: kind === 'approval' ? 'or' : undefined
  };
}

/** 新建条件分支：默认 2 条空条件 */
export function createDefaultBranchBlock(): WorkflowBranchBlockDraft {
  const blockKey = createWorkflowStepKey('branch' as WorkflowStepKind);
  return {
    key: blockKey,
    branches: [
      { key: `${blockKey}_c1`, label: '条件1', priority: 1, isDefault: false, condition: '', steps: [] },
      { key: `${blockKey}_c2`, label: '条件2', priority: 2, isDefault: false, condition: '', steps: [] }
    ]
  };
}

export function createFlowItem(kind: WorkflowStepKind): WorkflowFlowItem {
  if (kind === 'condition') return { type: 'branch', block: createDefaultBranchBlock() };
  return { type: 'step', step: createEmptyStep(kind) };
}

export function cloneWorkflowTemplate(template: WorkflowTemplate): WorkflowTemplate {
  return cloneDeep(template);
}

// ─── 模板正规化 ───────────────────────────────────────────────────────────────

export function normalizeBranchBlock(block: WorkflowBranchBlockDraft): WorkflowBranchBlockDraft {
  return {
    ...block,
    branches: block.branches.map((b) => ({
      ...b,
      steps: normalizeBranchColumnSteps(b.steps)
    }))
  };
}

export function normalizeBranchColumnSteps(steps: unknown): WorkflowFlowItem[] {
  if (!Array.isArray(steps) || steps.length === 0) return [];
  const first = steps[0] as WorkflowFlowItem | WorkflowStepDraft;
  if (first && typeof first === 'object' && 'type' in first && (first.type === 'step' || first.type === 'branch')) {
    return (steps as WorkflowFlowItem[]).map((item) =>
      item.type === 'branch' ? { type: 'branch', block: normalizeBranchBlock(item.block) } : item
    );
  }
  return (steps as WorkflowStepDraft[]).map((step) => ({ type: 'step', step }));
}

// ─── 解析模板 ─────────────────────────────────────────────────────────────────

export function parseStartSettingsFromTemplate(template: WorkflowTemplate): WorkflowStartSettings {
  const start = template.nodes.find((n) => n.type === 'start');
  if (!start || start.type !== 'start') return { initiatorMode: 'all' };
  if (start.initiatorMode) return { initiatorMode: start.initiatorMode, initiatorValue: start.initiatorValue };
  return { initiatorMode: 'all' };
}

export function parseFlowItemsFromTemplate(template: WorkflowTemplate): WorkflowFlowItem[] {
  return parseFlowStepsFromTemplate(template).map((step) => ({ type: 'step' as const, step }));
}

function inferAssigneeMode(assignee: { type: string; value: string; mode?: string }): WorkflowAssigneeMode {
  if (assignee.mode) return assignee.mode as WorkflowAssigneeMode;
  return assignee.type === 'user' ? 'specifiedUsers' : 'specifiedRoles';
}

function nodeToStepDraft(node: WorkflowNode): WorkflowStepDraft | null {
  if (node.type === 'approval') {
    const mode = inferAssigneeMode(node.assignee);
    return {
      key: node.key, kind: 'approval', name: node.name,
      assigneeMode: mode,
      assigneeValue: mode === 'specifiedUsers' || mode === 'specifiedRoles' ? node.assignee.value : '',
      approveMode: node.approveMode ?? 'or', condition: node.condition
    };
  }
  if (node.type === 'cc' || node.type === 'handler') {
    const mode = inferAssigneeMode(node.assignee);
    return {
      key: node.key, kind: node.type, name: node.name,
      assigneeMode: mode,
      assigneeValue: mode === 'specifiedUsers' || mode === 'specifiedRoles' ? node.assignee.value : ''
    };
  }
  return null;
}

export function parseFlowStepsFromTemplate(template: WorkflowTemplate): WorkflowStepDraft[] {
  const nodeMap = new Map(template.nodes.map((n) => [n.key, n]));
  const start = template.nodes.find((n) => n.type === 'start');
  if (!start || start.type !== 'start') return [];
  const steps: WorkflowStepDraft[] = [];
  let currentKey: string | undefined = start.nextKey;
  while (currentKey && currentKey !== 'end') {
    const node = nodeMap.get(currentKey);
    if (!node) break;
    const draft = nodeToStepDraft(node);
    if (!draft) break;
    steps.push(draft);
    currentKey = 'nextKey' in node ? node.nextKey : undefined;
  }
  return steps;
}

// ─── 编译模板 ─────────────────────────────────────────────────────────────────

function resolveAssigneeFromMode(step: WorkflowStepDraft): WorkflowApprovalNode['assignee'] {
  const type = step.assigneeMode === 'specifiedUsers' ? 'user' : 'role';
  return { type, value: step.assigneeValue, mode: step.assigneeMode };
}

export function compileWorkflowTemplate(
  meta: Pick<WorkflowTemplate, 'code' | 'name' | 'version' | 'status'>,
  flowItems: WorkflowFlowItem[],
  start: WorkflowStartSettings
): WorkflowTemplate {
  const startKey = 'start';
  const endKey = 'end';
  const nodes: WorkflowNode[] = [];

  const steps = flowItems.filter((i) => i.type === 'step').map((i) => (i as { type: 'step'; step: WorkflowStepDraft }).step);
  const firstKey = steps[0]?.key ?? endKey;

  nodes.push({
    key: startKey, type: 'start', nextKey: firstKey,
    initiatorMode: start.initiatorMode, initiatorValue: start.initiatorValue,
    initiatorLabel: formatInitiatorLabel(start)
  });

  steps.forEach((step, idx) => {
    const nextKey = steps[idx + 1]?.key ?? endKey;
    const assignee = resolveAssigneeFromMode(step);
    if (step.kind === 'approval') {
      nodes.push({ key: step.key, type: 'approval', name: step.name, assignee, approveMode: step.approveMode ?? 'or', nextKey });
    } else if (step.kind === 'cc') {
      nodes.push({ key: step.key, type: 'cc', name: step.name, assignee, nextKey });
    } else if (step.kind === 'handler') {
      nodes.push({ key: step.key, type: 'handler', name: step.name, assignee, nextKey });
    }
  });

  nodes.push({ key: endKey, type: 'end' });
  return { ...meta, nodes, updatedAt: new Date().toISOString() };
}

export function walkFlowItems(items: WorkflowFlowItem[], visit: (item: WorkflowFlowItem) => void): void {
  for (const item of items) {
    visit(item);
    if (item.type === 'branch') {
      for (const branch of item.block.branches) walkFlowItems(branch.steps, visit);
    }
  }
}
