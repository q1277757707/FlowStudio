<script setup lang="ts">
import { computed } from 'vue';
import Draggable from 'vuedraggable';
import type { FormProps } from 'element-plus';
import { ElMessage } from 'element-plus';
import type { LowCodeNode } from '@designer-core/schema';
import { isAllowedFormChild } from '@designer-materials/dragRules';
import { useRendererRuntime } from '../composables/useRendererRuntime';
import type { DraggableChangeEvent, RendererMode } from '../types';
import RendererList from './RendererList.vue';
import { useDragMove } from '../composables/useDragMove';

const props = defineProps<{
  mode: RendererMode;
  node: LowCodeNode;
  selectedId: string;
}>();

const runtime = useRendererRuntime();
const { checkMove, dragGroup } = useDragMove('form');

const labelPosition = computed(() => {
  const value = runtime.readString(props.node, 'labelPosition', 'right');
  return value === 'left' || value === 'top' ? value : 'right';
});

function onFormChildChange(event: DraggableChangeEvent<LowCodeNode>) {
  if (event.added) {
    const child = event.added.element;

    if (!isAllowedFormChild(child.type)) {
      const children = runtime.ensureChildren(props.node);
      const index = children.findIndex((item) => item.id === child.id);

      if (index >= 0) {
        children.splice(index, 1);
      }

      ElMessage.warning('表单内不可嵌套表单，可放置字段、容器、按钮或文本');
      return;
    }
  }

  runtime.onChildChange(event);
}
</script>

<template>
  <el-form
    class="render-form"
    :model="mode === 'preview' ? runtime.formModel : undefined"
    :label-width="runtime.readNumber(node, 'labelWidth', 120)"
    :label-position="labelPosition as FormProps['labelPosition']"
  >
    <Draggable
      v-if="mode === 'edit'"
      :list="runtime.ensureChildren(node)"
      class="nested-drop-zone"
      data-drop-zone="form"
      :class="{ 'is-empty': !node.children?.length }"
      :group="dragGroup"
      item-key="id"
      :move="checkMove"
      @change="onFormChildChange"
    >
      <template #item="{ element }">
        <RendererList :nodes="[element]" :mode="mode" :selected-id="selectedId" />
      </template>
      <template #footer>
        <div v-if="!node.children?.length" class="nested-drop-zone__placeholder">可拖入字段、容器、按钮或文本</div>
      </template>
    </Draggable>

    <RendererList
      v-else-if="node.children?.length"
      :nodes="node.children"
      :mode="mode"
      :selected-id="selectedId"
    />
  </el-form>
</template>
