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

const { runtime, node, isPreview, modelValue, onUpdate, fieldEvents } = useFieldBinding(
  props.node,
  props.mode
);

const { options, loading } = useFieldOptions(() => props.node, () => props.mode);
</script>

<template>
  <FieldFormItem :mode="props.mode" :node="node">
    <el-select
      :model-value="modelValue(runtime.selectDefaultValue(node))"
      :placeholder="runtime.readString(node, 'placeholder', '请选择')"
      :multiple="runtime.readBoolean(node, 'multiple')"
      :loading="loading"
      @update:model-value="onUpdate"
      @visible-change="isPreview && fieldEvents.onVisibleChange($event)"
      @clear="isPreview && fieldEvents.onClear()"
    >
      <el-option
        v-for="option in options"
        :key="String(option.value)"
        :label="option.label"
        :value="option.value"
      />
    </el-select>
  </FieldFormItem>
</template>
