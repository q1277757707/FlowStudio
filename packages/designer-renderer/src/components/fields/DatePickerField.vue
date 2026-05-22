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
    <el-date-picker
      :model-value="modelValue(runtime.dateDefaultValue(node))"
      :type="runtime.readString(node, 'dateType', 'date')"
      :placeholder="runtime.readString(node, 'placeholder', '请选择')"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      @update:model-value="onUpdate"
    />
  </FieldFormItem>
</template>
