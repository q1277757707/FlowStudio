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

const { node, modelValue, onUpdate } = useFieldBinding(props.node, props.mode);
const { options } = useFieldOptions(() => props.node, () => props.mode);
</script>

<template>
  <FieldFormItem :mode="props.mode" :node="node">
    <el-radio-group :model-value="modelValue('')" @update:model-value="onUpdate">
      <el-radio v-for="option in options" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </el-radio>
    </el-radio-group>
  </FieldFormItem>
</template>
