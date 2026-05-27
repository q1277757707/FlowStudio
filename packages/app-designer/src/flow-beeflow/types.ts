import type { BeeflowNodeType, NODE } from './constants';

export type { BeeflowNodeType };

export interface BeeflowAssignee {
  rid: string;
  assigneeType?: number;
  ccType?: number;
  transactorType?: number;
  layer?: number;
  layerType?: number;
  assignees?: string[];
  roles?: string[];
}

export interface BeeflowNode {
  key?: string;
  name: string;
  type: BeeflowNodeType;
  childNode?: BeeflowNode | null;
  conditionNodes?: BeeflowConditionNode[];
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
  assignees?: BeeflowAssignee[];
  ccs?: BeeflowAssignee[];
  transactors?: BeeflowAssignee[];
}

export interface BeeflowConditionRule {
  id?: string;
  varName: string;
  operator: number;
  val: string;
}

export interface BeeflowConditionGroup {
  id?: string;
  conditions: BeeflowConditionRule[];
}

export interface BeeflowConditionNode {
  key?: string;
  name: string;
  type: typeof NODE.CONDITION;
  priorityLevel: number;
  conditionGroups: BeeflowConditionGroup[];
  conditionExpression?: string;
  childNode?: BeeflowNode | null;
}

export interface BeeflowFlowPermission {
  type: number;
  flowInitiators?: Array<{ id: string; type: number }>;
}
