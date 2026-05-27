<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import CanvasPanel from './CanvasPanel.vue';
import EventPanel from './EventPanel.vue';

const BOTTOM_RATIO_KEY = 'lc-designer-bottom-panel-ratio-v4';
const DEFAULT_BOTTOM_RATIO = 0.28;
const MIN_BOTTOM_RATIO = 0.2;
const MAX_BOTTOM_RATIO = 0.5;
const MIN_EVENT_PANEL_PX = 240;
const RESIZER_HEIGHT = 6;

const centerRef = ref<HTMLElement | null>(null);
const bottomRatio = ref(readStoredRatio());
const isResizing = ref(false);

function readStoredRatio() {
  const stored = Number(localStorage.getItem(BOTTOM_RATIO_KEY));
  if (Number.isFinite(stored) && stored >= MIN_BOTTOM_RATIO && stored <= MAX_BOTTOM_RATIO) {
    return stored;
  }
  return DEFAULT_BOTTOM_RATIO;
}

function persistRatio() {
  localStorage.setItem(BOTTOM_RATIO_KEY, String(bottomRatio.value));
}

function clampRatio(ratio: number) {
  return Math.min(Math.max(ratio, MIN_BOTTOM_RATIO), MAX_BOTTOM_RATIO);
}

function updateRatioFromMouse(clientY: number) {
  const el = centerRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const available = rect.height - RESIZER_HEIGHT;
  if (available <= 0) return;
  const bottomHeight = rect.bottom - clientY - RESIZER_HEIGHT;
  bottomRatio.value = clampRatio(bottomHeight / available);
}

function stopResize() {
  isResizing.value = false;
  document.body.classList.remove('is-panel-resizing');
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', stopResize);
  persistRatio();
}

function onMouseMove(event: MouseEvent) {
  if (!isResizing.value) return;
  updateRatioFromMouse(event.clientY);
}

function startResize(event: MouseEvent) {
  isResizing.value = true;
  document.body.classList.add('is-panel-resizing');
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', stopResize);
  event.preventDefault();
}

onUnmounted(() => {
  stopResize();
});
</script>

<template>
  <div
    ref="centerRef"
    class="designer-center"
    :style="{
      gridTemplateRows: `minmax(0, 1fr) ${RESIZER_HEIGHT}px minmax(${MIN_EVENT_PANEL_PX}px, ${bottomRatio * 100}%)`
    }"
  >
    <div class="designer-center__canvas">
      <CanvasPanel />
    </div>

    <div
      class="designer-center__resizer"
      :class="{ 'is-active': isResizing }"
      title="拖动调整高度"
      @mousedown="startResize"
    >
      <span class="designer-center__resizer-line" />
    </div>

    <div class="designer-center__bottom">
      <EventPanel />
    </div>
  </div>
</template>
