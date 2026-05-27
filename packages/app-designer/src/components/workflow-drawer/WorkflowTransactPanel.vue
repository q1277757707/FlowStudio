<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getAssigneeType } from '../../flow-beeflow/assignee';
import { NODE } from '../../flow-beeflow/constants';
import { syncTransactMultiInstanceType } from '../../flow-beeflow/nodeNormalize';
import type { BeeflowNode } from '../../flow-beeflow/types';
import WorkflowAssigneeList from './WorkflowAssigneeList.vue';

const model = defineModel<BeeflowNode>({ required: true });

const viewTab = ref(0);

const transactors = computed({
  get: () => model.value.transactors ?? [],
  set: (list) => {
    model.value = { ...model.value, transactors: list };
    syncTransactMultiInstanceType(model.value);
  }
});

const haveMulti = computed(() => transactors.value.length > 1);

const isSameAssigneeType = computed(() => {
  if (transactors.value.length <= 1) return false;
  const firstType = getAssigneeType(transactors.value[0], 'transact');
  return transactors.value.every((item) => getAssigneeType(item, 'transact') === firstType);
});

watch(
  transactors,
  () => {
    syncTransactMultiInstanceType(model.value);
    model.value = { ...model.value };
  },
  { deep: true }
);
</script>

<template>
  <div v-if="model.type === NODE.TRANSACT" class="wf-transact-panel">
    <div class="wf-drawer-tip">
      <p class="wf-drawer-tip__title">办理人设置</p>
      <p class="wf-drawer-tip__text">
        当流程中某个节点不需要审批，但需要对审批单进行业务办理时，可设置办理人节点，场景如财务打款、处理盖章等。
      </p>
    </div>

    <el-radio-group v-model="viewTab" class="wf-drawer-tabs">
      <el-radio-button :value="0">设置办理人</el-radio-button>
      <el-radio-button :value="2">操作权限</el-radio-button>
    </el-radio-group>

    <div v-show="viewTab === 0" class="wf-drawer-tab-pane">
      <WorkflowAssigneeList
        v-model="transactors"
        mode="transact"
        person-label="办理人"
        :type-options="[0, 1, 2, 3, 4, 7]"
        disable-multi-only-types
      />

      <div v-if="haveMulti" class="wf-drawer-section">
        <div class="wf-drawer-section__label">多人办理时采用的办理方式</div>
        <el-radio-group v-model="model.multiInstanceApprovalType" class="wf-radio-vertical">
          <el-radio :value="1">会签（需所有办理人办理）</el-radio>
          <el-radio :value="2">或签（一名办理人办理即可）</el-radio>
          <el-radio v-if="isSameAssigneeType" :value="3">依次办理（按顺序依次办理）</el-radio>
        </el-radio-group>
      </div>

      <div class="wf-drawer-section">
        <div class="wf-drawer-section__label">办理人为空时</div>
        <el-radio-group v-model="model.flowNodeNoAuditorType" class="wf-radio-vertical">
          <el-radio :value="1">指定人员办理</el-radio>
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
    </div>

    <div v-show="viewTab === 2" class="wf-drawer-tab-pane wf-auth-list">
      <el-checkbox v-model="model.assignable">允许转交</el-checkbox>
    </div>
  </div>
</template>
