<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { WorkflowConditionGroupDraft, WorkflowStartSettings } from '@designer-core/workflow';
import { beeflowGroupsToDraft, normalizeConditionGroups } from '../flow-beeflow/condition';
import { NODE } from '../flow-beeflow/constants';
import { findBeeflowNodeByKey } from '../flow-beeflow/findNode';
import { normalizeBeeflowNodeDraft } from '../flow-beeflow/nodeNormalize';
import type { BeeflowNode } from '../flow-beeflow/types';
import { useWorkflowStore } from '../store/workflow';
import WorkflowConditionEditor from './WorkflowConditionEditor.vue';
import WorkflowApproverPanel from './workflow-drawer/WorkflowApproverPanel.vue';
import WorkflowCopyerPanel from './workflow-drawer/WorkflowCopyerPanel.vue';
import WorkflowEditableTitle from './workflow-drawer/WorkflowEditableTitle.vue';
import WorkflowTransactPanel from './workflow-drawer/WorkflowTransactPanel.vue';
import '../styles/workflow-drawer.css';

const workflow = useWorkflowStore();

const draftStartSettings = ref<WorkflowStartSettings>({ initiatorMode: 'all' });
const draftBeeflowNode = ref<BeeflowNode | null>(null);
const draftConditionGroups = ref<WorkflowConditionGroupDraft[]>([]);
const draftBranchLabel = ref('');

const drawerOpen = computed({
  get: () => workflow.selection.target !== 'end',
  set: (open: boolean) => {
    if (!open) workflow.selectEnd();
  }
});

const isBranchCondition = computed(
  () => workflow.selection.target === 'branchCondition' && workflow.selectedBranch
);

const isStepDrawer = computed(() => {
  const t = workflow.selection.target;
  return t === 'step' || t === 'branchStep';
});

const drawerSize = computed(() => {
  if (isBranchCondition.value) return '420px';
  if (isStepDrawer.value) return '540px';
  return '380px';
});

const drawerClass = computed(() => ({
  'workflow-node-drawer--condition': isBranchCondition.value,
  'workflow-node-drawer--step': isStepDrawer.value
}));

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function loadDraftFromSelection() {
  const sel = workflow.selection;
  if (sel.target === 'start') {
    draftStartSettings.value = cloneJson(workflow.startSettings);
    draftBeeflowNode.value = null;
    return;
  }
  if (sel.target === 'branchCondition' && workflow.selectedBranch) {
    draftConditionGroups.value = beeflowGroupsToDraft(
      normalizeConditionGroups(workflow.selectedBranch.conditionGroups)
    );
    draftBranchLabel.value = workflow.selectedBranch.label;
    draftBeeflowNode.value = null;
    return;
  }
  if ((sel.target === 'step' || sel.target === 'branchStep') && sel.stepKey) {
    const node = findBeeflowNodeByKey(workflow.nodeConfig, sel.stepKey);
    draftBeeflowNode.value = node ? normalizeBeeflowNodeDraft(node) : null;
  }
}

watch(
  () => [workflow.selection, workflow.selectedBranch?.key, workflow.selectedStep?.key],
  () => {
    if (workflow.selection.target === 'end') return;
    loadDraftFromSelection();
  },
  { immediate: true }
);

function confirmDrawer() {
  const sel = workflow.selection;
  if (sel.target === 'start') {
    workflow.setStartSettings(cloneJson(draftStartSettings.value));
  } else if (sel.target === 'branchCondition') {
    workflow.updateBranchConditionGroups(sel.blockKey, sel.branchKey, cloneJson(draftConditionGroups.value));
    workflow.updateBranchLabel(sel.blockKey, sel.branchKey, draftBranchLabel.value.trim() || '条件');
  } else if (
    (sel.target === 'step' || sel.target === 'branchStep') &&
    draftBeeflowNode.value
  ) {
    workflow.updateBeeflowNode(sel.stepKey, cloneJson(draftBeeflowNode.value));
  }
  workflow.selectEnd();
}

function cancelDrawer() {
  workflow.selectEnd();
}
</script>

<template>
  <el-drawer
    v-model="drawerOpen"
    direction="rtl"
    :size="drawerSize"
    class="workflow-node-drawer"
    :class="drawerClass"
    modal-class="workflow-node-drawer-modal"
    :append-to-body="true"
    :destroy-on-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :show-close="!isStepDrawer && !isBranchCondition"
  >
    <template v-if="isStepDrawer && draftBeeflowNode" #header>
      <WorkflowEditableTitle v-model="draftBeeflowNode.name" />
    </template>

    <template v-else-if="!isBranchCondition" #header>
      <div class="workflow-node-drawer__header">
        <div class="workflow-node-drawer__title">
          {{ workflow.selection.target === 'start' ? '发起人' : '节点设置' }}
        </div>
        <div v-if="workflow.selection.target === 'start'" class="workflow-node-drawer__subtitle">
          配置流程提交范围
        </div>
      </div>
    </template>

    <div class="workflow-property-panel workflow-property-panel--drawer">
      <template v-if="workflow.selection.target === 'start'">
        <section class="property-section">
          <el-form label-position="top" class="setter-form">
            <el-form-item label="谁可以发起">
              <el-radio-group
                :model-value="draftStartSettings.initiatorMode"
                class="workflow-radio-group workflow-radio-group--vertical"
                @update:model-value="draftStartSettings = { ...draftStartSettings, initiatorMode: $event, initiatorValue: '' }"
              >
                <el-radio value="all">全员可提交</el-radio>
                <el-radio value="role">指定角色</el-radio>
                <el-radio value="user">指定成员</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="draftStartSettings.initiatorMode === 'role'" label="角色">
              <el-input
                :model-value="draftStartSettings.initiatorValue ?? ''"
                placeholder="输入角色"
                @update:model-value="draftStartSettings = { ...draftStartSettings, initiatorValue: String($event) }"
              />
            </el-form-item>
            <el-form-item v-if="draftStartSettings.initiatorMode === 'user'" label="成员">
              <el-input
                :model-value="draftStartSettings.initiatorValue ?? ''"
                placeholder="成员 ID，逗号分隔"
                @update:model-value="draftStartSettings = { ...draftStartSettings, initiatorValue: String($event) }"
              />
            </el-form-item>
          </el-form>
        </section>
      </template>

      <template v-else-if="isBranchCondition && workflow.selectedBranch">
        <WorkflowConditionEditor
          :groups="draftConditionGroups"
          :branch-label="draftBranchLabel"
          @update:groups="draftConditionGroups = $event"
          @update:branch-label="draftBranchLabel = $event"
        />
      </template>

      <template v-else-if="draftBeeflowNode?.type === NODE.APPROVE">
        <WorkflowApproverPanel v-model="draftBeeflowNode" />
      </template>

      <template v-else-if="draftBeeflowNode?.type === NODE.COPY">
        <WorkflowCopyerPanel v-model="draftBeeflowNode" />
      </template>

      <template v-else-if="draftBeeflowNode?.type === NODE.TRANSACT">
        <WorkflowTransactPanel v-model="draftBeeflowNode" />
      </template>
    </div>

    <template #footer>
      <div class="workflow-node-drawer__footer">
        <el-button @click="cancelDrawer">取消</el-button>
        <el-button type="primary" @click="confirmDrawer">保存</el-button>
      </div>
    </template>
  </el-drawer>
</template>
