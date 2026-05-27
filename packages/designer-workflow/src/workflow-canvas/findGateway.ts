import { NODE } from './constants';
import type { WorkflowConditionNode, WorkflowNode } from './types';

export function findWorkflowGateway(
  root: WorkflowNode,
  blockKey: string
): WorkflowNode | undefined {
  let found: WorkflowNode | undefined;

  function walk(node: WorkflowNode | null | undefined) {
    if (!node || found) return;
    if (node.type === NODE.EXCLUSIVE_GATEWANY && node.key === blockKey) {
      found = node;
      return;
    }
    walk(node.childNode);
    node.conditionNodes?.forEach((branch) => walk(branch.childNode));
  }

  walk(root);
  return found;
}

export function findWorkflowConditionBranch(
  root: WorkflowNode,
  blockKey: string,
  branchKey: string
): WorkflowConditionNode | undefined {
  const gateway = findWorkflowGateway(root, blockKey);
  return gateway?.conditionNodes?.find((branch) => branch.key === branchKey);
}
