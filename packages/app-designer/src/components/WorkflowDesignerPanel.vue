<script setup lang="ts">
/** 宜搭流程设计：全宽画布 + 点击节点右侧抽屉 */
import BeeflowFlowCanvas from '../flow-beeflow/BeeflowFlowCanvas.vue';
import WorkflowPropertyPanel from './WorkflowPropertyPanel.vue';
</script>

<template>
  <div class="designer-center workflow-center workflow-center--drawer">
    <BeeflowFlowCanvas />
    <WorkflowPropertyPanel />
  </div>
</template>
