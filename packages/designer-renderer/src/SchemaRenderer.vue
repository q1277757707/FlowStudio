<script setup lang="ts">
import type { EventAction, LowCodeNode } from '@designer-core/schema';
import { provideRendererRuntime } from './composables/useRendererRuntime';
import RendererList from './components/RendererList.vue';
import type { RendererMode } from './types';

defineOptions({
  name: 'SchemaRenderer'
});

const props = withDefaults(
  defineProps<{
    nodes: LowCodeNode[];
    mode?: RendererMode;
    selectedId?: string;
    onSchemaChange?: () => void;
    pageEvents?: Record<string, EventAction[]>;
  }>(),
  {
    mode: 'edit',
    selectedId: ''
  }
);

const emit = defineEmits<{
  selectNode: [id: string];
}>();

provideRendererRuntime({
  selectNode: (id) => emit('selectNode', id),
  onSchemaChange: props.mode === 'edit' ? props.onSchemaChange : undefined,
  getRootNodes: () => props.nodes
});
</script>

<template>
  <RendererList
    :nodes="nodes"
    :mode="mode"
    :selected-id="selectedId"
    :page-events="pageEvents"
  />
</template>
