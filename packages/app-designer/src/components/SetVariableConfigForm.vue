<script setup lang="ts">
import { computed } from 'vue';
import { Delete, Plus } from '@element-plus/icons-vue';
import type { EventAction } from '@designer-core/schema';
import { readSetVariableEntries } from '@designer-event/index';

interface VariableRow {
  key: string;
  value: string;
}

const props = defineProps<{
  action: EventAction;
}>();

const emit = defineEmits<{
  update: [config: Record<string, unknown>];
}>();

const rows = computed(() => {
  const entries = readSetVariableEntries(props.action.config ?? {});

  if (!entries.length) {
    return [{ key: '', value: '' }];
  }

  return entries.map((entry) => ({
    key: entry.key,
    value: typeof entry.value === 'string' ? entry.value : String(entry.value ?? '')
  }));
});

function emitRows(nextRows: VariableRow[]) {
  const variables = nextRows
    .map((row) => ({
      key: row.key.trim(),
      value: row.value
    }))
    .filter((row) => row.key);

  emit('update', {
    variables
  });
}

function updateRow(index: number, field: keyof VariableRow, value: string) {
  const next = rows.value.map((row, i) => (i === index ? { ...row, [field]: value } : row));
  emitRows(next);
}

function addRow() {
  emitRows([...rows.value, { key: '', value: '' }]);
}

function removeRow(index: number) {
  if (rows.value.length <= 1) {
    emitRows([{ key: '', value: '' }]);
    return;
  }

  emitRows(rows.value.filter((_, i) => i !== index));
}
</script>

<template>
  <div class="set-variable-form">
    <div v-for="(row, index) in rows" :key="index" class="set-variable-form__row">
      <el-form-item label="变量名" class="set-variable-form__field">
        <el-input
          :model-value="row.key"
          placeholder="例如 userName"
          @update:model-value="updateRow(index, 'key', $event)"
        />
      </el-form-item>
      <el-form-item label="变量值" class="set-variable-form__field">
        <el-input
          :model-value="row.value"
          placeholder="例如 {{event.value}}"
          @update:model-value="updateRow(index, 'value', $event)"
        />
      </el-form-item>
      <el-button
        class="set-variable-form__remove"
        :icon="Delete"
        text
        type="danger"
        :disabled="rows.length <= 1 && !row.key && !row.value"
        @click="removeRow(index)"
      />
    </div>

    <el-button size="small" plain :icon="Plus" @click="addRow">添加变量</el-button>
  </div>
</template>
