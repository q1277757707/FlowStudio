<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Delete, Document, Plus } from '@element-plus/icons-vue';
import { getMaterialByType } from '@designer-materials/index';
import type { EventActionType } from '@designer-core/schema';
import { actionTypeList, getActionMeta, supportsVisualActionConfig } from '../constants/eventActions';
import { useDesignerStore } from '../store/designer';
import { openEventGuideDoc } from '../utils/openEventGuideDoc';
import ConditionBranchEditor from './ConditionBranchEditor.vue';
import NestedActionConfigForm from './NestedActionConfigForm.vue';

const designer = useDesignerStore();
const bottomTab = ref('events');
const selectedEvent = ref('change');
const selectedActionId = ref('');
const configDraft = ref('');
const configParseError = ref('');

const materialEvents = computed(() => {
  if (!designer.selectedNode) {
    return [];
  }

  return getMaterialByType(designer.selectedNode.type)?.events ?? [];
});

const currentActions = computed(() => designer.getEventActions(selectedEvent.value));

const selectedAction = computed(() =>
  currentActions.value.find((item) => item.id === selectedActionId.value)
);

const selectedActionMeta = computed(() => {
  if (!selectedAction.value) {
    return undefined;
  }

  const type = selectedAction.value.type ?? selectedAction.value.action;
  return getActionMeta(type);
});

const isConditionAction = computed(() => selectedActionMeta.value?.type === 'condition');

const hasVisualConfig = computed(() =>
  supportsVisualActionConfig(selectedActionMeta.value?.type)
);

const showJsonEditorPrimary = computed(
  () => selectedAction.value && !isConditionAction.value && !hasVisualConfig.value
);

const advancedJsonCollapse = ref<string[]>([]);

function onConditionConfigUpdate(config: Record<string, unknown>) {
  if (!selectedAction.value?.id) {
    return;
  }

  designer.updateEventConfig(selectedEvent.value, selectedAction.value.id, config);
  configDraft.value = formatConfigJson(config);
  configParseError.value = '';
}

function formatConfigJson(config: Record<string, unknown> | undefined) {
  return JSON.stringify(config ?? {}, null, 2);
}

function syncConfigDraft() {
  configDraft.value = formatConfigJson(selectedAction.value?.config as Record<string, unknown>);
  configParseError.value = '';
}

function trySaveConfigDraft() {
  if (!selectedAction.value?.id) {
    return false;
  }

  try {
    const parsed = JSON.parse(configDraft.value) as Record<string, unknown>;
    designer.updateEventConfig(selectedEvent.value, selectedAction.value.id, parsed);
    configParseError.value = '';
    return true;
  } catch {
    configParseError.value = 'JSON 格式不正确，已保留编辑内容，修正后失焦或点击「应用 JSON」';
    return false;
  }
}

function patchActionConfig(patch: Record<string, unknown>) {
  if (!selectedAction.value?.id) {
    return;
  }

  const next = {
    ...(selectedAction.value.config ?? {}),
    ...patch
  };

  designer.updateEventConfig(selectedEvent.value, selectedAction.value.id, next);
  configDraft.value = formatConfigJson(next);
  configParseError.value = '';
}

let saveConfigTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleSaveConfigDraft() {
  if (saveConfigTimer) {
    clearTimeout(saveConfigTimer);
  }

  saveConfigTimer = setTimeout(() => {
    trySaveConfigDraft();
  }, 400);
}

function onConfigDraftBlur() {
  trySaveConfigDraft();
}

watch(
  () => designer.selectedId,
  () => {
    const events = materialEvents.value;
    selectedEvent.value = events[0] ?? 'change';
    selectedActionId.value = '';
  }
);

watch(currentActions, (actions) => {
  if (!actions.length) {
    selectedActionId.value = '';
    return;
  }

  if (!actions.some((item) => item.id === selectedActionId.value)) {
    selectedActionId.value = actions[0]?.id ?? '';
  }
});

watch([selectedActionId, selectedEvent], () => {
  syncConfigDraft();
});

function addAction(type: EventActionType) {
  designer.addEventAction(selectedEvent.value, type);
}

function removeAction(actionId: string) {
  designer.removeEventAction(selectedEvent.value, actionId);
}
</script>

<template>
  <section class="event-panel">
    <el-tabs v-model="bottomTab" class="event-panel__tabs">
      <el-tab-pane label="事件配置" name="events" />
      <el-tab-pane label="变量" name="variable" />
      <el-tab-pane label="数据源" name="datasource" />
      <el-tab-pane label="页面设置" name="page" />
    </el-tabs>

    <div v-if="bottomTab === 'events'" class="event-panel__body">
      <div class="event-panel__triggers">
        <div class="event-panel__section-title">触发事件</div>
        <el-empty v-if="!designer.selectedNode" description="请选择组件" :image-size="32" />
        <ul v-else class="event-trigger-list">
          <li
            v-for="event in materialEvents"
            :key="event"
            class="event-trigger-item"
            :class="{ 'is-active': selectedEvent === event }"
            @click="selectedEvent = event"
          >
            {{ event }}
          </li>
        </ul>
      </div>

      <div class="event-panel__actions">
        <div class="event-panel__section-head">
          <div class="event-panel__section-title">动作列表</div>
          <div class="event-panel__section-tools">
            <el-button
              class="action-doc-btn"
              :icon="Document"
              text
              type="primary"
              @click="openEventGuideDoc"
            >
              使用文档
            </el-button>
            <el-dropdown
              v-if="designer.selectedNode"
              trigger="click"
              @command="addAction"
            >
              <el-button class="action-add-btn" :icon="Plus" text type="primary">添加动作</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="meta in actionTypeList"
                    :key="meta.type"
                    :command="meta.type"
                  >
                    {{ meta.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="event-panel__actions-scroll">
          <el-empty
            v-if="!designer.selectedNode"
            description="请选择画布组件以配置事件"
            :image-size="32"
          />

          <template v-else>
            <div v-if="currentActions.length" class="action-flow">
              <div
                v-for="(action, index) in currentActions"
                :key="action.id"
                class="action-flow__item"
              >
                <div
                  class="action-card"
                  :class="{ 'is-selected': selectedActionId === action.id }"
                  @click="selectedActionId = action.id ?? ''"
                >
                  <div class="action-card__head">
                    <span class="action-card__type">
                      {{ getActionMeta(action.type ?? action.action)?.label ?? action.action }}
                    </span>
                    <el-button
                      :icon="Delete"
                      text
                      type="danger"
                      @click.stop="action.id && removeAction(action.id)"
                    />
                  </div>
                  <div class="action-card__detail">{{ action.id }}</div>
                </div>
                <span v-if="index < currentActions.length - 1" class="action-flow__arrow">→</span>
              </div>
            </div>

            <el-empty v-else description="暂无动作，请点击上方添加" :image-size="32" />

            <div v-if="selectedAction" class="action-config">
            <div class="event-panel__section-title">
              动作配置 · {{ selectedActionMeta?.label }}
            </div>
            <p class="action-config__desc">{{ selectedActionMeta?.description }}</p>

            <ConditionBranchEditor
              v-if="isConditionAction"
              :model-value="(selectedAction.config ?? {}) as Record<string, unknown>"
              @update:model-value="onConditionConfigUpdate"
            />

            <NestedActionConfigForm
              v-else-if="hasVisualConfig"
              :action="selectedAction"
              @update="patchActionConfig"
            />

            <template v-else-if="showJsonEditorPrimary">
              <div class="action-config__json-head">
                <span class="action-config__json-label">动作配置（JSON）</span>
                <el-button size="small" plain @click="trySaveConfigDraft">应用 JSON</el-button>
              </div>
              <el-input
                v-model="configDraft"
                type="textarea"
                :rows="8"
                class="action-config__editor"
                @input="scheduleSaveConfigDraft"
                @blur="onConfigDraftBlur"
              />
              <p v-if="configParseError" class="action-config__error">{{ configParseError }}</p>
              <p v-else class="action-config__hint">
                可直接编辑；合法 JSON 会在停顿后自动保存，或失焦 / 点击「应用 JSON」保存。
              </p>
            </template>

            <el-collapse
              v-if="isConditionAction || hasVisualConfig"
              v-model="advancedJsonCollapse"
              class="action-config__advanced"
            >
              <el-collapse-item title="高级：JSON 编辑" name="json">
                <div class="action-config__json-head">
                  <el-button size="small" plain @click="trySaveConfigDraft">应用 JSON</el-button>
                </div>
                <el-input
                  v-model="configDraft"
                  type="textarea"
                  :rows="8"
                  class="action-config__editor"
                  @blur="onConfigDraftBlur"
                />
                <p v-if="configParseError" class="action-config__error">{{ configParseError }}</p>
              </el-collapse-item>
            </el-collapse>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-else-if="bottomTab === 'variable'" class="event-panel__placeholder">
      <el-text type="info">页面变量可在预览态通过「设置变量」动作写入，表达式使用 variables.xxx。</el-text>
    </div>

    <div v-else class="event-panel__placeholder">
      <el-text type="info">该功能将在后续版本接入。</el-text>
    </div>
  </section>
</template>
