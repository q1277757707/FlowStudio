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
    <el-rate
      :model-value="modelValue(0) as number"
      :max="runtime.readNumber(node, 'max', 5)"
      @update:model-value="onUpdate"
    />
  </FieldFormItem>
</template>
