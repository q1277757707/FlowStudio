import type { LowCodeNode } from '@designer-core/schema';
import { runEventActions } from '@designer-event/index';
import { useRendererRuntime } from './useRendererRuntime';
import type { RendererMode } from '../types';

export function useFieldEvents(node: LowCodeNode, mode: RendererMode) {
  const runtime = useRendererRuntime();
  const isPreview = mode === 'preview';

  async function dispatch(eventName: string, payload?: Record<string, unknown>) {
    if (!isPreview) {
      return;
    }

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
      onLog: (log) => runtime.pushEventLog(log)
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
