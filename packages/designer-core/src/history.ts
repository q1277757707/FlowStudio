import { cloneSchema, type PageSchema } from './schema';

export interface DesignerSnapshot {
  schema: PageSchema;
  selectedId: string;
}

export function cloneDesignerSnapshot(snapshot: DesignerSnapshot): DesignerSnapshot {
  return {
    schema: cloneSchema(snapshot.schema),
    selectedId: snapshot.selectedId
  };
}

function snapshotEquals(a: DesignerSnapshot, b: DesignerSnapshot): boolean {
  return JSON.stringify(a.schema) === JSON.stringify(b.schema) && a.selectedId === b.selectedId;
}

export function createDesignerHistory(initial: DesignerSnapshot, maxSize = 50) {
  const snapshots: DesignerSnapshot[] = [cloneDesignerSnapshot(initial)];
  let index = 0;
  let isRestoring = false;

  function canUndo() {
    return index > 0;
  }

  function canRedo() {
    return index < snapshots.length - 1;
  }

  function commit(state: DesignerSnapshot) {
    if (isRestoring) {
      return;
    }

    const next = cloneDesignerSnapshot(state);

    if (snapshotEquals(snapshots[index], next)) {
      return;
    }

    snapshots.splice(index + 1);
    snapshots.push(next);
    index = snapshots.length - 1;

    while (snapshots.length > maxSize) {
      snapshots.shift();
      index -= 1;
    }
  }

  function undo(): DesignerSnapshot | null {
    if (!canUndo()) {
      return null;
    }

    index -= 1;
    isRestoring = true;
    const snapshot = cloneDesignerSnapshot(snapshots[index]);
    isRestoring = false;
    return snapshot;
  }

  function redo(): DesignerSnapshot | null {
    if (!canRedo()) {
      return null;
    }

    index += 1;
    isRestoring = true;
    const snapshot = cloneDesignerSnapshot(snapshots[index]);
    isRestoring = false;
    return snapshot;
  }

  function reset(state: DesignerSnapshot) {
    snapshots.splice(0, snapshots.length, cloneDesignerSnapshot(state));
    index = 0;
    isRestoring = false;
  }

  return {
    canUndo,
    canRedo,
    commit,
    undo,
    redo,
    reset
  };
}
