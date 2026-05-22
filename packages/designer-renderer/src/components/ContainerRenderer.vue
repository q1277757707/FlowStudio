<script setup lang="ts">
import Draggable from 'vuedraggable';
import type { LowCodeNode } from '@designer-core/schema';
import { useRendererRuntime } from '../composables/useRendererRuntime';
import type { RendererMode } from '../types';
import RendererList from './RendererList.vue';
import { useDragMove } from '../composables/useDragMove';

defineProps<{
  mode: RendererMode;
  node: LowCodeNode;
  selectedId: string;
}>();

const runtime = useRendererRuntime();
const { checkMove, dragGroup } = useDragMove('container');
</script>

<template>
  <section class="render-container">
    <div class="render-container__title">{{ runtime.readString(node, 'title', '栅格') }}</div>

    <div
      v-if="runtime.readString(node, 'layout', 'grid') === 'grid'"
      class="grid-layout"
      :style="runtime.gridStyle(node, mode)"
    >
      <div
        v-for="cell in runtime.ensureGridCells(node)"
        :key="cell.id"
        class="grid-cell"
        :class="{
          'is-drag-over': mode === 'edit' && runtime.activeCellId.value === cell.id,
          'grid-cell--empty': mode === 'preview' && !cell.children.length
        }"
        @dragenter.prevent="runtime.setActiveCell(cell.id)"
        @dragover.prevent="runtime.setActiveCell(cell.id)"
        @dragleave="runtime.clearActiveCell"
        @drop="runtime.clearActiveCell"
      >
        <Draggable
          v-if="mode === 'edit'"
          :list="cell.children"
          class="grid-cell-drop-zone"
          data-drop-zone="container"
          :class="{ 'is-empty': !cell.children.length }"
          :group="dragGroup"
          item-key="id"
          :empty-insert-threshold="48"
          :move="checkMove"
          @change="runtime.onChildChange"
        >
          <template #item="{ element }">
            <RendererList :nodes="[element]" :mode="mode" :selected-id="selectedId" />
          </template>
          <template #footer>
            <div v-if="!cell.children.length" class="grid-cell__placeholder">可拖入表单/栅格/按钮等，表单组件请放入表单</div>
          </template>
        </Draggable>

        <RendererList
          v-else-if="cell.children.length"
          :nodes="cell.children"
          :mode="mode"
          :selected-id="selectedId"
        />
      </div>
    </div>

    <template v-else>
      <Draggable
        v-if="mode === 'edit'"
        :list="runtime.ensureChildren(node)"
        class="nested-drop-zone"
        data-drop-zone="container"
        :class="{ 'is-empty': !node.children?.length }"
        :group="dragGroup"
        item-key="id"
        :move="checkMove"
        @change="runtime.onChildChange"
      >
        <template #item="{ element }">
          <RendererList :nodes="[element]" :mode="mode" :selected-id="selectedId" />
        </template>
        <template #footer>
          <div v-if="!node.children?.length" class="nested-drop-zone__placeholder">可拖入表单/栅格/按钮等，表单组件请放入表单</div>
        </template>
      </Draggable>

      <RendererList
        v-else-if="node.children?.length"
        :nodes="node.children"
        :mode="mode"
        :selected-id="selectedId"
      />
    </template>
  </section>
</template>
