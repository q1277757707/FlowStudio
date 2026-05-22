<script setup lang="ts">
import type { LowCodeNode } from '@designer-core/schema';
import FieldFormItem from '../FieldFormItem.vue';
import { useFieldBinding } from '../../composables/useFieldBinding';
import type { RendererMode } from '../../types';

const props = defineProps<{
  mode: RendererMode;
  node: LowCodeNode;
}>();

const { runtime, node } = useFieldBinding(props.node, props.mode);
</script>

<template>
  <FieldFormItem :mode="props.mode" :node="node">
    <el-upload action="#" :auto-upload="false" :multiple="runtime.readBoolean(node, 'multiple')">
      <el-button type="primary">{{ runtime.readString(node, 'buttonText', '点击上传') }}</el-button>
      <template #tip>
        <div class="upload-tip">{{ runtime.readString(node, 'tip', '支持常见文件格式') }}</div>
      </template>
    </el-upload>
  </FieldFormItem>
</template>
