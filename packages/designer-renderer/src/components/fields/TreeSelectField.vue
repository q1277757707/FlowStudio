<script setup lang="ts">
import type { LowCodeNode } from '@designer-core/schema';
import FieldFormItem from '../FieldFormItem.vue';
import { useFieldBinding } from '../../composables/useFieldBinding';
import type { RendererMode } from '../../types';

const props = defineProps<{
  mode: RendererMode;
  node: LowCodeNode;
}>();

const { runtime, node, modelValue, onUpdate } = useFieldBinding(props.node, props.mode);
</script>

<template>
  <FieldFormItem :mode="props.mode" :node="node">
    <el-tree-select
      :model-value="modelValue(runtime.selectDefaultValue(node))"
      :data="runtime.readOptions(node, 'data')"
      :placeholder="runtime.readString(node, 'placeholder', '请选择')"
      :multiple="runtime.readBoolean(node, 'multiple')"
      @update:model-value="onUpdate"
    />
  </FieldFormItem>
</template>
