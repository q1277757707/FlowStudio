<script setup lang="ts">
import {
  Bell,
  Connection,
  Setting,
  UserFilled
} from '@element-plus/icons-vue';
import type { WorkflowStepKind } from '@designer-core/workflow';
import { getWorkflowStepKindLabel } from '@designer-core/workflow';
import { NODE_COLOR } from '../workflow-canvas/constants';

const emit = defineEmits<{ pick: [kind: WorkflowStepKind] }>();

const hideCondition = false;

const items: Array<{ kind: WorkflowStepKind; color: string; icon: unknown }> = [
  { kind: 'approval', color: '#fa8c16', icon: UserFilled },
  { kind: 'cc', color: '#1677ff', icon: Bell },
  { kind: 'handler', color: '#722ed1', icon: Setting },
  { kind: 'condition', color: NODE_COLOR.CONDITION, icon: Connection }
];
</script>

<template>
  <div class="workflow-add-menu" :class="{ 'is-compact': hideCondition }">
    <button
      v-for="item in items"
      :key="item.kind"
      type="button"
      class="workflow-add-menu__item"
      @click="emit('pick', item.kind)"
    >
      <span class="workflow-add-menu__icon" :style="{ backgroundColor: item.color }">
        <el-icon :size="16"><component :is="item.icon" /></el-icon>
      </span>
      <span class="workflow-add-menu__label">{{ getWorkflowStepKindLabel(item.kind) }}</span>
    </button>
  </div>
</template>

