<script setup lang="ts">
import { computed, ref } from 'vue';
import { Delete, EditPen, Plus } from '@element-plus/icons-vue';
import type { WorkflowConditionGroupDraft } from '@designer-core/workflow';
import {
  CONDITION_FIELD_PRESETS,
  CONDITION_OPERATORS,
  createEmptyConditionGroup,
  createEmptyConditionRule,
  normalizeConditionGroups
} from '../flow-beeflow/condition';
import type { BeeflowConditionGroup } from '../flow-beeflow/types';
import { useDesignerStore } from '../store/designer';

const props = defineProps<{
  groups: WorkflowConditionGroupDraft[];
  branchLabel: string;
}>();

const emit = defineEmits<{
  'update:groups': [value: WorkflowConditionGroupDraft[]];
  'update:branchLabel': [value: string];
}>();

const designer = useDesignerStore();
const editingTitle = ref(false);
const titleDraft = ref('');

const normalizedGroups = computed(() =>
  normalizeConditionGroups(props.groups as BeeflowConditionGroup[])
);

const fieldOptions = computed(() => {
  const formFields: Array<{ value: string; label: string }> = [];
  const walk = (nodes: typeof designer.schema.components) => {
    for (const node of nodes) {
      const rawLabel = node.props?.label;
      const label = typeof rawLabel === 'string' && rawLabel.trim() ? rawLabel : node.type;
      if (node.id) formFields.push({ value: node.id, label });
      if (node.children?.length) walk(node.children);
    }
  };
  walk(designer.schema.components);
  return [...CONDITION_FIELD_PRESETS, ...formFields];
});

function emitGroups(groups: BeeflowConditionGroup[]) {
  emit('update:groups', groups as WorkflowConditionGroupDraft[]);
}

function patchGroups(mutator: (groups: BeeflowConditionGroup[]) => void) {
  const next = normalizeConditionGroups(props.groups as BeeflowConditionGroup[]).map((group) => ({
    ...group,
    conditions: group.conditions.map((rule) => ({ ...rule }))
  }));
  mutator(next);
  emitGroups(next);
}

function addRule(groupIndex: number) {
  patchGroups((groups) => {
    groups[groupIndex]?.conditions.push(createEmptyConditionRule());
  });
}

function removeRule(groupIndex: number, ruleIndex: number) {
  patchGroups((groups) => {
    const group = groups[groupIndex];
    if (!group || group.conditions.length <= 1) return;
    group.conditions.splice(ruleIndex, 1);
  });
}

function updateRule(
  groupIndex: number,
  ruleIndex: number,
  patch: Partial<{ varName: string; operator: number; val: string }>
) {
  patchGroups((groups) => {
    const rule = groups[groupIndex]?.conditions[ruleIndex];
    if (!rule) return;
    Object.assign(rule, patch);
  });
}

function addGroup() {
  patchGroups((groups) => {
    groups.push(createEmptyConditionGroup());
  });
}

function removeGroup(groupIndex: number) {
  patchGroups((groups) => {
    if (groups.length <= 1) return;
    groups.splice(groupIndex, 1);
  });
}

function startEditTitle() {
  titleDraft.value = props.branchLabel;
  editingTitle.value = true;
}

function commitTitle() {
  editingTitle.value = false;
  const next = titleDraft.value.trim() || props.branchLabel;
  emit('update:branchLabel', next);
}

function ruleLogicLabel(ruleIndex: number) {
  return ruleIndex === 0 ? '当' : '且';
}
</script>

<template>
  <div class="workflow-condition-editor">
    <header class="workflow-condition-editor__header">
      <div class="workflow-condition-editor__title-row">
        <template v-if="editingTitle">
          <el-input
            v-model="titleDraft"
            size="small"
            maxlength="16"
            class="workflow-condition-editor__title-input"
            @blur="commitTitle"
            @keyup.enter="commitTitle"
          />
        </template>
        <template v-else>
          <h3 class="workflow-condition-editor__title">{{ branchLabel }}</h3>
          <el-button :icon="EditPen" text class="workflow-condition-editor__title-edit" @click="startEditTitle" />
        </template>
      </div>
      <p class="workflow-condition-editor__subtitle">满足以下条件时进入当前分支</p>
    </header>

    <template v-for="(group, groupIndex) in normalizedGroups" :key="group.id ?? groupIndex">
      <p v-if="groupIndex > 0" class="workflow-condition-editor__or">或</p>

      <section class="workflow-condition-group">
        <div class="workflow-condition-group__head">
          <span class="workflow-condition-group__name">条件组 {{ groupIndex + 1 }}</span>
          <el-button
            v-if="normalizedGroups.length > 1"
            :icon="Delete"
            text
            class="workflow-condition-group__delete"
            @click="removeGroup(groupIndex)"
          />
        </div>

        <div class="workflow-condition-group__body">
          <div
            v-for="(rule, ruleIndex) in group.conditions"
            :key="rule.id ?? ruleIndex"
            class="workflow-condition-rule"
          >
            <span class="workflow-condition-rule__logic">{{ ruleLogicLabel(ruleIndex) }}</span>

            <div class="workflow-condition-rule__main">
              <el-button
                v-if="group.conditions.length > 1"
                :icon="Delete"
                text
                class="workflow-condition-rule__delete"
                @click="removeRule(groupIndex, ruleIndex)"
              />

              <el-select
                :model-value="rule.varName"
                class="workflow-condition-rule__control"
                placeholder="选择字段"
                @update:model-value="updateRule(groupIndex, ruleIndex, { varName: String($event) })"
              >
                <el-option
                  v-for="opt in fieldOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>

              <el-select
                :model-value="rule.operator"
                class="workflow-condition-rule__control"
                placeholder="运算符"
                @update:model-value="updateRule(groupIndex, ruleIndex, { operator: Number($event) })"
              >
                <el-option
                  v-for="opt in CONDITION_OPERATORS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>

              <el-input
                :model-value="rule.val"
                class="workflow-condition-rule__control workflow-condition-rule__control--input"
                placeholder="请输入"
                @update:model-value="updateRule(groupIndex, ruleIndex, { val: String($event) })"
              />
            </div>
          </div>

          <button type="button" class="workflow-condition-group__add-rule" @click="addRule(groupIndex)">
            <el-icon><Plus /></el-icon>
            添加条件
          </button>
        </div>
      </section>
    </template>

    <button type="button" class="workflow-condition-editor__add-group" @click="addGroup">
      <el-icon><Plus /></el-icon>
      添加条件组
    </button>
  </div>
</template>
