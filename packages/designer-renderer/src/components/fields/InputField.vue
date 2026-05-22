<script setup lang="ts">
import type { LowCodeNode } from '@designer-core/schema';
import FieldFormItem from '../FieldFormItem.vue';
import { useFieldBinding } from '../../composables/useFieldBinding';
import { useTextLengthLimit } from '../../composables/useTextLengthLimit';
import type { RendererMode } from '../../types';

const props = defineProps<{
  mode: RendererMode;
  node: LowCodeNode;
}>();

const { runtime, node, isEdit, isPreview, modelValue, onUpdate, fieldEvents } = useFieldBinding(
  props.node,
  props.mode
);
const { minLength, maxLength, showWordLimit } = useTextLengthLimit(node);
</script>

<template>
  <FieldFormItem :mode="props.mode" :node="node">
    <el-input
      :model-value="modelValue()"
      :placeholder="runtime.readString(node, 'placeholder', '请输入')"
      :minlength="minLength"
      :maxlength="maxLength"
      :show-word-limit="showWordLimit"
      :readonly="isEdit"
      @update:model-value="onUpdate"
      @blur="isPreview && fieldEvents.onBlur()"
      @focus="isPreview && fieldEvents.onFocus()"
    />
  </FieldFormItem>
</template>
