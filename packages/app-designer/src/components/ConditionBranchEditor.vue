<script setup lang="ts">
import { ref } from 'vue';
import { Delete, Plus } from '@element-plus/icons-vue';
import { createActionId } from '@designer-core/id';
import type { EventAction, EventActionType } from '@designer-core/schema';
import { getActionMeta, visualActionConfigTypes } from '../constants/eventActions';
import NestedActionConfigForm from './NestedActionConfigForm.vue';

const props = defineProps<{
  modelValue: Record<string, unknown>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>];
}>();

type BranchKey = 'trueActions' | 'falseActions';

const selectedNested = ref<{ branch: BranchKey; id: string } | null>(null);

const branches: { key: BranchKey; title: string; hint: string }[] = [
  {
    key: 'trueActions',
    title: '条件成立时执行',
    hint: '表达式结果为 true 时，按顺序执行以下动作'
  },
  {
    key: 'falseActions',
    title: '条件不成立时执行',
    hint:
      '表达式为 false 时执行。若 true 分支曾用接口更新下拉选项，可在此添加「组件赋值」：目标选同一下拉，表达式填 [] 清空选项与选中值'
  }
];

function expressionModel() {
  const value = props.modelValue.expression;
  return typeof value === 'string' ? value : '';
}

function updateExpression(value: string) {
  emitPatch({ expression: value });
}

function emitPatch(patch: Record<string, unknown>) {
  emit('update:modelValue', {
    ...props.modelValue,
    ...patch
  });
}

function readBranch(key: BranchKey): EventAction[] {
  const list = props.modelValue[key];
  return Array.isArray(list) ? (list as EventAction[]) : [];
}

function updateBranch(key: BranchKey, actions: EventAction[]) {
  emitPatch({ [key]: actions });
}

function addNested(branch: BranchKey, type: EventActionType) {
  const meta = getActionMeta(type);

  if (!meta) {
    return;
  }

  const next = [
    ...readBranch(branch),
    {
      id: createActionId(),
      action: type,
      type,
      config: JSON.parse(JSON.stringify(meta.defaultConfig))
    }
  ];

  updateBranch(branch, next);
  const created = next[next.length - 1];
  if (created.id) {
    selectedNested.value = { branch, id: created.id };
  }
}

function removeNested(branch: BranchKey, actionId: string) {
  updateBranch(
    branch,
    readBranch(branch).filter((item) => item.id !== actionId)
  );

  if (selectedNested.value?.branch === branch && selectedNested.value.id === actionId) {
    selectedNested.value = null;
  }
}

function updateNestedConfig(branch: BranchKey, actionId: string, config: Record<string, unknown>) {
  updateBranch(
    branch,
    readBranch(branch).map((item) => (item.id === actionId ? { ...item, config } : item))
  );
}

function isNestedSelected(branch: BranchKey, actionId?: string) {
  return Boolean(actionId && selectedNested.value?.branch === branch && selectedNested.value.id === actionId);
}

function selectNested(branch: BranchKey, actionId: string) {
  selectedNested.value = { branch, id: actionId };
}

function nestedAction(branch: BranchKey, actionId: string) {
  return readBranch(branch).find((item) => item.id === actionId);
}
</script>

<template>
  <div class="condition-branch">
    <el-form label-position="top" class="condition-branch__expression">
      <el-form-item label="条件表达式">
        <el-input
          :model-value="expressionModel()"
          placeholder="例如 {{event.value}} === 'A' 或 {{form['input_001']}}"
          @update:model-value="updateExpression"
        />
        <p class="condition-branch__hint">
          支持 form['节点ID']、event.value、variables.xxx 等，请用双花括号包裹，如 &#123;&#123;event.value&#125;&#125; === 'A'
        </p>
      </el-form-item>
    </el-form>

    <section v-for="branch in branches" :key="branch.key" class="condition-branch__section">
      <div class="condition-branch__section-head">
        <div>
          <div class="condition-branch__section-title">{{ branch.title }}</div>
          <p class="condition-branch__hint">{{ branch.hint }}</p>
        </div>
        <el-dropdown trigger="click" @command="(type: EventActionType) => addNested(branch.key, type)">
          <el-button size="small" type="primary" plain :icon="Plus">添加动作</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="meta in visualActionConfigTypes"
                :key="meta.type"
                :command="meta.type"
              >
                {{ meta.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <el-empty
        v-if="!readBranch(branch.key).length"
        description="暂无动作，点击「添加动作」"
        :image-size="40"
      />

      <div v-else class="condition-branch__list">
        <div
          v-for="(action, index) in readBranch(branch.key)"
          :key="action.id"
          class="condition-branch__item"
        >
          <div
            class="condition-branch__card"
            :class="{ 'is-selected': isNestedSelected(branch.key, action.id) }"
            @click="action.id && selectNested(branch.key, action.id)"
          >
            <div class="condition-branch__card-head">
              <span class="condition-branch__card-index">{{ index + 1 }}</span>
              <span class="condition-branch__card-label">
                {{ getActionMeta(action.type ?? action.action)?.label ?? action.action }}
              </span>
              <el-button
                :icon="Delete"
                text
                type="danger"
                @click.stop="action.id && removeNested(branch.key, action.id)"
              />
            </div>
          </div>

          <div
            v-if="action.id && isNestedSelected(branch.key, action.id)"
            class="condition-branch__detail"
          >
            <NestedActionConfigForm
              v-if="nestedAction(branch.key, action.id)"
              :action="nestedAction(branch.key, action.id)!"
              @update="updateNestedConfig(branch.key, action.id, $event)"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
