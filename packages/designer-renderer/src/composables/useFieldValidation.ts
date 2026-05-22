import { computed } from 'vue';
import type { LowCodeNode } from '@designer-core/schema';
import { buildFieldRules, readValidateType } from '@designer-core/validation';
import { useRendererRuntime } from './useRendererRuntime';
import type { RendererMode } from '../types';

export function useFieldValidation(node: LowCodeNode, mode: RendererMode) {
  const runtime = useRendererRuntime();
  const isPreview = mode === 'preview';

  const label = computed(() => runtime.readString(node, 'label', '字段'));
  const required = computed(() => runtime.readBoolean(node, 'required'));
  const fieldProp = computed(() => node.id);

  const rules = computed(() =>
    buildFieldRules({
      required: required.value,
      validateType: readValidateType(node.props),
      customPattern: runtime.readString(node, 'customPattern'),
      label: label.value,
      componentType: node.type,
      minLength: runtime.readNumber(node, 'minLength', 0),
      maxLength: runtime.readNumber(node, 'maxLength', 0)
    })
  );

  return {
    label,
    required,
    fieldProp,
    rules,
    isPreview
  };
}
