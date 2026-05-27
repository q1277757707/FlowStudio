import type { BeeflowNode } from './types';

export function findBeeflowNodeByKey(root: BeeflowNode, key: string): BeeflowNode | null {
  let found: BeeflowNode | null = null;

  function walk(node: BeeflowNode | null | undefined) {
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

export function patchBeeflowNodeByKey(root: BeeflowNode, key: string, patch: Partial<BeeflowNode>) {
  const node = findBeeflowNodeByKey(root, key);
  if (!node) return false;
  Object.assign(node, patch);
  return true;
}
