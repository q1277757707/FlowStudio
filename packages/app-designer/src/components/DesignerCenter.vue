<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import CanvasPanel from './CanvasPanel.vue';
import EventPanel from './EventPanel.vue';

const BOTTOM_HEIGHT_KEY = 'lc-designer-bottom-panel-height';
const DEFAULT_BOTTOM_HEIGHT = 260;
const MIN_BOTTOM_HEIGHT = 160;
const MIN_CANVAS_HEIGHT = 200;

const centerRef = ref<HTMLElement | null>(null);
const bottomHeight = ref(readStoredHeight());
const isResizing = ref(false);

function readStoredHeight() {
  const stored = Number(localStorage.getItem(BOTTOM_HEIGHT_KEY));

  if (Number.isFinite(stored) && stored >= MIN_BOTTOM_HEIGHT) {
    return stored;
  }

  return DEFAULT_BOTTOM_HEIGHT;
}

function persistHeight() {
  localStorage.setItem(BOTTOM_HEIGHT_KEY, String(bottomHeight.value));
}

function clampBottomHeight(next: number) {
  const max =
    (centerRef.value?.clientHeight ?? 600) - MIN_CANVAS_HEIGHT - 6;

  return Math.min(Math.max(next, MIN_BOTTOM_HEIGHT), Math.max(max, MIN_BOTTOM_HEIGHT));
}

function stopResize() {
  isResizing.value = false;
  document.body.classList.remove('is-panel-resizing');
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', stopResize);
  persistHeight();
}

function onMouseMove(event: MouseEvent) {
  if (!isResizing.value || !centerRef.value) {
    return;
  }

  const rect = centerRef.value.getBoundingClientRect();
  bottomHeight.value = clampBottomHeight(rect.bottom - event.clientY);
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
  <div ref="centerRef" class="designer-center">
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

    <div class="designer-center__bottom" :style="{ height: `${bottomHeight}px` }">
      <EventPanel />
    </div>
  </div>
</template>
