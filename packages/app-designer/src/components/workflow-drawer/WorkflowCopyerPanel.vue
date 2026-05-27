<script setup lang="ts">
import { computed } from 'vue';
import { NODE } from '../../flow-beeflow/constants';
import type { BeeflowNode } from '../../flow-beeflow/types';
import WorkflowAssigneeList from './WorkflowAssigneeList.vue';

const model = defineModel<BeeflowNode>({ required: true });

const ccs = computed({
  get: () => model.value.ccs ?? [],
  set: (list) => {
    model.value = { ...model.value, ccs: list };
  }
});

</script>

<template>
  <div v-if="model.type === NODE.COPY" class="wf-copyer-panel">
    <el-radio-group :model-value="0" class="wf-drawer-tabs">
      <el-radio-button :value="0">设置抄送人</el-radio-button>
    </el-radio-group>
    <div class="wf-drawer-tab-pane">
      <WorkflowAssigneeList
        v-model="ccs"
        mode="cc"
        person-label="抄送人"
        :type-options="[0, 1, 2, 3, 4]"
      />
    </div>
  </div>
</template>
