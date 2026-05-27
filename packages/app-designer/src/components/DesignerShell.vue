<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Document, Setting, UserFilled } from '@element-plus/icons-vue';
import { useDesignerStore } from '../store/designer';
import { useWorkflowStore } from '../store/workflow';
import DesignerCenter from './DesignerCenter.vue';
import MaterialPanel from './MaterialPanel.vue';
import PropertyPanel from './PropertyPanel.vue';
import BasicInfoPanel from './BasicInfoPanel.vue';
import WorkflowDesignerPanel from './WorkflowDesignerPanel.vue';

type StepKey = 'basic' | 'page' | 'workflow' | 'settings';

const designer = useDesignerStore();
const workflow = useWorkflowStore();
const workflowSchemaVisible = ref(false);
const activeStep = ref<StepKey>('page');

const steps: Array<{ key: StepKey; label: string }> = [
  { key: 'basic', label: '基础信息' },
  { key: 'page', label: '表单设计' },
  { key: 'workflow', label: '流程设计' },
  { key: 'settings', label: '更多设置' }
];

const workMode = computed(() => activeStep.value);

function openWorkflowJson() {
  workflow.refreshFlowSnapshot();
  workflowSchemaVisible.value = true;
}

async function copyWorkflowJson() {
  workflow.refreshFlowSnapshot();
  await navigator.clipboard.writeText(workflow.templateJson);
  ElMessage.success('流程 JSON 已复制');
}

function handleSave() {
  ElMessage.success('已保存');
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

function onKeydown(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey) || isEditableTarget(event.target)) return;
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

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="designer-shell">

    <!-- ── 顶栏 ─────────────────────────────────────────── -->
    <header class="designer-header">
      <div class="designer-header__brand">
        <div class="designer-header__logo">
          <el-icon :size="18"><Setting /></el-icon>
        </div>
        <span class="designer-header__name">FlowStudio</span>
        <span class="designer-header__version">v1.1.0</span>
      </div>

      <!-- 步骤条 -->
      <nav class="designer-steps" aria-label="设计步骤">
        <div class="designer-steps__track">
          <template v-for="(step, index) in steps" :key="step.key">
            <button
              type="button"
              class="designer-steps__item"
              :class="{
                'is-active': activeStep === step.key,
                'is-done': steps.findIndex((s) => s.key === activeStep) > index
              }"
              @click="activeStep = step.key"
            >
              <span class="designer-steps__circle">{{ index + 1 }}</span>
              <span class="designer-steps__label">{{ step.label }}</span>
            </button>
            <span v-if="index < steps.length - 1" class="designer-steps__chevron" aria-hidden="true" />
          </template>
        </div>
      </nav>

      <div class="designer-header__actions">
        <el-button type="primary" class="designer-header__save" @click="handleSave">保存</el-button>

        <el-avatar :size="34" class="designer-header__avatar">
          <el-icon><UserFilled /></el-icon>
        </el-avatar>
      </div>
    </header>

    <!-- ── 主体 ─────────────────────────────────────────── -->
    <div class="designer-body">

      <!-- 表单设计工作区 -->
      <section v-show="workMode === 'page'" class="designer-workbench designer-workbench--page">
        <MaterialPanel />
        <DesignerCenter />
        <PropertyPanel />
      </section>

      <!-- 流程设计工作区（v-if 避免隐藏时属性抽屉仍挂载到 body） -->
      <section v-if="workMode === 'workflow'" class="designer-workbench designer-workbench--workflow">
        <div class="workflow-panel__head">
          <p class="workflow-panel__hint">点击节点配置审批人、条件与分支；拖拽空白区域平移画布</p>
          <div class="canvas-toolbar">
            <div class="canvas-toolbar__group workflow-panel__tools">
              <el-button size="small" :icon="Document" @click="openWorkflowJson">流程 JSON</el-button>
              <el-button size="small" @click="workflow.resetTemplate()">重置流程</el-button>
            </div>
          </div>
        </div>
        <WorkflowDesignerPanel />
      </section>

      <!-- 基础信息 -->
      <section v-show="workMode === 'basic'" class="designer-workbench designer-workbench--basic">
        <BasicInfoPanel />
      </section>

      <!-- 更多设置 -->
      <section v-show="workMode === 'settings'" class="designer-workbench designer-workbench--placeholder">
        <el-empty description="更多设置（开发中）" />
      </section>

    </div>

    <!-- ── 弹窗 ─────────────────────────────────────────── -->
    <el-dialog v-model="workflowSchemaVisible" title="流程模板 JSON" width="80%" class="schema-dialog">
      <div class="schema-dialog__toolbar">
        <el-button type="primary" :icon="Document" @click="copyWorkflowJson">复制 JSON</el-button>
      </div>
      <el-input class="schema-dialog__editor" :model-value="workflow.templateJson" type="textarea" :rows="24" readonly />
    </el-dialog>

  </div>
</template>
