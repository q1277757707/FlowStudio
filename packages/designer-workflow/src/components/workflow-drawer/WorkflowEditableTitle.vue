<script setup lang="ts">
import { ref, watch } from 'vue';
import { EditPen } from '@element-plus/icons-vue';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const editing = ref(false);
const draft = ref('');

watch(
  () => props.modelValue,
  (value) => {
    if (!editing.value) draft.value = value;
  },
  { immediate: true }
);

function startEdit() {
  draft.value = props.modelValue;
  editing.value = true;
}

function commit() {
  editing.value = false;
  emit('update:modelValue', draft.value.trim() || props.modelValue);
}
</script>

<template>
  <div class="wf-editable-title">
    <el-input
      v-if="editing"
      v-model="draft"
      size="small"
      maxlength="16"
      @blur="commit"
      @keyup.enter="commit"
    />
    <template v-else>
      <span class="wf-editable-title__text">{{ modelValue }}</span>
      <el-button :icon="EditPen" text class="wf-editable-title__edit" @click="startEdit" />
    </template>
  </div>
</template>
