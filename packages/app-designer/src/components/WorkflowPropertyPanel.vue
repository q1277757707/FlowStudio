<script setup lang="ts">
import { computed } from 'vue';
import { Delete } from '@element-plus/icons-vue';
import type { WorkflowAssigneeMode } from '@designer-core/workflow';
import { getWorkflowStepKindLabel } from '@designer-core/workflow';
import { useWorkflowStore } from '../store/workflow';

const workflow = useWorkflowStore();

const assigneeModeOptions: Array<{ label: string; value: WorkflowAssigneeMode }> = [
  { label: '发起人本人', value: 'initiatorSelf' },
  { label: '指定成员', value: 'specifiedUsers' },
  { label: '指定角色', value: 'specifiedRoles' },
  { label: '发起人主管', value: 'initiatorManager' },
  { label: '表单内联系人', value: 'formContact' }
];

const drawerOpen = computed({
  get: () => workflow.selection.target !== 'end',
  set: (open: boolean) => { if (!open) workflow.selectEnd(); }
});

const isBranchCondition = computed(
  () => workflow.selection.target === 'branchCondition' && workflow.selectedBranch
);

const drawerTitle = computed(() => {
  if (workflow.selection.target === 'start') return '发起人';
  if (isBranchCondition.value && workflow.selectedBranch) return workflow.selectedBranch.label;
  if (workflow.selectedStep) return getWorkflowStepKindLabel(workflow.selectedStep.kind);
  return '节点设置';
});

const drawerSubtitle = computed(() => {
  if (workflow.selection.target === 'start') return '配置流程提交范围';
  if (isBranchCondition.value) return '配置分支进入条件';
  if (workflow.selectedStep) return workflow.selectedStep.name;
  return '';
});
</script>

<template>
  <el-drawer
    v-model="drawerOpen"
    :title="drawerTitle"
    direction="rtl"
    size="380px"
    class="workflow-node-drawer"
    modal-class="workflow-node-drawer-modal"
    :append-to-body="true"
    :destroy-on-close="false"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
  >
    <template #header>
      <div class="workflow-node-drawer__header">
        <div class="workflow-node-drawer__title">{{ drawerTitle }}</div>
        <div v-if="drawerSubtitle" class="workflow-node-drawer__subtitle">{{ drawerSubtitle }}</div>
      </div>
    </template>

    <div class="workflow-property-panel workflow-property-panel--drawer">
      <template v-if="workflow.selection.target === 'start'">
        <section class="property-section">
          <el-form label-position="top" class="setter-form">
            <el-form-item label="谁可以发起">
              <el-radio-group :model-value="workflow.startSettings.initiatorMode" class="workflow-radio-group workflow-radio-group--vertical"
                @update:model-value="workflow.setStartSettings({ initiatorMode: $event, initiatorValue: '' })">
                <el-radio value="all">全员可提交</el-radio>
                <el-radio value="role">指定角色</el-radio>
                <el-radio value="user">指定成员</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="workflow.startSettings.initiatorMode === 'role'" label="角色">
              <el-input :model-value="workflow.startSettings.initiatorValue ?? ''" placeholder="输入角色" @update:model-value="workflow.setStartSettings({ initiatorValue: String($event) })" />
            </el-form-item>
            <el-form-item v-if="workflow.startSettings.initiatorMode === 'user'" label="成员">
              <el-input :model-value="workflow.startSettings.initiatorValue ?? ''" placeholder="成员 ID，逗号分隔" @update:model-value="workflow.setStartSettings({ initiatorValue: String($event) })" />
            </el-form-item>
          </el-form>
        </section>
      </template>

      <template v-else-if="isBranchCondition && workflow.selectedBranch">
        <section class="property-section">
          <el-form label-position="top" class="setter-form">
            <el-form-item label="条件表达式">
              <el-input type="textarea" :rows="4" :model-value="workflow.selectedBranch.condition ?? ''" placeholder="如：{{form.amount}} > 5000"
                @update:model-value="workflow.selection.target === 'branchCondition' && workflow.updateBranchCondition(workflow.selection.blockKey, workflow.selection.branchKey, String($event))" />
            </el-form-item>
          </el-form>
        </section>
      </template>

      <template v-else-if="workflow.selectedStep">
        <section class="property-section">
          <el-form label-position="top" class="setter-form">
            <el-form-item label="节点名称">
              <el-input :model-value="workflow.selectedStep.name" @update:model-value="workflow.updateStep(workflow.selectedStep!.key, { name: String($event) })" />
            </el-form-item>
            <el-form-item label="审批人">
              <el-radio-group :model-value="workflow.selectedStep.assigneeMode" class="workflow-radio-group workflow-radio-group--vertical"
                @update:model-value="workflow.updateStep(workflow.selectedStep!.key, { assigneeMode: $event, assigneeValue: '' })">
                <el-radio v-for="opt in assigneeModeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="workflow.selectedStep.assigneeMode === 'specifiedUsers' || workflow.selectedStep.assigneeMode === 'specifiedRoles'"
              :label="workflow.selectedStep.assigneeMode === 'specifiedUsers' ? '成员' : '角色'">
              <el-input :model-value="workflow.selectedStep.assigneeValue" @update:model-value="workflow.updateStep(workflow.selectedStep!.key, { assigneeValue: String($event) })" />
            </el-form-item>
            <el-form-item v-if="workflow.selectedStep.kind === 'approval'" label="审批方式">
              <el-radio-group :model-value="workflow.selectedStep.approveMode ?? 'or'" class="workflow-radio-group workflow-radio-group--vertical"
                @update:model-value="workflow.updateStep(workflow.selectedStep!.key, { approveMode: $event })">
                <el-radio value="or">或签（一名同意即可）</el-radio>
                <el-radio value="and">会签（须全部同意）</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-popconfirm title="确定删除该节点吗？" @confirm="workflow.removeStep(workflow.selectedStep!.key)">
              <template #reference>
                <el-button type="danger" plain :icon="Delete">删除节点</el-button>
              </template>
            </el-popconfirm>
          </el-form>
        </section>
      </template>
    </div>
  </el-drawer>
</template>
