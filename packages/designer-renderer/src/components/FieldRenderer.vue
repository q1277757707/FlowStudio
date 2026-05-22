<script setup lang="ts">
import { computed } from 'vue';
import type { LowCodeNode } from '@designer-core/schema';
import { getFieldRenderer } from './fields';
import type { RendererMode } from '../types';

const props = defineProps<{
  mode: RendererMode;
  node: LowCodeNode;
}>();

const fieldComponent = computed(() => getFieldRenderer(props.node.type));
</script>

<template>
  <component :is="fieldComponent" v-if="fieldComponent" :mode="mode" :node="node" />
</template>
