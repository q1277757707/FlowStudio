import { inject, provide, reactive, ref, type InjectionKey, type Ref } from 'vue';
import { ElMessage, ElMessageBox, type ButtonProps } from 'element-plus';
import { createGridCells, findNodeById, type LowCodeGridCell, type LowCodeNode } from '@designer-core/schema';
import { httpRequest, runEventActions } from '@designer-event/index';
import type { RuntimeContext } from '@designer-event/types';
import type { ActionLog } from '@designer-event/types';
import type { DraggableChangeEvent, OptionItem, RendererMode } from '../types';

export interface RendererRuntime {
  activeCellId: Ref<string>;
  formModel: Record<string, unknown>;
  clearActiveCell: () => void;
  dateDefaultValue: (node: LowCodeNode) => unknown;
  ensureChildren: (node: LowCodeNode) => LowCodeNode[];
  ensureGridCells: (node: LowCodeNode) => LowCodeGridCell[];
  fieldValue: (node: LowCodeNode, fallback?: unknown) => unknown;
  gridStyle: (node: LowCodeNode, mode: RendererMode) => Record<string, string>;
  handleButtonClick: (node: LowCodeNode) => void;
  handleNodeClick: (id: string, mode: RendererMode) => void;
  onChildChange: (event: DraggableChangeEvent<LowCodeNode>) => void;
  readBoolean: (node: LowCodeNode, key: string, fallback?: boolean) => boolean;
  readNumber: (node: LowCodeNode, key: string, fallback?: number) => number;
  readOptions: (node: LowCodeNode, key?: string) => OptionItem[];
  readString: (node: LowCodeNode, key: string, fallback?: string) => string;
  selectDefaultValue: (node: LowCodeNode) => unknown;
  setActiveCell: (cellId: string) => void;
  setFieldValue: (node: LowCodeNode, value: unknown) => void;
  buttonType: (node: LowCodeNode) => ButtonProps['type'];
  createEventContext: (payload?: Record<string, unknown>) => RuntimeContext;
  dispatchNodeEvent: (
    node: LowCodeNode,
    eventName: string,
    payload?: Record<string, unknown>
  ) => Promise<void>;
  eventLogs: Ref<ActionLog[]>;
  pushEventLog: (log: ActionLog) => void;
  clearEventLogs: () => void;
  isComponentVisible: (componentId: string, mode: RendererMode) => boolean;
  setComponentVisible: (componentId: string, visible: boolean) => void;
}

const rendererRuntimeKey: InjectionKey<RendererRuntime> = Symbol('rendererRuntime');

export interface RendererRuntimeOptions {
  selectNode: (id: string) => void;
  onSchemaChange?: () => void;
  getRootNodes?: () => LowCodeNode[];
}

export function provideRendererRuntime(options: RendererRuntimeOptions): RendererRuntime {
  const { selectNode, onSchemaChange, getRootNodes } = options;
  const activeCellId = ref('');
  const runtimeValues = reactive<Record<string, unknown>>({});
  const pageVariables = reactive<Record<string, unknown>>({});
  const componentVisibility = reactive<Record<string, boolean>>({});
  const eventLogs = ref<ActionLog[]>([]);

  function ensureChildren(node: LowCodeNode): LowCodeNode[] {
    node.children ??= [];
    return node.children;
  }

  function readString(node: LowCodeNode, key: string, fallback = ''): string {
    const value = node.props[key];
    return typeof value === 'string' ? value : fallback;
  }

  function readNumber(node: LowCodeNode, key: string, fallback = 0): number {
    const value = node.props[key];
    return typeof value === 'number' ? value : fallback;
  }

  function readBoolean(node: LowCodeNode, key: string, fallback = false): boolean {
    const value = node.props[key];
    return typeof value === 'boolean' ? value : fallback;
  }

  function readOptions(node: LowCodeNode, key = 'options'): OptionItem[] {
    const value = node.props[key];
    return Array.isArray(value) ? (value as OptionItem[]) : [];
  }

  function ensureGridCells(node: LowCodeNode): LowCodeGridCell[] {
    const rows = readNumber(node, 'rows', 2);
    const cols = readNumber(node, 'cols', 2);
    node.gridCells = createGridCells(rows, cols, node.gridCells);
    return node.gridCells;
  }

  function runtimeDefault(value: unknown) {
    return Array.isArray(value) ? [...value] : value;
  }

  function fieldValue(node: LowCodeNode, fallback: unknown = '') {
    if (!Object.hasOwn(runtimeValues, node.id)) {
      runtimeValues[node.id] = runtimeDefault(fallback);
    }

    return runtimeValues[node.id];
  }

  function setFieldValue(node: LowCodeNode, value: unknown) {
    runtimeValues[node.id] = value;
  }

  function selectDefaultValue(node: LowCodeNode) {
    if (readBoolean(node, 'multiple')) {
      const value = node.props.defaultValue;
      return Array.isArray(value) ? [...value] : [];
    }

    const value = node.props.defaultValue;

    if (typeof value === 'string' && value) {
      return value;
    }

    if (typeof value === 'number') {
      return value;
    }

    return '';
  }

  function isComponentVisible(componentId: string, mode: RendererMode) {
    if (mode === 'edit') {
      return true;
    }

    return componentVisibility[componentId] !== false;
  }

  function setComponentVisible(componentId: string, visible: boolean) {
    componentVisibility[componentId] = visible;

    const node = findNodeById(getRootNodes?.() ?? [], componentId);

    if (node?.events?.['visible-change']?.length) {
      void dispatchNodeEvent(node, 'visible-change', {
        visible,
        value: runtimeValues[node.id]
      });
    }
  }

  function dateDefaultValue(node: LowCodeNode) {
    return readString(node, 'dateType', 'date') === 'daterange' ? [] : '';
  }

  function buttonType(node: LowCodeNode): ButtonProps['type'] {
    const value = readString(node, 'type');
    return value as ButtonProps['type'];
  }

  function gridStyle(node: LowCodeNode, mode: RendererMode) {
    const rows = Math.max(readNumber(node, 'rows', 2), 1);
    const cols = Math.max(readNumber(node, 'cols', 2), 1);

    if (mode === 'preview') {
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, auto)`,
        gap: '0',
        alignContent: 'start',
        alignItems: 'start'
      };
    }

    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(120px, 1fr))`,
      gridTemplateRows: `repeat(${rows}, minmax(120px, auto))`,
      gap: '12px',
      alignContent: 'stretch',
      alignItems: 'stretch'
    };
  }

  function onChildChange(event: DraggableChangeEvent<LowCodeNode>) {
    activeCellId.value = '';

    if (event.added) {
      selectNode(event.added.element.id);
    }

    onSchemaChange?.();
  }

  function setActiveCell(cellId: string) {
    activeCellId.value = cellId;
  }

  function clearActiveCell() {
    activeCellId.value = '';
  }

  function handleNodeClick(id: string, mode: RendererMode) {
    if (mode === 'edit') {
      selectNode(id);
    }
  }

  function pushEventLog(log: ActionLog) {
    eventLogs.value = [...eventLogs.value, log].slice(-100);
  }

  function clearEventLogs() {
    eventLogs.value = [];
  }

  function createEventContext(payload?: Record<string, unknown>): RuntimeContext {
    return {
      form: runtimeValues,
      variables: pageVariables,
      pageState: pageVariables,
      components: {},
      event: payload ?? {},
      message: (options: string | { message?: string; type?: string; content?: string }) => {
        if (typeof options === 'string') {
          ElMessage.info(options);
          return;
        }

        ElMessage({
          type: (options.type as 'success' | 'warning' | 'info' | 'error') ?? 'info',
          message: options.message ?? options.content ?? ''
        });
      },
      dialog: async (options) => {
        if (options.type === 'confirm') {
          try {
            await ElMessageBox.confirm(options.message ?? '', options.title ?? '确认', {
              type: 'warning'
            });
            return true;
          } catch {
            return false;
          }
        }

        await ElMessageBox.alert(options.message ?? '', options.title ?? '提示');
        return true;
      },
      router: {
        push: (path: string) => {
          window.location.assign(path);
        }
      },
      setComponentVisible,
      api: {
        request: httpRequest
      }
    };
  }

  async function dispatchNodeEvent(
    node: LowCodeNode,
    eventName: string,
    payload?: Record<string, unknown>
  ) {
    const actions = node.events?.[eventName];

    if (!actions?.length) {
      return;
    }

    try {
      await runEventActions(actions, createEventContext(payload), {
        eventName,
        componentId: node.id,
        payload,
        continueOnError: true,
        onLog: pushEventLog
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '事件执行失败';
      ElMessage.error(message);
    }
  }

  async function handleButtonClick(node: LowCodeNode) {
    const actions = node.events?.click;

    if (actions?.length) {
      await dispatchNodeEvent(node, 'click');
      return;
    }

    ElMessage.info('按钮已点击');
  }

  const runtime: RendererRuntime = {
    activeCellId,
    formModel: runtimeValues,
    buttonType,
    clearActiveCell,
    dateDefaultValue,
    ensureChildren,
    ensureGridCells,
    fieldValue,
    gridStyle,
    handleButtonClick,
    handleNodeClick,
    onChildChange,
    readBoolean,
    readNumber,
    readOptions,
    readString,
    selectDefaultValue,
    setActiveCell,
    setFieldValue,
    createEventContext,
    dispatchNodeEvent,
    eventLogs,
    pushEventLog,
    clearEventLogs,
    isComponentVisible,
    setComponentVisible
  };

  provide(rendererRuntimeKey, runtime);
  return runtime;
}

export function useRendererRuntime(): RendererRuntime {
  const runtime = inject(rendererRuntimeKey);

  if (!runtime) {
    throw new Error('Renderer runtime is not provided.');
  }

  return runtime;
}
