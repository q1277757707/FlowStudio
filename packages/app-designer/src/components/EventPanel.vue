<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Delete, Document, Plus } from '@element-plus/icons-vue';
import { getMaterialByType } from '@designer-materials/index';
import type { EventActionType } from '@designer-core/schema';
import { actionTypeList, getActionMeta } from '../constants/eventActions';
import { useDesignerStore } from '../store/designer';
import { openEventGuideDoc } from '../utils/openEventGuideDoc';

const designer = useDesignerStore();
const bottomTab = ref('events');
const selectedEvent = ref('change');
const selectedActionId = ref('');

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

const configJson = computed({
  get() {
    return JSON.stringify(selectedAction.value?.config ?? {}, null, 2);
  },
  set(value: string) {
    if (!selectedAction.value) {
      return;
    }

    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      designer.updateEventConfig(selectedEvent.value, selectedAction.value.id!, parsed);
    } catch {
      // 非法 JSON 时不提交
    }
  }
});

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
        <el-empty v-if="!designer.selectedNode" description="请选择组件" :image-size="48" />
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

        <el-empty
          v-if="!designer.selectedNode"
          description="请选择画布组件以配置事件"
          :image-size="56"
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

          <el-empty v-else description="暂无动作，请点击上方添加" :image-size="48" />

          <div v-if="selectedAction" class="action-config">
            <div class="event-panel__section-title">
              动作配置 · {{ selectedActionMeta?.label }}
            </div>
            <p class="action-config__desc">{{ selectedActionMeta?.description }}</p>
            <el-input v-model="configJson" type="textarea" :rows="8" class="action-config__editor" />
          </div>
        </template>
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
