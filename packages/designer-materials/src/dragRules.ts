import type { ComponentType, LowCodeNode } from '@designer-core/schema';

export type DropZoneKind = 'canvas' | 'form' | 'container';

const FORM_FIELD_TYPES = new Set<ComponentType>([
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

const DROP_ZONE_PRIORITY: DropZoneKind[] = ['form', 'container', 'canvas'];

export function isFormFieldType(type: ComponentType): boolean {
  return FORM_FIELD_TYPES.has(type);
}

export function isLowCodeNode(element: unknown): element is LowCodeNode {
  return (
    typeof element === 'object' &&
    element !== null &&
    'id' in element &&
    'type' in element &&
    'props' in element
  );
}

export function isMaterialMeta(element: unknown): element is { type: ComponentType } {
  return (
    typeof element === 'object' &&
    element !== null &&
    'type' in element &&
    'name' in element &&
    'category' in element &&
    !('id' in element)
  );
}

export function getDraggedComponentType(element: unknown): ComponentType | undefined {
  if (isLowCodeNode(element)) {
    return element.type;
  }

  if (isMaterialMeta(element)) {
    return element.type;
  }

  return undefined;
}

export function getDropZoneFromElement(el: HTMLElement | null | undefined): DropZoneKind | undefined {
  const zone = el?.closest<HTMLElement>('[data-drop-zone]')?.dataset.dropZone;

  if (zone === 'canvas' || zone === 'form' || zone === 'container') {
    return zone;
  }

  return undefined;
}

/** 从节点向上收集投放区，form 优先于 container / canvas（表单内子区域也适用表单规则） */
export function collectDropZonesFromAncestors(el: HTMLElement | null | undefined): Set<DropZoneKind> {
  const found = new Set<DropZoneKind>();
  let node = el;

  while (node) {
    const zone = node.dataset?.dropZone;
    if (zone === 'canvas' || zone === 'form' || zone === 'container') {
      found.add(zone);
    }
    node = node.parentElement;
  }

  return found;
}

export function pickEffectiveDropZone(zones: Set<DropZoneKind>, fallback: DropZoneKind): DropZoneKind {
  for (const zone of DROP_ZONE_PRIORITY) {
    if (zones.has(zone)) {
      return zone;
    }
  }

  return fallback;
}

export function resolveEffectiveDropZone(
  anchorEl: HTMLElement | null | undefined,
  fallback: DropZoneKind
): DropZoneKind {
  return pickEffectiveDropZone(collectDropZonesFromAncestors(anchorEl), fallback);
}

export function resolveEffectiveDropZoneAtPoint(clientX: number, clientY: number): DropZoneKind | undefined {
  const found = new Set<DropZoneKind>();

  for (const element of document.elementsFromPoint(clientX, clientY)) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    if (
      element.classList.contains('sortable-ghost') ||
      element.classList.contains('sortable-drag') ||
      element.classList.contains('material-card')
    ) {
      continue;
    }

    collectDropZonesFromAncestors(element).forEach((zone) => found.add(zone));
  }

  if (!found.size) {
    return undefined;
  }

  return pickEffectiveDropZone(found, 'canvas');
}

export function schemaHasForm(nodes: LowCodeNode[]): boolean {
  for (const node of nodes) {
    if (node.type === 'Form') {
      return true;
    }

    if (node.children?.length && schemaHasForm(node.children)) {
      return true;
    }

    if (node.gridCells?.some((cell) => schemaHasForm(cell.children))) {
      return true;
    }
  }

  return false;
}

export function canDropInZone(zone: DropZoneKind, type: ComponentType): boolean {
  switch (zone) {
    case 'form':
      if (type === 'Form') {
        return false;
      }

      return (
        isFormFieldType(type) || type === 'Button' || type === 'Text' || type === 'Container'
      );

    case 'canvas':
    case 'container':
      return !isFormFieldType(type);

    default:
      return false;
  }
}

/** 画布：页面尚无表单时，必须先拖入「表单」 */
export function canDropOnCanvas(type: ComponentType, rootNodes: LowCodeNode[]): boolean {
  if (isFormFieldType(type)) {
    return false;
  }

  if (!schemaHasForm(rootNodes) && type !== 'Form') {
    return false;
  }

  return true;
}

type DragElWithVm = HTMLElement & { _underlying_vm_?: unknown };

/** 从拖拽 DOM 或 vuedraggable 克隆数据解析组件类型 */
export function resolveDraggedType(dragEl: HTMLElement, fallbackElement?: unknown): ComponentType | undefined {
  const vm = (dragEl as DragElWithVm)._underlying_vm_;
  const fromVm = getDraggedComponentType(vm);
  if (fromVm) {
    return fromVm;
  }

  const fromFallback = getDraggedComponentType(fallbackElement);
  if (fromFallback) {
    return fromFallback;
  }

  const selfType = dragEl.dataset.componentType;
  if (selfType) {
    return selfType as ComponentType;
  }

  const nestedType = dragEl.querySelector<HTMLElement>('[data-component-type]')?.dataset.componentType;
  if (nestedType) {
    return nestedType as ComponentType;
  }

  return undefined;
}

export function canPutInZone(
  targetZone: DropZoneKind,
  dragEl: HTMLElement,
  options?: {
    toEl?: HTMLElement | null;
    fallbackElement?: unknown;
    sameListReorder?: boolean;
    rootNodes?: LowCodeNode[];
  }
): boolean {
  const zone = options?.toEl
    ? resolveEffectiveDropZone(options.toEl, targetZone)
    : targetZone;
  const type = resolveDraggedType(dragEl, options?.fallbackElement);

  if (!type) {
    return Boolean(options?.sameListReorder);
  }

  if (zone === 'canvas' && options?.rootNodes) {
    return canDropOnCanvas(type, options.rootNodes);
  }

  return canDropInZone(zone, type);
}

export function createDragGroup(targetZone: DropZoneKind, options?: { getRootNodes?: () => LowCodeNode[] }) {
  return {
    name: 'designer-components',
    pull: true,
    put(
      to: { el?: HTMLElement },
      from: { el?: HTMLElement },
      dragEl: HTMLElement
    ) {
      const sameList = Boolean(to.el && from.el && to.el === from.el);

      return canPutInZone(targetZone, dragEl, {
        toEl: to.el,
        sameListReorder: sameList,
        rootNodes: targetZone === 'canvas' ? options?.getRootNodes?.() : undefined
      });
    }
  };
}

/** 是否允许作为表单的直接子节点 */
export function isAllowedFormChild(type: ComponentType): boolean {
  return canDropInZone('form', type);
}
