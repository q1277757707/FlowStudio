import { NODE } from './constants';
import type { BeeflowConditionNode, BeeflowNode } from './types';

export function findBeeflowGateway(
  root: BeeflowNode,
  blockKey: string
): BeeflowNode | undefined {
  let found: BeeflowNode | undefined;

  function walk(node: BeeflowNode | null | undefined) {
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

export function findBeeflowConditionBranch(
  root: BeeflowNode,
  blockKey: string,
  branchKey: string
): BeeflowConditionNode | undefined {
  const gateway = findBeeflowGateway(root, blockKey);
  return gateway?.conditionNodes?.find((branch) => branch.key === branchKey);
}
