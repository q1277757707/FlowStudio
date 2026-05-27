<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  ArrowDown,
  ArrowUp,
  CopyDocument,
  Delete,
  Document,
  Plus,
  Rank,
  Refresh,
  RefreshLeft,
  RefreshRight,
  View,
  ZoomIn,
  ZoomOut
} from '@element-plus/icons-vue';
import Draggable from 'vuedraggable';
import SchemaRenderer from '@designer-renderer/SchemaRenderer.vue';
import type { LowCodeNode } from '@designer-core/schema';
import { useDesignerStore } from '../store/designer';
import { useDragMove } from '@designer-renderer/composables/useDragMove';

const designer = useDesignerStore();
const schemaDialogVisible = ref(false);
const previewVisible = ref(false);

async function copySchema() {
  await navigator.clipboard.writeText(designer.schemaJson);
  ElMessage.success('Schema 已复制');
}
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
        <button type="button" class="canvas-page-tab is-active">
          <span class="canvas-page-tab__dot" />
          {{ designer.schema.pageName }}
        </button>
        <button type="button" class="canvas-page-tab canvas-page-tab--add" title="新建页面">
          <el-icon><Plus /></el-icon>
        </button>
      </div>

      <div class="canvas-toolbar">
        <div class="canvas-toolbar__group">
          <el-button class="canvas-tool-btn" :icon="RefreshLeft" text title="撤销 (Ctrl+Z)" :disabled="!designer.canUndo" @click="designer.undo()" />
          <el-button class="canvas-tool-btn" :icon="RefreshRight" text title="重做 (Ctrl+Y)" :disabled="!designer.canRedo" @click="designer.redo()" />
          <el-button class="canvas-tool-btn" :icon="Document" text title="Schema" @click="schemaDialogVisible = true" />
          <el-button class="canvas-tool-btn" :icon="View" text title="预览" @click="previewVisible = true" />
        </div>
        <span class="canvas-toolbar__divider" />
        <div class="canvas-toolbar__group">
          <el-button class="canvas-tool-btn" :icon="Rank" text title="选择" />
          <el-button class="canvas-tool-btn" :icon="CopyDocument" text title="复制" />
          <el-button class="canvas-tool-btn" :icon="Delete" text title="删除" @click="designer.removeSelectedNode()" />
          <el-button class="canvas-tool-btn" :icon="ArrowUp" text title="上移" />
          <el-button class="canvas-tool-btn" :icon="ArrowDown" text title="下移" />
          <el-button class="canvas-tool-btn" :icon="Refresh" text title="刷新" @click="designer.resetSchema()" />
          <el-button class="canvas-tool-btn" :icon="ZoomIn" text title="放大" />
          <el-button class="canvas-tool-btn" :icon="ZoomOut" text title="缩小" />
        </div>
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

    <el-dialog v-model="schemaDialogVisible" title="页面 Schema" width="80%" class="schema-dialog" destroy-on-close append-to-body>
      <div class="schema-dialog__toolbar">
        <el-button type="primary" :icon="Document" @click="copySchema">复制 Schema</el-button>
      </div>
      <el-input class="schema-dialog__editor" :model-value="designer.schemaJson" type="textarea" :rows="24" readonly />
    </el-dialog>

    <el-dialog v-model="previewVisible" title="页面预览" width="80%" class="preview-dialog" destroy-on-close append-to-body>
      <div class="preview-stage">
        <SchemaRenderer
          v-if="designer.schema.components.length"
          :nodes="designer.schema.components"
          mode="preview"
          :page-events="designer.schema.pageEvents"
        />
        <el-empty v-else description="画布暂无组件" />
      </div>
    </el-dialog>
  </main>
</template>
