<script setup lang="ts">

import { computed, ref } from 'vue';

import { Delete, Plus } from '@element-plus/icons-vue';

import {

  buildFormAssignments,

  readFormAssignmentRows,

  type FormAssignmentRow

} from '../utils/formAssignmentConfig';

import { collectCanvasFields } from '../utils/formFields';

import { useDesignerStore } from '../store/designer';



const DEFAULT_USAGE_HINT =
  '在「赋值表达式」中填写 {{variables.lastResponse.data.xxx}}，xxx 为接口返回里的字段名。' +
  '下拉 / 单选 / 多选：{{variables.lastResponse.data.list}}（{ label, value }[]）更新选项；' +
  '{{variables.lastResponse.data.list[0].value}} 设置选中值；填 [] 或 {{[]}} 清空选项与选中。其它组件写标量或对应字段。';



const props = defineProps<{

  assignments: unknown;

  title?: string;

  hint?: string;

}>();



const emit = defineEmits<{

  'update:assignments': [value: Array<{ componentId: string; value: string }>];

}>();



const designer = useDesignerStore();

const activeRowIndex = ref(0);



const rows = computed(() => readFormAssignmentRows(props.assignments));



const canvasFields = computed(() => collectCanvasFields(designer.schema.components));



const displayHint = computed(() => props.hint?.trim() || DEFAULT_USAGE_HINT);



function emitRows(nextRows: FormAssignmentRow[]) {

  emit('update:assignments', buildFormAssignments(nextRows));

}



function updateRow(index: number, field: keyof FormAssignmentRow, value: string) {

  activeRowIndex.value = index;

  const next = rows.value.map((row, i) => (i === index ? { ...row, [field]: value } : row));

  emitRows(next);

}



function addRow() {

  emitRows([...rows.value, { componentId: '', value: '' }]);

  activeRowIndex.value = rows.value.length;

}



function removeRow(index: number) {

  if (rows.value.length <= 1) {

    emitRows([{ componentId: '', value: '' }]);

    activeRowIndex.value = 0;

    return;

  }



  emitRows(rows.value.filter((_, i) => i !== index));

  activeRowIndex.value = Math.max(0, index - 1);

}

</script>



<template>

  <div class="form-assignment-editor">

    <div v-if="title" class="form-assignment-editor__head">

      <span class="form-assignment-editor__title">{{ title }}</span>

    </div>

    <p class="form-assignment-editor__hint">{{ displayHint }}</p>



    <div

      v-for="(row, index) in rows"

      :key="index"

      class="set-variable-form__row form-assignment-editor__row"

      :class="{ 'is-active': activeRowIndex === index }"

      @click="activeRowIndex = index"

    >

      <el-form-item label="目标组件" class="set-variable-form__field">

        <el-select

          :model-value="row.componentId"

          filterable

          placeholder="选择要赋值的字段"

          @update:model-value="updateRow(index, 'componentId', $event)"

        >

          <el-option

            v-for="field in canvasFields"

            :key="field.id"

            :label="`${field.label} (${field.id})`"

            :value="field.id"

          />

        </el-select>

      </el-form-item>

      <el-form-item label="赋值表达式" class="set-variable-form__field">

        <el-input

          :model-value="row.value"

          placeholder="如 {{variables.lastResponse.data.list}}"

          @update:model-value="updateRow(index, 'value', $event)"

          @focus="activeRowIndex = index"

        />

      </el-form-item>

      <el-button

        class="set-variable-form__remove"

        :icon="Delete"

        text

        type="danger"

        @click.stop="removeRow(index)"

      />

    </div>



    <el-button size="small" plain :icon="Plus" @click="addRow">添加赋值</el-button>

  </div>

</template>


