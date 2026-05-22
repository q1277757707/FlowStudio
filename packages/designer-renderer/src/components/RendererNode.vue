<script setup lang="ts">
import type { LowCodeNode } from '@designer-core/schema';
import { useRendererRuntime } from '../composables/useRendererRuntime';
import type { RendererMode } from '../types';
import ContainerRenderer from './ContainerRenderer.vue';
import FieldRenderer from './FieldRenderer.vue';
import FormRenderer from './FormRenderer.vue';

const props = defineProps<{
  mode: RendererMode;
  node: LowCodeNode;
  selectedId: string;
}>();

const runtime = useRendererRuntime();
</script>

<template>
  <div
    v-show="runtime.isComponentVisible(node.id, mode)"
    class="schema-node"
    :data-component-type="node.type"
    :class="{
      'is-selected': mode === 'edit' && node.id === selectedId,
      'is-edit': mode === 'edit'
    }"
    @click.stop="runtime.handleNodeClick(node.id, props.mode)"
  >
    <ContainerRenderer
      v-if="node.type === 'Container'"
      :mode="mode"
      :node="node"
      :selected-id="selectedId"
    />

    <FormRenderer
      v-else-if="node.type === 'Form'"
      :mode="mode"
      :node="node"
      :selected-id="selectedId"
    />

    <FieldRenderer v-else :mode="mode" :node="node" />
  </div>
</template>
