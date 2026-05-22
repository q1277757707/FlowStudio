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

const { runtime, node, isEdit, modelValue, onUpdate } = useFieldBinding(props.node, props.mode);
const { minLength, maxLength, showWordLimit } = useTextLengthLimit(node);
</script>

<template>
  <FieldFormItem :mode="props.mode" :node="node">
    <el-input
      :model-value="modelValue()"
      type="textarea"
      :rows="runtime.readNumber(node, 'rows', 3)"
      :placeholder="runtime.readString(node, 'placeholder', '请输入内容')"
      :minlength="minLength"
      :maxlength="maxLength"
      :show-word-limit="showWordLimit"
      :readonly="isEdit"
      @update:model-value="onUpdate"
    />
  </FieldFormItem>
</template>
