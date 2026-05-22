<script setup lang="ts">
import type { LowCodeNode } from '@designer-core/schema';
import { useFieldBinding } from '../../composables/useFieldBinding';
import type { RendererMode } from '../../types';

const props = defineProps<{
  mode: RendererMode;
  node: LowCodeNode;
}>();

const { runtime, node } = useFieldBinding(props.node, props.mode);
</script>

<template>
  <span class="render-text">{{ runtime.readString(node, 'text', '普通文本') }}</span>
</template>
