import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { createDesignerHistory } from '@designer-core/history';
import { createActionId } from '@designer-core/id';
import {
  cloneSchema,
  createInitialSchema,
  findNodeById,
  removeNodeById,
  type EventAction,
  type EventActionType,
  type LowCodeNode,
  type PageSchema
} from '@designer-core/schema';
import { getActionMeta } from '../constants/eventActions';

const HISTORY_DEBOUNCE_MS = 400;

export const useDesignerStore = defineStore('designer', () => {
  const schema = ref<PageSchema>(createInitialSchema());
  const selectedId = ref<string>('');
  const canUndo = ref(false);
  const canRedo = ref(false);

  const history = createDesignerHistory({
    schema: cloneSchema(schema.value),
    selectedId: selectedId.value
  });

  let commitTimer: ReturnType<typeof setTimeout> | undefined;
  let isApplyingHistory = false;

  function clearCommitTimer() {
    if (commitTimer) {
      clearTimeout(commitTimer);
      commitTimer = undefined;
    }
  }

  function syncHistoryFlags() {
    canUndo.value = history.canUndo();
    canRedo.value = history.canRedo();
  }

  function createSnapshot() {
    return {
      schema: cloneSchema(schema.value),
      selectedId: selectedId.value
    };
  }

  function applySnapshot(snapshot: ReturnType<typeof createSnapshot>) {
    clearCommitTimer();
    isApplyingHistory = true;
    schema.value = cloneSchema(snapshot.schema);
    selectedId.value = snapshot.selectedId;
    isApplyingHistory = false;
  }

  function commitHistory() {
    if (isApplyingHistory) {
      return;
    }

    clearCommitTimer();

    history.commit(createSnapshot());
    syncHistoryFlags();
  }

  function scheduleCommitHistory() {
    clearCommitTimer();

    commitTimer = setTimeout(() => {
      commitHistory();
    }, HISTORY_DEBOUNCE_MS);
  }

  function undo() {
    const snapshot = history.undo();

    if (!snapshot) {
      return;
    }

    applySnapshot(snapshot);
    syncHistoryFlags();
  }

  function redo() {
    const snapshot = history.redo();

    if (!snapshot) {
      return;
    }

    applySnapshot(snapshot);
    syncHistoryFlags();
  }

  const selectedNode = computed(() => findNodeById(schema.value.components, selectedId.value));

  const schemaJson = computed(() => JSON.stringify(schema.value, null, 2));

  /** 仅同步画布节点，历史记录在 Draggable @change 中提交 */
  function setRootNodes(nodes: LowCodeNode[]) {
    schema.value.components = nodes;
  }

  function selectNode(id: string) {
    selectedId.value = id;
  }

  function updateSelectedProp(field: string, value: unknown) {
    if (!selectedNode.value) {
      return;
    }

    selectedNode.value.props[field] = value;
    scheduleCommitHistory();
  }

  function removeSelectedNode() {
    if (!selectedId.value) {
      return;
    }

    schema.value.components = removeNodeById(schema.value.components, selectedId.value);
    selectedId.value = '';
    commitHistory();
  }

  function resetSchema() {
    schema.value = createInitialSchema();
    selectedId.value = '';
    history.reset(createSnapshot());
    syncHistoryFlags();
  }

  function exportSchema(): PageSchema {
    return cloneSchema(schema.value);
  }

  function ensureNodeEvents() {
    if (!selectedNode.value) {
      return;
    }

    selectedNode.value.events ??= {};
  }

  function getEventActions(eventName: string): EventAction[] {
    return selectedNode.value?.events?.[eventName] ?? [];
  }

  function setEventActions(eventName: string, actions: EventAction[]) {
    if (!selectedNode.value) {
      return;
    }

    ensureNodeEvents();
    selectedNode.value.events![eventName] = actions;
    commitHistory();
  }

  function addEventAction(eventName: string, type: EventActionType) {
    const meta = getActionMeta(type);

    if (!meta || !selectedNode.value) {
      return;
    }

    ensureNodeEvents();
    const list = getEventActions(eventName);

    list.push({
      id: createActionId(),
      action: type,
      type,
      config: JSON.parse(JSON.stringify(meta.defaultConfig))
    });

    selectedNode.value.events![eventName] = list;
    commitHistory();
  }

  function removeEventAction(eventName: string, actionId: string) {
    if (!selectedNode.value?.events?.[eventName]) {
      return;
    }

    selectedNode.value.events[eventName] = getEventActions(eventName).filter(
      (item) => item.id !== actionId
    );
    commitHistory();
  }

  function updateEventConfig(
    eventName: string,
    actionId: string,
    config: Record<string, unknown>
  ) {
    const target = getEventActions(eventName).find((item) => item.id === actionId);

    if (!target) {
      return;
    }

    target.config = config;
    scheduleCommitHistory();
  }

  syncHistoryFlags();

  return {
    schema,
    selectedId,
    selectedNode,
    schemaJson,
    canUndo,
    canRedo,
    setRootNodes,
    selectNode,
    updateSelectedProp,
    removeSelectedNode,
    resetSchema,
    exportSchema,
    commitHistory,
    undo,
    redo,
    getEventActions,
    setEventActions,
    addEventAction,
    removeEventAction,
    updateEventConfig
  };
});
