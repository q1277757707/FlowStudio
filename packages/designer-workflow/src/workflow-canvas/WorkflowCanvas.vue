<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { Minus, Plus } from '@element-plus/icons-vue';
import './workflow-canvas.css';
import { useWorkflowStore } from '../store/workflow';
import WorkflowNodeWrap from './WorkflowNodeWrap.vue';
import { nodeAccentVars } from './accent';
import { NODE, NODE_COLOR } from './constants';

const workflow = useWorkflowStore();

const MIN_SCALE = 50;
const MAX_SCALE = 300;
const SCALE_STEP = 10;

const scale = ref(100);
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const viewportRef = ref<HTMLElement | null>(null);
const panSession = { x: 0, y: 0, panX: 0, panY: 0 };

const transformStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${scale.value / 100})`
}));

function onNodeConfigUpdate(value: import('./types').WorkflowNode | null) {
  if (value) workflow.setNodeConfig(value);
}

function zoomIn() { if (scale.value < MAX_SCALE) scale.value = Math.min(MAX_SCALE, scale.value + SCALE_STEP); }
function zoomOut() { if (scale.value > MIN_SCALE) scale.value = Math.max(MIN_SCALE, scale.value - SCALE_STEP); }

function isPanTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return !target.closest('button, input, textarea, .node-wrap-box, .auto-judge, .add-branch, .add-node-btn, .sort-left, .sort-right, .close, .editable-title');
}

function onViewportPointerDown(event: PointerEvent) {
  if (event.button !== 0 || !isPanTarget(event.target)) return;
  isPanning.value = true;
  panSession.x = event.clientX; panSession.y = event.clientY;
  panSession.panX = panX.value; panSession.panY = panY.value;
  viewportRef.value?.setPointerCapture(event.pointerId);
}

function onViewportPointerMove(event: PointerEvent) {
  if (!isPanning.value) return;
  panX.value = panSession.panX + (event.clientX - panSession.x);
  panY.value = panSession.panY + (event.clientY - panSession.y);
}

function endPan(event: PointerEvent) {
  if (!isPanning.value) return;
  isPanning.value = false;
  if (viewportRef.value?.hasPointerCapture(event.pointerId)) viewportRef.value.releasePointerCapture(event.pointerId);
}

onBeforeUnmount(() => { isPanning.value = false; });
</script>

<template>
  <div class="workflow-canvas designer-center__canvas workflow-canvas-surface" :class="{ 'is-panning': isPanning }" @click.stop>
    <div class="flow-canvas-zoom" @click.stop>
      <button type="button" class="flow-canvas-zoom__btn" :disabled="scale <= MIN_SCALE" aria-label="缩小" @click="zoomOut">
        <el-icon><Minus /></el-icon>
      </button>
      <span class="flow-canvas-zoom__label">{{ scale }}%</span>
      <button type="button" class="flow-canvas-zoom__btn" :disabled="scale >= MAX_SCALE" aria-label="放大" @click="zoomIn">
        <el-icon><Plus /></el-icon>
      </button>
    </div>

    <div ref="viewportRef" class="flow-canvas-viewport" @pointerdown="onViewportPointerDown" @pointermove="onViewportPointerMove" @pointerup="endPan" @pointercancel="endPan">
      <div class="flow-canvas-transform" :style="transformStyle">
        <div class="flow-desgin-main">
          <div class="box-scale">
            <WorkflowNodeWrap :node-config="workflow.nodeConfig" :flow-permission="workflow.flowPermission" @update:node-config="onNodeConfigUpdate" />
            <div class="node-wrap">
              <div
                class="node-wrap-box end-node"
                :class="{ 'is-selected': workflow.selection.target === 'end' }"
                :style="nodeAccentVars(NODE_COLOR.END)"
              >
                <div class="title" :style="{ background: NODE_COLOR.END }">结束</div>
                <div class="content" @click="workflow.selectEnd()">流程结束</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
