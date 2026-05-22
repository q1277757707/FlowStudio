<script setup lang="ts">
import { computed } from 'vue';
import {
  ArrowDown,
  ArrowUp,
  CopyDocument,
  Delete,
  Plus,
  Rank,
  Refresh,
  ZoomIn,
  ZoomOut
} from '@element-plus/icons-vue';
import Draggable from 'vuedraggable';
import SchemaRenderer from '@designer-renderer/SchemaRenderer.vue';
import type { LowCodeNode } from '@designer-core/schema';
import { useDesignerStore } from '../store/designer';
import { useDragMove } from '@designer-renderer/composables/useDragMove';

const designer = useDesignerStore();
const { checkMove, dragGroup } = useDragMove('canvas', {
  getRootNodes: () => designer.schema.components
});

const rootNodes = computed({
  get: () => designer.schema.components,
  set: (nodes: LowCodeNode[]) => designer.setRootNodes(nodes)
});

function onCanvasChange(event: {
  added?: { element: LowCodeNode };
  removed?: { element: LowCodeNode };
  moved?: { element: LowCodeNode };
}) {
  if (event.added) {
    designer.selectNode(event.added.element.id);
  }

  designer.commitHistory();
}
</script>

<template>
  <main class="canvas-panel">
    <div class="canvas-panel__head">
      <div class="canvas-page-tabs">
        <button type="button" class="canvas-page-tab is-active">{{ designer.schema.pageName }}</button>
        <el-button class="canvas-page-add" :icon="Plus" text circle />
      </div>

      <div class="canvas-toolbar">
        <el-button-group>
          <el-button :icon="Rank" text title="选择" />
          <el-button :icon="CopyDocument" text title="复制" />
          <el-button :icon="Delete" text title="删除" @click="designer.removeSelectedNode()" />
          <el-button :icon="ArrowUp" text title="上移" />
          <el-button :icon="ArrowDown" text title="下移" />
          <el-button :icon="Refresh" text title="刷新" @click="designer.resetSchema()" />
          <el-button :icon="ZoomIn" text title="放大" />
          <el-button :icon="ZoomOut" text title="缩小" />
        </el-button-group>
      </div>
    </div>

    <div class="canvas-stage">
      <div class="canvas-page">
        <Draggable
          v-model="rootNodes"
          class="canvas-drop-zone"
          data-drop-zone="canvas"
          :class="{ 'is-empty': rootNodes.length === 0 }"
          :group="dragGroup"
          item-key="id"
          :move="checkMove"
          @change="onCanvasChange"
        >
          <template #item="{ element }">
            <SchemaRenderer
              :nodes="[element]"
              mode="edit"
              :selected-id="designer.selectedId"
              :on-schema-change="designer.commitHistory"
              @select-node="designer.selectNode"
            />
          </template>
        </Draggable>

        <el-empty
          v-if="rootNodes.length === 0"
          class="canvas-empty"
          description="从左侧拖入组件开始搭建页面"
        />
      </div>
    </div>
  </main>
</template>
