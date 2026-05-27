import type { WorkflowNode } from './types';

export function findWorkflowNodeByKey(root: WorkflowNode, key: string): WorkflowNode | null {
  let found: WorkflowNode | null = null;

  function walk(node: WorkflowNode | null | undefined) {
    if (!node || found) return;
    if (node.key === key) {
      found = node;
      return;
    }
    walk(node.childNode);
    node.conditionNodes?.forEach((branch) => walk(branch.childNode));
  }

  walk(root);
  walk(root.childNode);
  return found;
}

export function patchWorkflowNodeByKey(root: WorkflowNode, key: string, patch: Partial<WorkflowNode>) {
  const node = findWorkflowNodeByKey(root, key);
  if (!node) return false;
  Object.assign(node, patch);
  return true;
}
