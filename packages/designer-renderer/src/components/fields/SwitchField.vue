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
    <el-switch
      :model-value="modelValue(false) as boolean"
      :active-text="runtime.readString(node, 'activeText', '开')"
      :inactive-text="runtime.readString(node, 'inactiveText', '关')"
      @update:model-value="onUpdate"
    />
  </FieldFormItem>
</template>
