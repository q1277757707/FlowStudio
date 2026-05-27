import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import {
  cloneWorkflowTemplate,
  compileWorkflowTemplate,
  createFlowItem,
  createInitialWorkflowTemplate,
  isStartEndOnlyWorkflowTemplate,
  normalizeBranchBlock,
  parseFlowItemsFromTemplate,
  parseStartSettingsFromTemplate,
  validateWorkflowTemplate,
  walkFlowItems,
  type WorkflowBranchBlockDraft,
  type WorkflowConditionBranchDraft,
  type WorkflowFlowItem,
  type WorkflowStartSettings,
  type WorkflowStepDraft,
  type WorkflowStepKind,
  type WorkflowTemplate,
  type WorkflowTemplateStatus,
  type WorkflowValidationResult
} from '@designer-core/workflow';
import {
  createInitialFlowPermission,
  createInitialNodeConfig,
  ensureNodeKeys,
  flowItemsToNodeConfig,
  nodeConfigToFlowItems,
  nodeConfigToStartSettings
} from '../flow-beeflow/adapter';
import { draftGroupsToBeeflow, formatConditionSummary } from '../flow-beeflow/condition';
import { findBeeflowNodeByKey, patchBeeflowNodeByKey } from '../flow-beeflow/findNode';
import type { BeeflowFlowPermission, BeeflowNode } from '../flow-beeflow/types';
import type { WorkflowConditionGroupDraft } from '@designer-core/workflow';
import { useDesignerStore } from './designer';

const STORAGE_KEY = 'lc-workflow-template-draft-v5';
const BASIC_INFO_KEY = 'lc-workflow-basic-info-v1';
const LEGACY_STORAGE_KEYS = ['lc-workflow-template-draft-v4', 'lc-workflow-template-draft-v3'] as const;

export interface WorkflowAdministrator {
  id: string;
  name: string;
}

export interface WorkflowFlowGroup {
  id: string;
  name: string;
}

export interface WorkflowBasicInfo {
  icon: string;
  name: string;
  description: string;
  groupId: string;
  administrators: WorkflowAdministrator[];
}

function createDefaultBasicInfo(): WorkflowBasicInfo {
  return {
    icon: 'default',
    name: '默认审批流',
    description: '',
    groupId: 'default',
    administrators: [{ id: 'admin_1', name: '路飞' }]
  };
}

function readStoredBasicInfo(): WorkflowBasicInfo | undefined {
  try {
    const raw = localStorage.getItem(BASIC_INFO_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as WorkflowBasicInfo;
  } catch {
    return undefined;
  }
}

const DEFAULT_FLOW_GROUPS: WorkflowFlowGroup[] = [
  { id: 'default', name: '默认分组' },
  { id: 'hr', name: '人事流程' },
  { id: 'finance', name: '财务流程' }
];

function findBlockInTree(items: WorkflowFlowItem[], blockKey: string): WorkflowBranchBlockDraft | undefined {
  for (const item of items) {
    if (item.type !== 'branch') continue;
    if (item.block.key === blockKey) return item.block;
    for (const branch of item.block.branches) {
      const nested = findBlockInTree(branch.steps, blockKey);
      if (nested) return nested;
    }
  }
  return undefined;
}

function findBranchInTree(items: WorkflowFlowItem[], blockKey: string, branchKey: string): WorkflowConditionBranchDraft | undefined {
  const block = findBlockInTree(items, blockKey);
  return block?.branches.find((branch) => branch.key === branchKey);
}

function findStepInTree(items: WorkflowFlowItem[], stepKey: string): WorkflowStepDraft | undefined {
  for (const item of items) {
    if (item.type === 'step' && item.step.key === stepKey) return item.step;
    if (item.type === 'branch') {
      for (const branch of item.block.branches) {
        const found = findStepInTree(branch.steps, stepKey);
        if (found) return found;
      }
    }
  }
  return undefined;
}

function removeStepFromItems(items: WorkflowFlowItem[], stepKey: string): WorkflowFlowItem[] {
  return items
    .filter((item) => !(item.type === 'step' && item.step.key === stepKey))
    .map((item) => {
      if (item.type !== 'branch') return item;
      return { type: 'branch', block: { ...item.block, branches: item.block.branches.map((branch) => ({ ...branch, steps: removeStepFromItems(branch.steps, stepKey) })) } };
    });
}

function readStoredTemplate(): WorkflowTemplate | undefined {
  const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const template = JSON.parse(raw) as WorkflowTemplate;
      if (isStartEndOnlyWorkflowTemplate(template)) return template;
    } catch { /* try next */ }
  }
  return undefined;
}

export type WorkflowSelection =
  | { target: 'start' }
  | { target: 'end' }
  | { target: 'step'; stepKey: string }
  | { target: 'branchCondition'; blockKey: string; branchKey: string }
  | { target: 'branchStep'; blockKey: string; branchKey: string; stepKey: string };

export const useWorkflowStore = defineStore('workflow', () => {
  const designer = useDesignerStore();

  const templateMeta = ref({ code: 'wf_default', name: '默认审批流', version: 1, status: 'draft' as WorkflowTemplateStatus });
  const basicInfo = ref<WorkflowBasicInfo>(readStoredBasicInfo() ?? createDefaultBasicInfo());
  const flowGroups = ref<WorkflowFlowGroup[]>([...DEFAULT_FLOW_GROUPS]);
  const startSettings = ref<WorkflowStartSettings>({ initiatorMode: 'all' });
  const flowItems = ref<WorkflowFlowItem[]>([]);
  const nodeConfig = ref<BeeflowNode>(createInitialNodeConfig());
  const flowPermission = ref<BeeflowFlowPermission>(createInitialFlowPermission());
  const selection = ref<WorkflowSelection>({ target: 'end' });
  const lastValidation = ref<WorkflowValidationResult | null>(null);

  let syncingBeeflow = false;

  function syncFromBeeflow() {
    if (syncingBeeflow) return;
    syncingBeeflow = true;
    ensureNodeKeys(nodeConfig.value);
    flowItems.value = nodeConfigToFlowItems(nodeConfig.value);
    Object.assign(startSettings.value, nodeConfigToStartSettings(nodeConfig.value, flowPermission.value));
    syncingBeeflow = false;
  }

  function syncToBeeflow() {
    if (syncingBeeflow) return;
    syncingBeeflow = true;
    const converted = flowItemsToNodeConfig(flowItems.value, startSettings.value);
    nodeConfig.value = converted.nodeConfig;
    flowPermission.value = converted.flowPermission;
    ensureNodeKeys(nodeConfig.value);
    syncingBeeflow = false;
  }

  function setNodeConfig(config: BeeflowNode) {
    nodeConfig.value = config;
    syncFromBeeflow();
  }

  function syncMetaFromPage() {
    templateMeta.value.code = designer.schema.pageId || templateMeta.value.code;
    if (!basicInfo.value.name.trim()) {
      templateMeta.value.name = designer.schema.pageName || templateMeta.value.name;
    }
  }

  function syncBasicInfoToMeta() {
    templateMeta.value.name = basicInfo.value.name.trim() || templateMeta.value.name;
  }

  function persistBasicInfo() {
    localStorage.setItem(BASIC_INFO_KEY, JSON.stringify(basicInfo.value));
  }

  function removeAdministrator(id: string) {
    basicInfo.value.administrators = basicInfo.value.administrators.filter((a) => a.id !== id);
  }

  function loadFromTemplate(template: WorkflowTemplate) {
    templateMeta.value = { code: template.code, name: template.name, version: template.version, status: template.status };
    if (!readStoredBasicInfo()) {
      basicInfo.value.name = template.name;
    }
    startSettings.value = parseStartSettingsFromTemplate(template);
    flowItems.value = parseFlowItemsFromTemplate(template).map((item) => {
      if (item.type === 'branch') return { type: 'branch' as const, block: normalizeBranchBlock(item.block) };
      return item;
    });
    selection.value = { target: 'end' };
    syncToBeeflow();
    syncMetaFromPage();
  }

  function init() {
    const stored = readStoredTemplate();
    if (stored) { loadFromTemplate(stored); return; }
    loadFromTemplate(createInitialWorkflowTemplate());
  }

  init();

  const compiledTemplate = computed(() => {
    const items = nodeConfigToFlowItems(nodeConfig.value);
    const start = nodeConfigToStartSettings(nodeConfig.value, flowPermission.value);
    return compileWorkflowTemplate(templateMeta.value, items, start);
  });

  const templateJson = computed(() => JSON.stringify(compiledTemplate.value, null, 2));

  /** 打开 JSON 等导出前：以画布 nodeConfig 为准刷新 flowItems，保证与最新编辑一致 */
  function refreshFlowSnapshot() {
    syncFromBeeflow();
  }

  const selectedStep = computed((): WorkflowStepDraft | undefined => {
    const sel = selection.value;
    if (sel.target === 'step' || sel.target === 'branchStep') return findStepInTree(flowItems.value, sel.stepKey);
    return undefined;
  });

  const selectedBranch = computed(() => {
    const sel = selection.value;
    if (sel.target !== 'branchCondition' && sel.target !== 'branchStep') return undefined;
    return findBranchInTree(flowItems.value, sel.blockKey, sel.branchKey);
  });

  function persistDraft() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compiledTemplate.value));
  }

  watch([templateMeta, flowItems, startSettings, nodeConfig, flowPermission], () => {
    persistDraft();
    syncMetaFromPage();
  }, { deep: true });

  watch(basicInfo, () => {
    syncBasicInfoToMeta();
    persistBasicInfo();
  }, { deep: true });

  watch(flowItems, () => { syncToBeeflow(); }, { deep: true });
  watch(startSettings, () => { syncToBeeflow(); }, { deep: true });
  watch(() => designer.schema.pageId, () => syncMetaFromPage());

  function setStartSettings(patch: Partial<WorkflowStartSettings>) {
    Object.assign(startSettings.value, patch);
    syncToBeeflow();
  }

  function findStepByKey(stepKey: string) { return findStepInTree(flowItems.value, stepKey); }
  function findBranchByKeys(blockKey: string, branchKey: string) { return findBranchInTree(flowItems.value, blockKey, branchKey); }

  function insertFlowItemAt(index: number, kind: WorkflowStepKind) {
    const item = createFlowItem(kind);
    const list = [...flowItems.value];
    list.splice(index, 0, item);
    flowItems.value = list;
    if (item.type === 'step') { selection.value = { target: 'step', stepKey: item.step.key }; }
    else { selection.value = { target: 'branchCondition', blockKey: item.block.key, branchKey: item.block.branches[0].key }; }
  }

  function removeFlowItemAt(index: number) {
    flowItems.value = flowItems.value.filter((_, i) => i !== index);
    selection.value = { target: 'end' };
  }

  function updateStep(stepKey: string, patch: Partial<WorkflowStepDraft>) {
    const step = findStepInTree(flowItems.value, stepKey);
    if (step) Object.assign(step, patch);
  }

  function updateBeeflowNode(stepKey: string, node: BeeflowNode) {
    if (!patchBeeflowNodeByKey(nodeConfig.value, stepKey, node)) return;
    ensureNodeKeys(nodeConfig.value);
    syncFromBeeflow();
  }

  function updateBranchCondition(blockKey: string, branchKey: string, condition: string) {
    const branch = findBranchInTree(flowItems.value, blockKey, branchKey);
    if (!branch) return;
    branch.condition = condition;
    branch.conditionGroups = condition.trim()
      ? [{ conditions: [{ varName: 'expr', operator: 0, val: condition }] }]
      : [];
    syncToBeeflow();
  }

  function updateBranchConditionGroups(
    blockKey: string,
    branchKey: string,
    groups: WorkflowConditionGroupDraft[]
  ) {
    const branch = findBranchInTree(flowItems.value, blockKey, branchKey);
    if (!branch) return;
    const normalized = draftGroupsToBeeflow(groups);
    branch.conditionGroups = groups;
    branch.condition = formatConditionSummary(normalized);
    syncToBeeflow();
  }

  function updateBranchLabel(blockKey: string, branchKey: string, label: string) {
    const branch = findBranchInTree(flowItems.value, blockKey, branchKey);
    if (!branch) return;
    branch.label = label;
    syncToBeeflow();
  }

  function addBranchToBlock(blockKey: string) {
    const block = findBlockInTree(flowItems.value, blockKey);
    if (!block) return;
    const n = block.branches.filter((b) => !b.isDefault).length + 1;
    block.branches.push({ key: `${blockKey}_c${n}`, label: `条件${n}`, priority: n, isDefault: false, condition: '', steps: [] });
  }

  function insertFlowItemInBranch(blockKey: string, branchKey: string, itemIndex: number, kind: WorkflowStepKind) {
    const branch = findBranchInTree(flowItems.value, blockKey, branchKey);
    if (!branch) return;
    const item = createFlowItem(kind);
    branch.steps.splice(itemIndex, 0, item);
    if (item.type === 'step') { selection.value = { target: 'branchStep', blockKey, branchKey, stepKey: item.step.key }; }
    else { selection.value = { target: 'branchCondition', blockKey: item.block.key, branchKey: item.block.branches[0]?.key ?? '' }; }
  }

  function removeStep(stepKey: string) {
    const topRemoved = flowItems.value.some((item) => item.type === 'step' && item.step.key === stepKey);
    if (topRemoved) { flowItems.value = flowItems.value.filter((item) => !(item.type === 'step' && item.step.key === stepKey)); }
    else { flowItems.value = flowItems.value.map((item) => { if (item.type !== 'branch') return item; return { type: 'branch', block: { ...item.block, branches: item.block.branches.map((b) => ({ ...b, steps: removeStepFromItems(b.steps, stepKey) })) } }; }); }
    selection.value = { target: 'end' };
  }

  function selectStart() { selection.value = { target: 'start' }; }
  function selectEnd() { selection.value = { target: 'end' }; }
  function selectStep(stepKey: string) { selection.value = { target: 'step', stepKey }; }
  function selectBranchCondition(blockKey: string, branchKey: string) { selection.value = { target: 'branchCondition', blockKey, branchKey }; }
  function selectBranchStep(blockKey: string, branchKey: string, stepKey: string) { selection.value = { target: 'branchStep', blockKey, branchKey, stepKey }; }
  function isSelectedStep(stepKey: string) {
    const sel = selection.value;
    return (sel.target === 'step' && sel.stepKey === stepKey) || (sel.target === 'branchStep' && sel.stepKey === stepKey);
  }

  function runValidation(): WorkflowValidationResult {
    const result = validateWorkflowTemplate(compiledTemplate.value);
    lastValidation.value = result;
    return result;
  }

  function resetTemplate() {
    for (const key of [...LEGACY_STORAGE_KEYS, STORAGE_KEY, BASIC_INFO_KEY]) localStorage.removeItem(key);
    basicInfo.value = createDefaultBasicInfo();
    loadFromTemplate(createInitialWorkflowTemplate());
    lastValidation.value = null;
  }

  syncBasicInfoToMeta();
  persistBasicInfo();

  return {
    templateMeta, basicInfo, flowGroups, syncBasicInfoToMeta, removeAdministrator,
    startSettings, flowItems, flowSteps: flowItems,
    nodeConfig, flowPermission, setNodeConfig, syncFromBeeflow, syncToBeeflow,
    findStepByKey, findBranchByKeys, selection, selectedStep, selectedBranch,
    compiledTemplate, templateJson, lastValidation,
    setStartSettings, insertFlowItemAt, insertStepAt: insertFlowItemAt,
    insertFlowItemInBranch, insertBranchStepAt: insertFlowItemInBranch,
    removeFlowItemAt, removeStep, updateStep, updateBeeflowNode, updateBranchCondition,
    updateBranchConditionGroups, updateBranchLabel, addBranchToBlock,
    selectStart, selectEnd, selectStep, selectBranchCondition, selectBranchStep, isSelectedStep,
    runValidation, resetTemplate, loadFromTemplate, refreshFlowSnapshot,
    cloneWorkflowTemplate, walkFlowItems
  };
});
