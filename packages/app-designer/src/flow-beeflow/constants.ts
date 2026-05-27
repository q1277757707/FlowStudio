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
  START: '#87dd8c',
  APPROVE: '#ff943e',
  COPY: '#3296fa',
  TRANSACT: '#926bd5',
  END: '#a9b4cd'
} as const;

/** 条件网关至少保留的可编辑分支数（与新建时默认 2 条一致） */
export const MIN_CONDITION_BRANCHES = 2;

export type BeeflowNodeType = (typeof NODE)[keyof typeof NODE];

export function isBeeflowStepNodeType(
  type: BeeflowNodeType
): type is typeof NODE.APPROVE | typeof NODE.COPY | typeof NODE.TRANSACT {
  return type === NODE.APPROVE || type === NODE.COPY || type === NODE.TRANSACT;
}

export function isBeeflowLinearNodeType(type: BeeflowNodeType): boolean {
  return type === NODE.START || isBeeflowStepNodeType(type);
}
