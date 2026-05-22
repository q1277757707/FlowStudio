<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import eventUserGuideMd from '../../docs/event-user-guide.md?raw';

const html = computed(() =>
  marked.parse(eventUserGuideMd, {
    gfm: true,
    breaks: true
  })
);

function backToDesigner() {
  window.location.href = import.meta.env.BASE_URL;
}
</script>

<template>
  <div class="event-guide-page">
    <header class="event-guide-page__header">
      <h1 class="event-guide-page__title">FlowStudio · 事件系统使用指南</h1>
      <el-button type="primary" plain @click="backToDesigner">返回设计器</el-button>
    </header>
    <main class="event-guide-page__main markdown-body" v-html="html" />
  </div>
</template>
