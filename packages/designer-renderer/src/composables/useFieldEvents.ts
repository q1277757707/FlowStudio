import type { LowCodeNode } from '@designer-core/schema';
import { ElMessage } from 'element-plus';
import { runEventActions } from '@designer-event/index';
import type { ActionLog } from '@designer-event/types';
import { useRendererRuntime } from './useRendererRuntime';
import type { RendererMode } from '../types';

export function useFieldEvents(node: LowCodeNode, _mode: RendererMode) {
  const runtime = useRendererRuntime();
  const isPreview = _mode === 'preview';

  async function dispatch(eventName: string, payload?: Record<string, unknown>) {
    const actions = node.events?.[eventName];

    if (!actions?.length) {
      return;
    }

    const ctx = runtime.createEventContext(payload);

    await runEventActions(actions, ctx, {
      eventName,
      componentId: node.id,
      payload,
      continueOnError: true,
      onLog: (log: ActionLog) => {
        runtime.pushEventLog(log);

        if (log.status === 'error' && log.message) {
          ElMessage.error(log.message);
        }
      }
    });
  }

  async function onChange(value: unknown) {
    runtime.setFieldValue(node, value);
    await dispatch('change', { value });
  }

  async function onInput(value: unknown) {
    runtime.setFieldValue(node, value);
    await dispatch('input', { value });
  }

  async function onBlur() {
    await dispatch('blur', { value: runtime.fieldValue(node) });
  }

  async function onFocus() {
    await dispatch('focus', { value: runtime.fieldValue(node) });
  }

  async function onVisibleChange(visible: boolean) {
    await dispatch('visible-change', {
      visible,
      value: runtime.fieldValue(node)
    });
  }

  async function onClear() {
    const empty = Array.isArray(runtime.fieldValue(node)) ? [] : '';
    runtime.setFieldValue(node, empty);
    await dispatch('clear', { value: empty });
  }

  return {
    dispatch,
    onChange,
    onInput,
    onBlur,
    onFocus,
    onVisibleChange,
    onClear
  };
}
