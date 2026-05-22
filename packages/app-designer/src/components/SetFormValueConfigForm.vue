<script setup lang="ts">
import type { EventAction } from '@designer-core/schema';
import FormAssignmentEditor from './FormAssignmentEditor.vue';

const props = defineProps<{
  action: EventAction;
}>();

const emit = defineEmits<{
  update: [config: Record<string, unknown>];
}>();

function onAssignmentsUpdate(assignments: Array<{ componentId: string; value: string }>) {
  emit('update', {
    ...(props.action.config ?? {}),
    assignments
  });
}
</script>

<template>
  <FormAssignmentEditor
    :assignments="action.config?.assignments"
    @update:assignments="onAssignmentsUpdate"
  />
</template>
