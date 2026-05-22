import type { LowCodeNode } from '@designer-core/schema';

export interface CanvasFieldRef {
  id: string;
  label: string;
  type: string;
}

const FIELD_TYPES = new Set([
  'Input',
  'Textarea',
  'InputNumber',
  'Select',
  'RadioGroup',
  'CheckboxGroup',
  'Switch',
  'DatePicker',
  'TimePicker',
  'Slider',
  'Rate',
  'ColorPicker',
  'Cascader',
  'TreeSelect',
  'Upload'
]);

export function collectCanvasFields(nodes: LowCodeNode[]): CanvasFieldRef[] {
  const list: CanvasFieldRef[] = [];

  function walk(nodeList: LowCodeNode[]) {
    for (const node of nodeList) {
      if (FIELD_TYPES.has(node.type)) {
        const label = node.props.label;
        list.push({
          id: node.id,
          label: typeof label === 'string' && label ? label : node.id,
          type: node.type
        });
      }

      walk(node.children ?? []);

      for (const cell of node.gridCells ?? []) {
        walk(cell.children);
      }
    }
  }

  walk(nodes);
  return list;
}
