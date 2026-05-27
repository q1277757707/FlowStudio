/** 源自 workflow-engine FlowConstant.js */
export const NODE = {
  START: 0,
  APPROVE: 1,
  COPY: 2,
  CONDITION: 3,
  EXCLUSIVE_GATEWANY: 4,
  TRANSACT: 5,
  END: 9
} as const;

export const NODE_COLOR = {
  START: '#52c41a',
  APPROVE: '#fa8c16',
  COPY: '#1677ff',
  CONDITION: '#13c2c2',
  TRANSACT: '#722ed1',
  END: '#8c8c8c'
} as const;

/** 条件网关至少保留的可编辑分支数（与新建时默认 2 条一致） */
export const MIN_CONDITION_BRANCHES = 2;

export type WorkflowNodeType = (typeof NODE)[keyof typeof NODE];

export function isWorkflowStepNodeType(
  type: WorkflowNodeType
): type is typeof NODE.APPROVE | typeof NODE.COPY | typeof NODE.TRANSACT {
  return type === NODE.APPROVE || type === NODE.COPY || type === NODE.TRANSACT;
}

export function isWorkflowLinearNodeType(type: WorkflowNodeType): boolean {
  return type === NODE.START || isWorkflowStepNodeType(type);
}
