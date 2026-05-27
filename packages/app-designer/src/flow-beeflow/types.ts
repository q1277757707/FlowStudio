import type { BeeflowNodeType, NODE } from './constants';

export type { BeeflowNodeType };

export interface BeeflowAssignee {
  rid: string;
  assigneeType: number;
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
  assignees?: BeeflowAssignee[];
  ccs?: BeeflowAssignee[];
  transactors?: BeeflowAssignee[];
}

export interface BeeflowConditionNode {
  key?: string;
  name: string;
  type: typeof NODE.CONDITION;
  priorityLevel: number;
  conditionGroups: Array<{ id?: string; conditions: unknown[] }>;
  conditionExpression?: string;
  childNode?: BeeflowNode | null;
}

export interface BeeflowFlowPermission {
  type: number;
  flowInitiators?: Array<{ id: string; type: number }>;
}
