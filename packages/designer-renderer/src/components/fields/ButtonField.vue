<script setup lang="ts">
import type { LowCodeNode } from '@designer-core/schema';
import { useFieldBinding } from '../../composables/useFieldBinding';
import type { RendererMode } from '../../types';

const props = defineProps<{
  mode: RendererMode;
  node: LowCodeNode;
}>();

const { runtime, node, isPreview } = useFieldBinding(props.node, props.mode);
</script>

<template>
  <el-button :type="runtime.buttonType(node)" @click="isPreview && runtime.handleButtonClick(node)">
    {{ runtime.readString(node, 'text', '按钮') }}
  </el-button>
</template>
