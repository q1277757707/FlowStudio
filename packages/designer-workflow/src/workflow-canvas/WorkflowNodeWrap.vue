<script setup lang="ts">
import { computed, ref } from 'vue';
import { ArrowLeft, ArrowRight, Close, Plus } from '@element-plus/icons-vue';
import { useWorkflowStore } from '../store/workflow';
import WorkflowInsertNode from './WorkflowInsertNode.vue';
import { formatWorkflowStartSummary } from './adapter';
import { formatWorkflowNodeAssigneeSummary } from './assignee';
import { nodeAccentVars } from './accent';
import { formatConditionSummary } from './condition';
import { isWorkflowLinearNodeType, MIN_CONDITION_BRANCHES, NODE, NODE_COLOR } from './constants';
import type { WorkflowConditionNode, WorkflowNode } from './types';

const props = defineProps<{
  nodeConfig: WorkflowNode;
  flowPermission: import('./types').WorkflowFlowPermission;
}>();

const emit = defineEmits<{
  'update:nodeConfig': [value: WorkflowNode | null];
  'update:flowPermission': [value: import('./types').WorkflowFlowPermission];
}>();

const workflow = useWorkflowStore();

const nodeSettings: Record<number, { placeholder: string; bgColor: string }> = {
  [NODE.START]: { placeholder: '发起人', bgColor: NODE_COLOR.START },
  [NODE.APPROVE]: { placeholder: '审批人', bgColor: NODE_COLOR.APPROVE },
  [NODE.COPY]: { placeholder: '抄送人', bgColor: NODE_COLOR.COPY },
  [NODE.TRANSACT]: { placeholder: '办理人', bgColor: NODE_COLOR.TRANSACT }
};

const nodeDefaultName = computed(() => nodeSettings[props.nodeConfig.type]?.placeholder ?? '节点');
const nodeBgColor = computed(() => nodeSettings[props.nodeConfig.type]?.bgColor ?? NODE_COLOR.APPROVE);

const isNodeNameEdit = ref(false);
const nodeNameInputList = ref<boolean[]>([]);

const showNodeContent = computed(() => {
  const node = props.nodeConfig;
  if (node.type === NODE.START) return formatWorkflowStartSummary(props.flowPermission);
  const summary = formatWorkflowNodeAssigneeSummary(node);
  if (summary) return summary;
  if (node.type === NODE.APPROVE) return '发起人本人';
  return '';
});

function isDefaultBranchNode(idx: number) {
  return props.nodeConfig.conditionNodes?.[idx]?.name === '默认条件';
}

function getGatewayBranch(_gateway: WorkflowNode, index: number): WorkflowConditionNode {
  return props.nodeConfig.conditionNodes![index];
}

function showConditionContent(_gateway: WorkflowNode, index: number) {
  const branch = getGatewayBranch(_gateway, index);
  const summary = formatConditionSummary(branch.conditionGroups);
  if (summary) return summary;
  const step = workflow.findBranchByKeys(props.nodeConfig.key ?? '', branch.key ?? '');
  return step?.condition?.trim() || '请设置条件';
}

function hasConditionConfigured(branch: WorkflowConditionNode) {
  return Boolean(formatConditionSummary(branch.conditionGroups));
}

function onNameInputClick(index?: number) {
  if (index !== undefined) { nodeNameInputList.value[index] = true; }
  else { isNodeNameEdit.value = true; }
}

function onNameInputBlur(index?: number) {
  if (index !== undefined) {
    nodeNameInputList.value[index] = false;
    const branch = props.nodeConfig.conditionNodes?.[index];
    if (branch) branch.name = branch.name || '条件';
  } else {
    isNodeNameEdit.value = false;
    props.nodeConfig.name = props.nodeConfig.name || nodeDefaultName.value;
  }
  emit('update:nodeConfig', props.nodeConfig);
}

function onNodeRemove() {
  emit('update:nodeConfig', props.nodeConfig.childNode ?? { name: '开始', type: NODE.START, childNode: null });
}

function onConditionAdd() {
  const gateway = props.nodeConfig;
  const len = (gateway.conditionNodes?.length ?? 0) + 1;
  if (!gateway.conditionNodes) gateway.conditionNodes = [];
  gateway.conditionNodes.push({
    key: `${gateway.key ?? 'gw'}_c${len}`,
    name: `条件${len}`,
    type: NODE.CONDITION,
    priorityLevel: len,
    conditionGroups: [],
    childNode: null
  });
  emit('update:nodeConfig', gateway);
}

function canRemoveConditionBranch() {
  const editable = (props.nodeConfig.conditionNodes ?? []).filter((b) => b.name !== '默认条件');
  return editable.length >= MIN_CONDITION_BRANCHES;
}

function unwrapGatewayRemovingBranch(gateway: WorkflowNode, deleteIndex: number): WorkflowNode | null {
  const nodes = gateway.conditionNodes ?? [];
  const kept = nodes[deleteIndex === 0 ? 1 : 0];
  let head = kept?.childNode ?? null;
  if (gateway.childNode) {
    head = head ? mergeNodeChain(head, gateway.childNode) : gateway.childNode;
  }
  return head;
}

function mergeNodeChain(head: WorkflowNode, tail: WorkflowNode): WorkflowNode {
  reconnectNode(head, tail);
  return head;
}

function onConditionRemove(index: number) {
  if (isDefaultBranchNode(index)) return;
  const gateway = props.nodeConfig;
  const nodes = gateway.conditionNodes ?? [];
  if (nodes.length <= MIN_CONDITION_BRANCHES) {
    emit('update:nodeConfig', unwrapGatewayRemovingBranch(gateway, index));
    workflow.syncFromNodeConfig();
    return;
  }
  nodes.splice(index, 1);
  nodes.forEach((item, idx) => {
    item.priorityLevel = idx + 1;
    if (item.name !== '默认条件') item.name = `条件${idx + 1}`;
  });
  emit('update:nodeConfig', gateway);
  workflow.syncFromNodeConfig();
}

function reconnectNode(data: WorkflowNode, addData: WorkflowNode) {
  if (!data.childNode) { data.childNode = addData; }
  else { reconnectNode(data.childNode, addData); }
}

function branchSwitchIdx(index: number, type = 1) {
  const gateway = props.nodeConfig;
  if (!gateway.conditionNodes) return;
  gateway.conditionNodes[index] = gateway.conditionNodes.splice(index + type, 1, gateway.conditionNodes[index])[0];
  gateway.conditionNodes.forEach((item, idx) => { item.priorityLevel = idx + 1; });
  emit('update:nodeConfig', gateway);
}

function updateChildNode(child: WorkflowNode | null) {
  props.nodeConfig.childNode = child;
  emit('update:nodeConfig', props.nodeConfig);
  workflow.syncFromNodeConfig();
}

function patchGatewayChild(branch: WorkflowConditionNode, child: WorkflowNode | null) {
  branch.childNode = child;
  emit('update:nodeConfig', props.nodeConfig);
  workflow.syncFromNodeConfig();
}

const isCardSelected = computed(() => {
  const sel = workflow.selection;
  const key = props.nodeConfig.key;
  if (props.nodeConfig.type === NODE.START) return sel.target === 'start';
  if (!key) return false;
  if (sel.target === 'step' || sel.target === 'branchStep') return sel.stepKey === key;
  return false;
});

function isBranchSelected(branch: WorkflowConditionNode) {
  const sel = workflow.selection;
  if (!props.nodeConfig.key || !branch.key) return false;
  return (
    sel.target === 'branchCondition' &&
    sel.blockKey === props.nodeConfig.key &&
    sel.branchKey === branch.key
  );
}

function onNodeCardClick(priorityLevel?: number) {
  const node = props.nodeConfig;
  if (node.type === NODE.START) { workflow.selectStart(); return; }
  if (node.type === NODE.EXCLUSIVE_GATEWANY && priorityLevel !== undefined) {
    const branch = node.conditionNodes?.find((b) => b.priorityLevel === priorityLevel);
    if (branch?.key && node.key) workflow.selectBranchCondition(node.key, branch.key);
    return;
  }
  if (node.key) workflow.selectStep(node.key);
}
</script>

<template>
  <div v-if="isWorkflowLinearNodeType(nodeConfig.type)" class="node-wrap">
    <div
      class="node-wrap-box"
      :class="{ 'start-node': nodeConfig.type === NODE.START, 'is-selected': isCardSelected }"
      :style="nodeAccentVars(nodeBgColor)"
    >
      <div class="title" :style="{ background: nodeBgColor }">
        <span v-if="nodeConfig.type === NODE.START">{{ nodeConfig.name }}</span>
        <template v-else>
          <input v-if="isNodeNameEdit" v-model="nodeConfig.name" type="text" class="editable-title-input" maxlength="16" :placeholder="nodeDefaultName" @blur="onNameInputBlur()" @focus="($event.target as HTMLInputElement).select()" />
          <template v-else>
            <span class="editable-title"><span @click="onNameInputClick()">{{ nodeConfig.name }}</span></span>
            <el-icon class="close" @click.stop="onNodeRemove"><Close /></el-icon>
          </template>
        </template>
      </div>
      <div class="content" @click="onNodeCardClick()">
        <template v-if="nodeConfig.type === NODE.START">
          <el-tooltip :content="`${nodeDefaultName}：${showNodeContent}`" placement="top">
            <span class="text">{{ nodeDefaultName }}：{{ showNodeContent }}</span>
          </el-tooltip>
        </template>
        <template v-else>
          <span v-if="!showNodeContent" class="placeholder">请选择{{ nodeDefaultName }}</span>
          <el-tooltip v-else :content="`${nodeDefaultName}：${showNodeContent}`" placement="top">
            <span class="text">{{ nodeDefaultName }}：{{ showNodeContent }}</span>
          </el-tooltip>
        </template>
        <el-icon class="content-chevron"><ArrowRight /></el-icon>
      </div>
    </div>
    <WorkflowInsertNode :child-node-p="nodeConfig.childNode ?? null" @update:child-node-p="updateChildNode" />
  </div>

  <div v-if="nodeConfig.type === NODE.EXCLUSIVE_GATEWANY" class="branch-wrap">
    <div class="branch-box-wrap">
      <div class="branch-box">
        <button type="button" class="add-branch" @click.stop="onConditionAdd">
          <el-icon><Plus /></el-icon>添加条件
        </button>
        <div v-for="(item, index) in nodeConfig.conditionNodes" :key="item.key ?? index" class="col-box">
          <div class="condition-node">
            <div class="condition-node-box">
              <div
                v-if="isDefaultBranchNode(index)"
                class="auto-judge default-branch-node"
                :class="{ 'is-selected': isBranchSelected(item) }"
                :style="nodeAccentVars(NODE_COLOR.END)"
              >
                <div class="title-wrapper">
                  <span class="editable-title">默认条件</span>
                  <span class="priority-title">优先级{{ item.priorityLevel }}</span>
                </div>
                <div class="content-wrapper">
                  <div class="content">未满足其他条件时，将进入默认流程</div>
                </div>
              </div>
              <div
                v-else
                class="auto-judge"
                :class="{ 'is-selected': isBranchSelected(item) }"
                :style="nodeAccentVars(NODE_COLOR.CONDITION)"
              >
                <div class="title-wrapper">
                  <input v-if="nodeNameInputList[index]" v-model="item.name" type="text" class="editable-title-input" maxlength="16" @blur="onNameInputBlur(index)" @focus="($event.target as HTMLInputElement).select()" />
                  <template v-else>
                    <span class="editable-title" @click="onNameInputClick(index)">{{ item.name }}</span>
                    <span class="priority-title">优先级{{ item.priorityLevel }}</span>
                    <el-icon v-if="canRemoveConditionBranch()" class="close" @click.stop="onConditionRemove(index)"><Close /></el-icon>
                  </template>
                </div>
                <div class="content-wrapper">
                  <div v-if="index !== 0" class="sort-left" @click.stop="branchSwitchIdx(index, -1)"><el-icon><ArrowLeft /></el-icon></div>
                  <div class="content" @click.stop="onNodeCardClick(item.priorityLevel)">
                    <span v-if="!hasConditionConfigured(item)" class="placeholder">请设置条件</span>
                    <el-tooltip v-else :content="showConditionContent(nodeConfig, index)" placement="top">
                      <span class="text">{{ showConditionContent(nodeConfig, index) }}</span>
                    </el-tooltip>
                  </div>
                  <div v-if="index !== (nodeConfig.conditionNodes?.length ?? 0) - 1 && !isDefaultBranchNode(index + 1)" class="sort-right" @click.stop="branchSwitchIdx(index)"><el-icon><ArrowRight /></el-icon></div>
                </div>
              </div>
              <WorkflowInsertNode :child-node-p="item.childNode ?? null" @update:child-node-p="(n) => patchGatewayChild(item, n)" />
            </div>
          </div>
          <WorkflowNodeWrap v-if="item.childNode" :node-config="item.childNode" :flow-permission="flowPermission" @update:node-config="(n) => patchGatewayChild(item, n)" />
          <template v-if="index === 0"><div class="top-left-cover-line" /><div class="bottom-left-cover-line" /></template>
          <template v-if="index === (nodeConfig.conditionNodes?.length ?? 0) - 1"><div class="top-right-cover-line" /><div class="bottom-right-cover-line" /></template>
        </div>
      </div>
      <WorkflowInsertNode :child-node-p="nodeConfig.childNode ?? null" @update:child-node-p="updateChildNode" />
    </div>
  </div>

  <WorkflowNodeWrap v-if="nodeConfig.childNode" :node-config="nodeConfig.childNode" :flow-permission="flowPermission" @update:node-config="updateChildNode" />
</template>
