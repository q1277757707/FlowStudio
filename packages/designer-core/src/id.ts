let seed = 0;

export function createNodeId(type: string): string {
  seed += 1;
  return `${type.toLowerCase()}_${Date.now()}_${seed}`;
}

export function createActionId(): string {
  seed += 1;
  return `action_${Date.now()}_${seed}`;
}
