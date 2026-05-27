import { ref, watch } from 'vue';

export interface WorkflowPageMeta {
  pageId?: string;
  pageName?: string;
}

export const workflowPageMeta = ref<WorkflowPageMeta>({});

/** 由 app-designer 注入页面元信息，避免 workflow 包依赖表单设计 store */
export function bindWorkflowPageMeta(getMeta: () => WorkflowPageMeta) {
  watch(getMeta, (meta) => {
    workflowPageMeta.value = meta;
  }, { immediate: true, deep: true });
}
