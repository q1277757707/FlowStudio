import type { LowCodeNode } from '@designer-core/schema';
import { useFieldEvents } from './useFieldEvents';
import { useRendererRuntime } from './useRendererRuntime';
import type { RendererMode } from '../types';

export function useFieldBinding(node: LowCodeNode, mode: RendererMode) {
  const runtime = useRendererRuntime();
  const fieldEvents = useFieldEvents(node, mode);
  const isPreview = mode === 'preview';
  const isEdit = mode === 'edit';

  function modelValue(fallback?: unknown) {
    return runtime.fieldValue(node, fallback);
  }

  function onUpdate(value: unknown) {
    if (isPreview) {
      void fieldEvents.onChange(value);
      return;
    }

    runtime.setFieldValue(node, value);
  }

  return {
    runtime,
    node,
    mode,
    isPreview,
    isEdit,
    modelValue,
    onUpdate,
    fieldEvents
  };
}
