import type { WorkflowNodeType, NODE } from './constants';

export type { WorkflowNodeType };

export interface WorkflowAssignee {
  rid: string;
  assigneeType?: number;
  ccType?: number;
  transactorType?: number;
  layer?: number;
  layerType?: number;
  assignees?: string[];
  roles?: string[];
}

export interface WorkflowNode {
  key?: string;
  name: string;
  type: WorkflowNodeType;
  childNode?: WorkflowNode | null;
  conditionNodes?: WorkflowConditionNode[];
  approvalType?: number;
  multiInstanceApprovalType?: number;
  flowNodeNoAuditorType?: number;
  flowNodeNoAuditorAssignee?: string;
  flowNodeAuditAdmin?: string;
  flowNodeSelfAuditorType?: number;
  assignable?: boolean;
  signable?: boolean;
  backable?: boolean;
  signature?: boolean;
  assignees?: WorkflowAssignee[];
  ccs?: WorkflowAssignee[];
  transactors?: WorkflowAssignee[];
}

export interface WorkflowConditionRule {
  id?: string;
  varName: string;
  operator: number;
  val: string;
}

export interface WorkflowConditionGroup {
  id?: string;
  conditions: WorkflowConditionRule[];
}

export interface WorkflowConditionNode {
  key?: string;
  name: string;
  type: typeof NODE.CONDITION;
  priorityLevel: number;
  conditionGroups: WorkflowConditionGroup[];
  conditionExpression?: string;
  childNode?: WorkflowNode | null;
}

export interface WorkflowFlowPermission {
  type: number;
  flowInitiators?: Array<{ id: string; type: number }>;
}
