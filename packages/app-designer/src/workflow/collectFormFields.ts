import type { LowCodeNode } from '@designer-core/schema';

export function collectFormFieldOptions(components: LowCodeNode[]) {
  const formFields: Array<{ value: string; label: string }> = [];

  const walk = (nodes: LowCodeNode[]) => {
    for (const node of nodes) {
      const rawLabel = node.props?.label;
      const label = typeof rawLabel === 'string' && rawLabel.trim() ? rawLabel : node.type;
      if (node.id) formFields.push({ value: node.id, label });
      if (node.children?.length) walk(node.children);
    }
  };

  walk(components);
  return formFields;
}
