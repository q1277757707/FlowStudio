import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import type { LowCodeNode } from '@designer-core/schema';
import { fetchOptionsFromApi } from '../utils/fetchOptionsFromApi';
import type { OptionItem, RendererMode } from '../types';
import { useRendererRuntime } from './useRendererRuntime';

export function useFieldOptions(
  node: MaybeRefOrGetter<LowCodeNode>,
  mode: MaybeRefOrGetter<RendererMode>,
  optionsKey: 'options' | 'data' = 'options'
) {
  const runtime = useRendererRuntime();
  const loading = ref(false);
  const remoteOptions = ref<OptionItem[]>([]);

  const options = computed(() => {
    const current = toValue(node);

    if (runtime.readString(current, 'optionsSource', 'static') === 'api') {
      return remoteOptions.value;
    }

    return runtime.readOptions(current, optionsKey);
  });

  async function loadOptions() {
    const current = toValue(node);

    if (runtime.readString(current, 'optionsSource', 'static') !== 'api') {
      remoteOptions.value = [];
      loading.value = false;
      return;
    }

    loading.value = true;

    try {
      remoteOptions.value = await fetchOptionsFromApi(current, runtime.createEventContext());
    } catch {
      remoteOptions.value = [];
    } finally {
      loading.value = false;
    }
  }

  watch(
    () => {
      const current = toValue(node);
      return [
        toValue(mode),
        current.props.optionsSource,
        current.props.requestUrl,
        current.props.requestMethod,
        current.props.requestParams,
        current.props.dataPath,
        current.props.labelField,
        current.props.valueField,
        current.props.childrenField,
        current.props[optionsKey]
      ];
    },
    () => {
      void loadOptions();
    },
    { immediate: true, deep: true }
  );

  return { options, loading };
}
