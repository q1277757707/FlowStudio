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
    <el-checkbox-group :model-value="modelValue([])" @update:model-value="onUpdate">
      <el-checkbox v-for="option in runtime.readOptions(node)" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </el-checkbox>
    </el-checkbox-group>
  </FieldFormItem>
</template>
