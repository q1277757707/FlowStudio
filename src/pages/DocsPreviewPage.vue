<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { parseMarkdownWithDocLinks } from '../utils/markdownPreview';

const docModules = import.meta.glob('../../docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

const docMap = new Map<string, string>();

for (const [filePath, content] of Object.entries(docModules)) {
  const docPath = filePath.replace(/^\.\.\/\.\.\/docs\//, '');
  docMap.set(docPath, content);
}

const docList = [...docMap.keys()].sort((a, b) => a.localeCompare(b, 'zh-CN'));

function readDocFromUrl(): string {
  const param = new URLSearchParams(window.location.search).get('doc');
  if (param && docMap.has(param)) {
    return param;
  }
  if (docMap.has('README.md')) {
    return 'README.md';
  }
  return docList[0] ?? '';
}

const currentDoc = ref(readDocFromUrl());

const html = computed(() => {
  const raw = docMap.get(currentDoc.value);
  if (!raw) {
    return '<p>文档不存在</p>';
  }
  return parseMarkdownWithDocLinks(raw, currentDoc.value);
});

const currentTitle = computed(() => currentDoc.value.replace(/\.md$/i, ''));

function setDoc(path: string) {
  if (!docMap.has(path)) {
    return;
  }
  currentDoc.value = path;
  const url = new URL(window.location.href);
  url.searchParams.set('doc', path);
  window.history.pushState({ doc: path }, '', url);
}

function onPopState() {
  currentDoc.value = readDocFromUrl();
}

function docFromPreviewLink(href: string): string | null {
  try {
    return new URL(href, window.location.origin).searchParams.get('doc');
  } catch {
    return null;
  }
}

function onMarkdownClick(event: MouseEvent) {
  const target = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-doc-link]');
  if (!target?.href) {
    return;
  }
  event.preventDefault();
  const doc = docFromPreviewLink(target.href);
  if (doc) {
    setDoc(doc);
  }
}

function backToDesigner() {
  window.location.href = import.meta.env.BASE_URL;
}

watch(currentDoc, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

onMounted(() => {
  window.addEventListener('popstate', onPopState);
});

onUnmounted(() => {
  window.removeEventListener('popstate', onPopState);
});
</script>

<template>
  <div class="docs-preview-page">
    <header class="docs-preview-page__header">
      <h1 class="docs-preview-page__title">FlowStudio · 文档预览</h1>
      <el-button type="primary" plain @click="backToDesigner">返回设计器</el-button>
    </header>

    <div class="docs-preview-page__body">
      <aside class="docs-preview-page__sidebar">
        <div class="docs-preview-page__sidebar-title">docs/</div>
        <el-scrollbar class="docs-preview-page__nav-scroll">
          <button
            v-for="path in docList"
            :key="path"
            type="button"
            class="docs-preview-page__nav-item"
            :class="{ 'is-active': path === currentDoc }"
            @click="setDoc(path)"
          >
            {{ path }}
          </button>
        </el-scrollbar>
      </aside>

      <main class="docs-preview-page__main">
        <h2 class="docs-preview-page__doc-title">{{ currentTitle }}</h2>
        <article
          class="markdown-body"
          v-html="html"
          @click="onMarkdownClick"
        />
      </main>
    </div>
  </div>
</template>
