import { ref, watch } from 'vue';

export interface WorkflowFormFieldOption {
  value: string;
  label: string;
}

export const workflowFormFields = ref<WorkflowFormFieldOption[]>([]);

/** 由 app-designer 注入表单组件树并收集字段，供条件分支选择变量 */
export function bindWorkflowFormFields<T>(
  getComponents: () => T[],
  collect: (components: T[]) => WorkflowFormFieldOption[]
) {
  watch(getComponents, (nodes) => {
    workflowFormFields.value = collect(nodes);
  }, { immediate: true, deep: true });
}
