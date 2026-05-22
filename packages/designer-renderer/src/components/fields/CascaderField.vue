<script setup lang="ts">
import type { LowCodeNode } from '@designer-core/schema';
import FieldFormItem from '../FieldFormItem.vue';
import { useFieldBinding } from '../../composables/useFieldBinding';
import { useFieldOptions } from '../../composables/useFieldOptions';
import type { RendererMode } from '../../types';

const props = defineProps<{
  mode: RendererMode;
  node: LowCodeNode;
}>();

const { runtime, node, modelValue, onUpdate } = useFieldBinding(props.node, props.mode);
const { options } = useFieldOptions(() => props.node, () => props.mode);
</script>

<template>
  <FieldFormItem :mode="props.mode" :node="node">
    <el-cascader
      :model-value="modelValue([])"
      :options="options"
      :placeholder="runtime.readString(node, 'placeholder', '请选择')"
      @update:model-value="onUpdate"
    />
  </FieldFormItem>
</template>
