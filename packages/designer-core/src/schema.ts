import cloneDeep from 'lodash-es/cloneDeep';

export type ComponentType =
  | 'Container'
  | 'Form'
  | 'Input'
  | 'Textarea'
  | 'InputNumber'
  | 'Select'
  | 'RadioGroup'
  | 'CheckboxGroup'
  | 'Switch'
  | 'DatePicker'
  | 'TimePicker'
  | 'Slider'
  | 'Rate'
  | 'ColorPicker'
  | 'Cascader'
  | 'TreeSelect'
  | 'Upload'
  | 'Button'
  | 'Text';

export type EventActionType =
  | 'request'
  | 'setVariable'
  | 'message'
  | 'dialog'
  | 'navigate'
  | 'reload'
  | 'emit'
  | 'condition'
  | 'loop'
  | 'delay'
  | 'customJS'
  | 'setVisible';

export interface EventAction {
  id?: string;
  /** 与 type 等价，历史字段保留 */
  action: EventActionType;
  type?: EventActionType;
  config?: Record<string, unknown>;
}

export interface EventSchema {
  id?: string;
  eventName: string;
  actions: EventAction[];
}

export interface LowCodeGridCell {
  id: string;
  row: number;
  col: number;
  children: LowCodeNode[];
}

export interface LowCodeNode {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  model?: string;
  events?: Record<string, EventAction[]>;
  children?: LowCodeNode[];
  gridCells?: LowCodeGridCell[];
}

export interface PageSchema {
  pageId: string;
  pageName: string;
  components: LowCodeNode[];
  /** 页面级事件，如 pageLoad */
  pageEvents?: Record<string, EventAction[]>;
}

export function createInitialSchema(): PageSchema {
  return {
    pageId: 'page_001',
    pageName: '页面1',
    components: []
  };
}

/** 深拷贝页面 Schema（Lodash cloneDeep，兼容 Vue 响应式代理） */
export function cloneSchema(schema: PageSchema): PageSchema {
  return cloneDeep(schema);
}

export function findNodeById(nodes: LowCodeNode[], id?: string): LowCodeNode | undefined {
  if (!id) {
    return undefined;
  }

  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const child = findNodeById(node.children ?? [], id) ?? findNodeInGridCells(node.gridCells ?? [], id);
    if (child) {
      return child;
    }
  }

  return undefined;
}

export function createGridCells(rows: number, cols: number, existingCells: LowCodeGridCell[] = []): LowCodeGridCell[] {
  const safeRows = Math.max(Math.trunc(rows), 1);
  const safeCols = Math.max(Math.trunc(cols), 1);
  const cells: LowCodeGridCell[] = [];

  for (let row = 1; row <= safeRows; row += 1) {
    for (let col = 1; col <= safeCols; col += 1) {
      const existingCell = existingCells.find((cell) => cell.row === row && cell.col === col);
      cells.push({
        id: `cell_${row}_${col}`,
        row,
        col,
        children: existingCell?.children ?? []
      });
    }
  }

  return cells;
}

export function removeNodeById(nodes: LowCodeNode[], id: string): LowCodeNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: node.children ? removeNodeById(node.children, id) : undefined,
      gridCells: node.gridCells?.map((cell) => ({
        ...cell,
        children: removeNodeById(cell.children, id)
      }))
    }));
}

function findNodeInGridCells(cells: LowCodeGridCell[], id: string): LowCodeNode | undefined {
  for (const cell of cells) {
    const child = findNodeById(cell.children, id);
    if (child) {
      return child;
    }
  }

  return undefined;
}
