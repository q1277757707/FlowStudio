<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Document,
  RefreshLeft,
  RefreshRight,
  Setting,
  UserFilled
} from '@element-plus/icons-vue';
import SchemaRenderer from '@designer-renderer/SchemaRenderer.vue';
import { useDesignerStore } from '../store/designer';
import DesignerCenter from './DesignerCenter.vue';
import MaterialPanel from './MaterialPanel.vue';
import PropertyPanel from './PropertyPanel.vue';

const designer = useDesignerStore();
const previewVisible = ref(false);
const schemaDialogVisible = ref(false);
const navTab = ref('page');

async function copySchema() {
  await navigator.clipboard.writeText(designer.schemaJson);
  ElMessage.success('Schema 已复制');
}

function handleSave() {
  ElMessage.success('页面已保存');
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;

  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

function onKeydown(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey) || isEditableTarget(event.target)) {
    return;
  }

  const key = event.key.toLowerCase();

  if (key === 'z' && !event.shiftKey) {
    event.preventDefault();
    designer.undo();
    return;
  }

  if (key === 'y' || (key === 'z' && event.shiftKey)) {
    event.preventDefault();
    designer.redo();
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div class="designer-shell">
    <header class="designer-header">
      <div class="designer-header__brand">
        <div class="designer-header__logo">
          <el-icon :size="20"><Setting /></el-icon>
        </div>
        <span class="designer-header__name">FlowStudio</span>
        <span class="designer-header__version">v1.1.0</span>
      </div>

      <nav class="designer-header__nav">
        <button
          type="button"
          class="designer-nav-item"
          :class="{ 'is-active': navTab === 'page' }"
          @click="navTab = 'page'"
        >
          页面设计
        </button>
        <button type="button" class="designer-nav-item" disabled>数据模型</button>
        <button type="button" class="designer-nav-item" disabled>流程&amp;事件</button>
        <button type="button" class="designer-nav-item" disabled>应用设置</button>
      </nav>

      <div class="designer-header__actions">
        <el-button-group class="designer-header__icon-group">
          <el-button
            :icon="RefreshLeft"
            text
            title="撤销 (Ctrl+Z)"
            :disabled="!designer.canUndo"
            @click="designer.undo()"
          />
          <el-button
            :icon="RefreshRight"
            text
            title="重做 (Ctrl+Y)"
            :disabled="!designer.canRedo"
            @click="designer.redo()"
          />
        </el-button-group>

        <el-button @click="schemaDialogVisible = true">Schema</el-button>
        <el-button @click="previewVisible = true">预览</el-button>
        <el-button>发布</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>

        <el-avatar :size="32" class="designer-header__avatar">
          <el-icon><UserFilled /></el-icon>
        </el-avatar>
      </div>
    </header>

    <section class="designer-workbench">
      <MaterialPanel />

      <DesignerCenter />

      <PropertyPanel />
    </section>

    <el-dialog
      v-model="schemaDialogVisible"
      title="页面 Schema"
      width="80%"
      class="schema-dialog"
      destroy-on-close
    >
      <div class="schema-dialog__toolbar">
        <el-button type="primary" :icon="Document" @click="copySchema">复制 Schema</el-button>
      </div>
      <el-input
        class="schema-dialog__editor"
        :model-value="designer.schemaJson"
        type="textarea"
        :rows="24"
        readonly
      />
    </el-dialog>

    <el-dialog
      v-model="previewVisible"
      title="页面预览"
      width="80%"
      class="preview-dialog"
      destroy-on-close
    >
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
  </div>
</template>
