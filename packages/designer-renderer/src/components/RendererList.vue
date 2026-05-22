<script setup lang="ts">
import { onMounted } from 'vue';
import type { EventAction, LowCodeNode } from '@designer-core/schema';
import { runEventActions } from '@designer-event/index';
import { useRendererRuntime } from '../composables/useRendererRuntime';
import type { RendererMode } from '../types';
import RendererNode from './RendererNode.vue';

const props = defineProps<{
  mode: RendererMode;
  nodes: LowCodeNode[];
  selectedId: string;
  pageEvents?: Record<string, EventAction[]>;
}>();

onMounted(() => {
  if (props.mode !== 'preview' || !props.pageEvents?.pageLoad?.length) {
    return;
  }

  const runtime = useRendererRuntime();

  void runEventActions(props.pageEvents.pageLoad, runtime.createEventContext(), {
    eventName: 'pageLoad',
    continueOnError: true,
    onLog: (log) => runtime.pushEventLog(log)
  });
});
</script>

<template>
  <div class="schema-renderer" :class="{ 'is-preview-mode': mode === 'preview' }">
    <RendererNode
      v-for="node in nodes"
      :key="node.id"
      :mode="mode"
      :node="node"
      :selected-id="selectedId"
    />
  </div>
</template>
