<script setup lang="ts">
import { computed, ref } from 'vue';
import { Delete, Plus } from '@element-plus/icons-vue';
import type { EventAction } from '@designer-core/schema';
import { buildRequestParams, readRequestParamRows, type RequestParamRow } from '../utils/requestConfig';
import { collectCanvasFields } from '../utils/formFields';
import { useDesignerStore } from '../store/designer';
import FormAssignmentEditor from './FormAssignmentEditor.vue';

const props = defineProps<{
  action: EventAction;
}>();

const emit = defineEmits<{
  update: [config: Record<string, unknown>];
}>();

const designer = useDesignerStore();
const activeRowIndex = ref(0);

const config = () => props.action.config ?? {};

function cfgString(key: string, fallback = '') {
  const value = config()[key];
  return typeof value === 'string' ? value : fallback;
}

const paramRows = computed(() => readRequestParamRows(config().params));

const canvasFields = computed(() => collectCanvasFields(designer.schema.components));

const selectedField = computed(() =>
  canvasFields.value.find((item) => item.id === designer.selectedId)
);

function emitConfig(patch: Record<string, unknown>) {
  emit('update', {
    ...config(),
    ...patch
  });
}

function emitParamRows(rows: RequestParamRow[]) {
  emitConfig({ params: buildRequestParams(rows) });
}

function updateParamRow(index: number, field: keyof RequestParamRow, value: string) {
  activeRowIndex.value = index;
  const next = paramRows.value.map((row, i) => (i === index ? { ...row, [field]: value } : row));
  emitParamRows(next);
}

function addParamRow() {
  emitParamRows([...paramRows.value, { key: '', value: '' }]);
  activeRowIndex.value = paramRows.value.length;
}

function removeParamRow(index: number) {
  if (paramRows.value.length <= 1) {
    emitParamRows([{ key: '', value: '' }]);
    activeRowIndex.value = 0;
    return;
  }

  emitParamRows(paramRows.value.filter((_, i) => i !== index));
  activeRowIndex.value = Math.max(0, index - 1);
}

function applyValueTemplate(template: string, index = activeRowIndex.value) {
  const rows = paramRows.value.map((row, i) =>
    i === index ? { ...row, value: template } : row
  );
  emitParamRows(rows);
}

function insertFieldValue(fieldId: string, index = activeRowIndex.value) {
  applyValueTemplate(`{{form['${fieldId}']}}`, index);
}

function onPickField(fieldId: string) {
  const rows = [...paramRows.value];
  const index = activeRowIndex.value;
  const row = rows[index] ?? { key: '', value: '' };

  rows[index] = {
    key: row.key || fieldId,
    value: `{{form['${fieldId}']}}`
  };

  emitParamRows(rows);
}
</script>

<template>
  <div class="request-config-form">
    <el-form-item label="接口地址">
      <el-input :model-value="cfgString('url')" @update:model-value="emitConfig({ url: $event })" />
    </el-form-item>

    <el-form-item label="请求方式">
      <el-select
        :model-value="cfgString('method', 'GET')"
        @update:model-value="emitConfig({ method: $event })"
      >
        <el-option label="GET" value="GET" />
        <el-option label="POST" value="POST" />
      </el-select>
    </el-form-item>

    <div class="request-config-form__params-head">
      <span class="request-config-form__params-title">请求参数</span>
      <span class="request-config-form__params-tip">GET 为 query，POST 为 JSON body</span>
    </div>

    <div class="request-config-form__quick">
      <span class="request-config-form__quick-label">快速填入参数值：</span>
      <el-button size="small" plain @click="applyValueTemplate('{{event.value}}')">
        当前事件值
      </el-button>
      <el-button
        v-if="selectedField"
        size="small"
        plain
        @click="insertFieldValue(selectedField.id)"
      >
        当前选中：{{ selectedField.label }}
      </el-button>
      <el-select
        v-if="canvasFields.length"
        size="small"
        placeholder="选择画布字段"
        class="request-config-form__field-select"
        @change="onPickField($event)"
      >
        <el-option
          v-for="field in canvasFields"
          :key="field.id"
          :label="`${field.label} (${field.id})`"
          :value="field.id"
        />
      </el-select>
    </div>

    <div
      v-for="(row, index) in paramRows"
      :key="index"
      class="set-variable-form__row"
      :class="{ 'is-active': activeRowIndex === index }"
      @click="activeRowIndex = index"
    >
      <el-form-item label="参数名" class="set-variable-form__field">
        <el-input
          :model-value="row.key"
          placeholder="例如 keyword"
          @update:model-value="updateParamRow(index, 'key', $event)"
        />
      </el-form-item>
      <el-form-item label="参数值" class="set-variable-form__field">
        <el-input
          :model-value="row.value"
          placeholder="例如 {{event.value}}"
          @update:model-value="updateParamRow(index, 'value', $event)"
          @focus="activeRowIndex = index"
        />
      </el-form-item>
      <el-button
        class="set-variable-form__remove"
        :icon="Delete"
        text
        type="danger"
        @click.stop="removeParamRow(index)"
      />
    </div>

    <el-button size="small" plain :icon="Plus" @click="addParamRow">添加参数</el-button>

    <FormAssignmentEditor
      class="request-config-form__assign"
      :assignments="config().assignments"
      title="请求成功后给组件赋值"
      @update:assignments="emitConfig({ assignments: $event })"
    />
  </div>
</template>
