import type { LowCodeNode } from '@designer-core/schema';
import {
  canDropInZone,
  canDropOnCanvas,
  canPutInZone,
  createDragGroup,
  resolveEffectiveDropZoneAtPoint,
  resolveDraggedType,
  type DropZoneKind
} from '@designer-materials/dragRules';

interface DragMoveEvent {
  to?: HTMLElement;
  from?: HTMLElement;
  item?: HTMLElement;
  draggedContext?: {
    element?: unknown;
  };
  originalEvent?: MouseEvent;
}

interface UseDragMoveOptions {
  getRootNodes?: () => LowCodeNode[];
}

export function useDragMove(targetZone: DropZoneKind, options?: UseDragMoveOptions) {
  const dragGroup = createDragGroup(targetZone, { getRootNodes: options?.getRootNodes });

  function checkMove(event: DragMoveEvent) {
    const dragEl = (event.item ?? event.to) as HTMLElement | undefined;

    if (!dragEl) {
      return false;
    }

    const type = resolveDraggedType(dragEl, event.draggedContext?.element);
    const pointer = event.originalEvent;
    const sameList = Boolean(event.from && event.to && event.from === event.to);

    if (pointer && type) {
      const zone = resolveEffectiveDropZoneAtPoint(pointer.clientX, pointer.clientY);

      if (!zone) {
        return false;
      }

      if (zone === 'canvas' && options?.getRootNodes) {
        return canDropOnCanvas(type, options.getRootNodes());
      }

      return canDropInZone(zone, type);
    }

    return canPutInZone(targetZone, dragEl, {
      toEl: event.to,
      fallbackElement: event.draggedContext?.element,
      sameListReorder: sameList,
      rootNodes: targetZone === 'canvas' ? options?.getRootNodes?.() : undefined
    });
  }

  return {
    checkMove,
    dragGroup
  };
}
