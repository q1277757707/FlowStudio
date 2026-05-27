<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ASSIGNEE, getAssigneeType } from '../../workflow-canvas/assignee';
import { NODE } from '../../workflow-canvas/constants';
import { syncApprovalMultiInstanceType } from '../../workflow-canvas/nodeNormalize';
import type { WorkflowNode } from '../../workflow-canvas/types';
import WorkflowAssigneeList from './WorkflowAssigneeList.vue';

const model = defineModel<WorkflowNode>({ required: true });

const viewTab = ref(0);

const assignees = computed({
  get: () => model.value.assignees ?? [],
  set: (list) => {
    model.value = { ...model.value, assignees: list };
    syncApprovalMultiInstanceType(model.value);
  }
});

const haveMulti = computed(() => assignees.value.length > 1);

const isInitiatorChoiceOrRoleOrAssignee = computed(() => {
  const first = assignees.value[0];
  if (!first) return false;
  return ([ASSIGNEE.ROLE, ASSIGNEE.ASSIGNEE, ASSIGNEE.INITIATOR_CHOICE] as number[]).includes(
    getAssigneeType(first, 'approve')
  );
});

const isSameAssigneeType = computed(() => {
  if (assignees.value.length <= 1) return false;
  const firstType = getAssigneeType(assignees.value[0], 'approve');
  return assignees.value.every((item) => getAssigneeType(item, 'approve') === firstType);
});

/** 与 ref ApproverDrawer 一致：多人 / 角色 / 指定成员 / 发起人自选 时展示 */
const showMultiSign = computed(() => haveMulti.value || isInitiatorChoiceOrRoleOrAssignee.value);

watch(
  assignees,
  () => {
    syncApprovalMultiInstanceType(model.value);
    model.value = { ...model.value };
  },
  { deep: true }
);
</script>

<template>
  <div v-if="model.type === NODE.APPROVE" class="wf-approver-panel">
    <div class="wf-drawer-section">
      <div class="wf-drawer-section__label">审批类型</div>
      <el-radio-group v-model="model.approvalType">
        <el-radio :value="0">人工审批</el-radio>
        <el-radio :value="1">自动通过</el-radio>
        <el-radio :value="2">自动拒绝</el-radio>
      </el-radio-group>
    </div>

    <template v-if="model.approvalType === 0">
      <el-radio-group v-model="viewTab" class="wf-drawer-tabs">
        <el-radio-button :value="0">设置审批人</el-radio-button>
        <el-radio-button :value="2">操作权限</el-radio-button>
      </el-radio-group>

      <div v-show="viewTab === 0" class="wf-drawer-tab-pane">
        <WorkflowAssigneeList
          v-model="assignees"
          mode="approve"
          person-label="审批人"
          :type-options="[0, 1, 2, 3, 4, 5, 6, 7]"
          disable-multi-only-types
        />

        <div v-if="showMultiSign" class="wf-drawer-section">
          <div class="wf-drawer-section__label">多人审批时采用的审批方式</div>
          <el-radio-group v-model="model.multiInstanceApprovalType" class="wf-radio-vertical">
            <el-radio :value="1">会签（需所有审批人同意）</el-radio>
            <el-radio :value="2">或签（一名审批人同意即可）</el-radio>
            <el-radio v-if="isSameAssigneeType" :value="3">依次审批（按顺序依次审批）</el-radio>
          </el-radio-group>
        </div>

        <div class="wf-drawer-section">
          <div class="wf-drawer-section__label">审批人为空时</div>
          <el-radio-group v-model="model.flowNodeNoAuditorType" class="wf-radio-vertical">
            <el-radio :value="0">自动通过</el-radio>
            <el-radio :value="1">指定人员审批</el-radio>
            <el-radio :value="2">转交给审批管理员</el-radio>
          </el-radio-group>
          <el-input
            v-if="model.flowNodeNoAuditorType === 1"
            v-model="model.flowNodeNoAuditorAssignee"
            placeholder="指定成员 ID"
            class="wf-drawer-section__input"
          />
          <el-input
            v-if="model.flowNodeNoAuditorType === 2"
            v-model="model.flowNodeAuditAdmin"
            placeholder="审批管理员 ID"
            class="wf-drawer-section__input"
          />
        </div>

        <div class="wf-drawer-section">
          <div class="wf-drawer-section__label">审批人与提交人为同一人时</div>
          <el-radio-group v-model="model.flowNodeSelfAuditorType" class="wf-assignee-card__radios">
            <el-radio :value="0">由发起人对自己审批</el-radio>
            <el-radio :value="1">自动跳过</el-radio>
            <el-radio :value="2">转交给直接上级审批</el-radio>
            <el-radio :value="3">转交给部门负责人审批</el-radio>
          </el-radio-group>
        </div>
      </div>

      <div v-show="viewTab === 2" class="wf-drawer-tab-pane wf-auth-list">
        <el-checkbox v-model="model.assignable">允许转交</el-checkbox>
        <el-checkbox v-model="model.signable">允许加签 / 减签</el-checkbox>
        <el-checkbox v-model="model.backable">允许回退</el-checkbox>
        <el-checkbox v-model="model.signature">审批签字</el-checkbox>
      </div>
    </template>
  </div>
</template>
