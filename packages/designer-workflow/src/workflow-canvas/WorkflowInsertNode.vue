<script setup lang="ts">
import { ref } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import type { WorkflowStepKind } from '@designer-core/workflow';
import WorkflowAddMenu from '../components/WorkflowAddMenu.vue';
import { createWorkflowNodeForKind } from './adapter';
import type { WorkflowNode } from './types';

const props = defineProps<{
  childNodeP: WorkflowNode | null;
}>();

const emit = defineEmits<{
  'update:childNodeP': [value: WorkflowNode | null];
}>();

const visible = ref(false);

function onPick(kind: WorkflowStepKind) {
  visible.value = false;
  emit('update:childNodeP', createWorkflowNodeForKind(kind, props.childNodeP));
}
</script>

<template>
  <div class="add-node-btn-box">
    <div class="add-node-btn">
      <el-popover
        v-model:visible="visible"
        placement="right"
        :width="360"
        trigger="click"
        popper-class="workflow-add-popover"
      >
        <WorkflowAddMenu @pick="onPick" />
        <template #reference>
          <button type="button" class="btn">
            <el-icon><Plus /></el-icon>
          </button>
        </template>
      </el-popover>
    </div>
  </div>
</template>
