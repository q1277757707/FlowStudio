import { computed } from 'vue';
import type { LowCodeNode } from '@designer-core/schema';
import { useRendererRuntime } from './useRendererRuntime';

export function useTextLengthLimit(node: LowCodeNode) {
  const runtime = useRendererRuntime();

  const minLength = computed(() => {
    const value = runtime.readNumber(node, 'minLength', 0);
    return value > 0 ? value : undefined;
  });

  const maxLength = computed(() => {
    const value = runtime.readNumber(node, 'maxLength', 0);
    return value > 0 ? value : undefined;
  });

  const showWordLimit = computed(() => maxLength.value !== undefined);

  return {
    minLength,
    maxLength,
    showWordLimit
  };
}
