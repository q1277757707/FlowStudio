<script setup lang="ts">
import { computed } from 'vue';
import { Delete, Plus, Sort } from '@element-plus/icons-vue';
import {
  ASSIGNEE,
  ASSIGNEE_LABELS,
  type AssigneeListMode,
  getAssigneeType,
  layerOptionLabel,
  newRid,
  onAssigneeTypeChanged,
  setAssigneeType
} from '../../workflow-canvas/assignee';
import type { WorkflowAssignee } from '../../workflow-canvas/types';

const props = defineProps<{
  modelValue: WorkflowAssignee[];
  mode: AssigneeListMode;
  personLabel: string;
  typeOptions: number[];
  allowAdd?: boolean;
  disableMultiOnlyTypes?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: WorkflowAssignee[]] }>();

const list = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const layerOptions = Array.from({ length: 20 }, (_, i) => i);

function addPerson() {
  const item: WorkflowAssignee = { rid: newRid() };
  setAssigneeType(item, props.mode, ASSIGNEE.SELF);
  onAssigneeTypeChanged(item, ASSIGNEE.SELF);
  list.value = [...list.value, item];
}

function removePerson(rid: string) {
  if (list.value.length <= 1) return;
  list.value = list.value.filter((item) => item.rid !== rid);
}

function changeType(item: WorkflowAssignee, type: number) {
  setAssigneeType(item, props.mode, type);
  onAssigneeTypeChanged(item, type);
  list.value = [...list.value];
}

function switchLayerType(item: WorkflowAssignee) {
  item.layerType = item.layerType === 1 ? 0 : 1;
  list.value = [...list.value];
}

function showSubContent(type: number) {
  return ![ASSIGNEE.SELF, ASSIGNEE.INITIATOR_CHOICE].includes(type as never);
}
</script>

<template>
  <div class="wf-assignee-list">
    <div v-for="(item, idx) in list" :key="item.rid" class="wf-assignee-card">
      <div class="wf-assignee-card__head">
        <span>{{ personLabel }}{{ idx + 1 }}</span>
        <el-button
          v-if="list.length > 1"
          :icon="Delete"
          text
          class="wf-assignee-card__delete"
          @click="removePerson(item.rid)"
        />
      </div>
      <div class="wf-assignee-card__body">
        <el-radio-group
          :model-value="getAssigneeType(item, mode)"
          class="wf-assignee-card__radios"
          @update:model-value="changeType(item, Number($event))"
        >
          <el-radio
            v-for="opt in typeOptions"
            :key="opt"
            :value="opt"
            :disabled="disableMultiOnlyTypes && list.length > 1 && ([ASSIGNEE.MULTISTEP_LEADER, ASSIGNEE.MULTISTEP_DEPARTMENT_LEADER, ASSIGNEE.INITIATOR_CHOICE] as number[]).includes(opt)"
          >
            {{ ASSIGNEE_LABELS[opt] }}
          </el-radio>
        </el-radio-group>

        <div v-if="showSubContent(getAssigneeType(item, mode))" class="wf-assignee-card__sub">
          <template v-if="getAssigneeType(item, mode) === ASSIGNEE.SUPERIOR">
            <p class="wf-assignee-card__sub-title">请选择上级</p>
            <div class="wf-layer-select">
              <div class="wf-layer-select__tip">
                <span>{{ item.layerType === 1 ? '从最高上级向下选择' : '从直属上级向上选择' }}</span>
                <el-button text type="primary" :icon="Sort" @click="switchLayerType(item)">
                  {{ item.layerType === 1 ? '切为直属上级向上' : '切为最高上级向下' }}
                </el-button>
              </div>
              <el-select v-model="item.layer" placeholder="请选择上级" class="wf-layer-select__control">
                <el-option
                  v-for="layer in layerOptions"
                  :key="layer"
                  :label="layerOptionLabel(layer, item.layerType ?? 0, 'superior')"
                  :value="layer"
                />
              </el-select>
            </div>
          </template>

          <template v-else-if="getAssigneeType(item, mode) === ASSIGNEE.DEPARTMENT_LEADER">
            <p class="wf-assignee-card__sub-title">请选择部门负责人</p>
            <div class="wf-layer-select">
              <div class="wf-layer-select__tip">
                <span>{{ item.layerType === 1 ? '从最高部门向下选择' : '从直属部门负责人向上选择' }}</span>
                <el-button text type="primary" :icon="Sort" @click="switchLayerType(item)">
                  {{ item.layerType === 1 ? '切为直属部门向上' : '切为最高部门向下' }}
                </el-button>
              </div>
              <el-select v-model="item.layer" placeholder="请选择部门负责人" class="wf-layer-select__control">
                <el-option
                  v-for="layer in layerOptions"
                  :key="layer"
                  :label="layerOptionLabel(layer, item.layerType ?? 0, 'dept')"
                  :value="layer"
                />
              </el-select>
            </div>
          </template>

          <template v-else-if="getAssigneeType(item, mode) === ASSIGNEE.ROLE">
            <p class="wf-assignee-card__sub-title">选择角色</p>
            <el-select
              v-model="item.roles"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="输入或选择角色 ID"
              class="wf-layer-select__control"
            />
          </template>

          <template v-else-if="getAssigneeType(item, mode) === ASSIGNEE.ASSIGNEE">
            <p class="wf-assignee-card__sub-title">添加成员<span class="wf-muted">（不能超过 25 人）</span></p>
            <el-select
              v-model="item.assignees"
              multiple
              filterable
              allow-create
              default-first-option
              :multiple-limit="25"
              placeholder="输入成员 ID"
              class="wf-layer-select__control"
            />
          </template>

          <template v-else-if="([ASSIGNEE.MULTISTEP_LEADER, ASSIGNEE.MULTISTEP_DEPARTMENT_LEADER] as number[]).includes(getAssigneeType(item, mode))">
            <p class="wf-assignee-card__sub-title">审批终点</p>
            <div class="wf-layer-select">
              <div class="wf-layer-select__tip">
                <span>
                  {{
                    getAssigneeType(item, mode) === ASSIGNEE.MULTISTEP_LEADER
                      ? (item.layerType === 1 ? '从最高上级向下选择' : '从直属上级向上选择')
                      : (item.layerType === 1 ? '从最高部门向下选择' : '从直属部门负责人向上选择')
                  }}
                </span>
                <el-button text type="primary" :icon="Sort" @click="switchLayerType(item)">切换方向</el-button>
              </div>
              <el-select v-model="item.layer" placeholder="请选择" class="wf-layer-select__control">
                <el-option
                  v-for="layer in layerOptions"
                  :key="layer"
                  :label="
                    layerOptionLabel(
                      layer,
                      item.layerType ?? 0,
                      getAssigneeType(item, mode) === ASSIGNEE.MULTISTEP_LEADER ? 'superior' : 'dept'
                    )
                  "
                  :value="layer"
                />
              </el-select>
            </div>
          </template>
        </div>
      </div>
    </div>

    <button v-if="allowAdd !== false" type="button" class="wf-assignee-list__add" @click="addPerson">
      <el-icon><Plus /></el-icon>
      添加{{ personLabel }}
    </button>
  </div>
</template>
