<script setup lang="ts">
import type { EventAction } from "@designer-core/schema";
import { getActionMeta } from "../constants/eventActions";
import RequestConfigForm from "./RequestConfigForm.vue";
import SetFormValueConfigForm from "./SetFormValueConfigForm.vue";
import SetVariableConfigForm from "./SetVariableConfigForm.vue";

const props = defineProps<{
  action: EventAction;
}>();

const emit = defineEmits<{
  update: [config: Record<string, unknown>];
}>();

const actionType = () => props.action.type ?? props.action.action;

const meta = () => getActionMeta(actionType());

function cfgString(key: string, fallback = "") {
  const value = props.action.config?.[key];
  return typeof value === "string" ? value : fallback;
}

function cfgBoolean(key: string, fallback = false) {
  const value = props.action.config?.[key];
  return typeof value === "boolean" ? value : fallback;
}

function cfgNumber(key: string, fallback = 0) {
  const value = props.action.config?.[key];
  return typeof value === "number" ? value : fallback;
}

function patch(field: string, value: unknown) {
  emit("update", {
    ...(props.action.config ?? {}),
    [field]: value,
  });
}
</script>

<template>
  <el-form label-position="top" class="nested-action-form" size="small">
    <p
      v-if="
        meta()?.description &&
        actionType() !== 'setVariable' &&
        actionType() !== 'request' &&
        actionType() !== 'setFormValue'
      "
      class="nested-action-form__desc"
    >
      {{ meta()?.description }}
    </p>

    <template v-if="actionType() === 'message'">
      <el-form-item label="消息类型">
        <el-select
          :model-value="cfgString('type', 'info')"
          @update:model-value="patch('type', $event)"
        >
          <el-option label="成功" value="success" />
          <el-option label="提示" value="info" />
          <el-option label="警告" value="warning" />
          <el-option label="错误" value="error" />
        </el-select>
      </el-form-item>
      <el-form-item label="消息内容">
        <el-input
          :model-value="cfgString('content')"
          placeholder="支持 {{variables.xxx}}"
          @update:model-value="patch('content', $event)"
        />
      </el-form-item>
    </template>

    <template v-else-if="actionType() === 'setVisible'">
      <el-form-item label="组件节点 ID">
        <el-input
          :model-value="cfgString('componentId')"
          placeholder="属性面板中的节点 ID"
          @update:model-value="patch('componentId', $event)"
        />
      </el-form-item>
      <el-form-item label="是否显示">
        <el-switch
          :model-value="cfgBoolean('visible', true)"
          @update:model-value="patch('visible', $event)"
        />
      </el-form-item>
    </template>

    <SetVariableConfigForm
      v-else-if="actionType() === 'setVariable'"
      :action="action"
      @update="emit('update', $event)"
    />

    <SetFormValueConfigForm
      v-else-if="actionType() === 'setFormValue'"
      :action="action"
      @update="emit('update', $event)"
    />

    <RequestConfigForm
      v-else-if="actionType() === 'request'"
      :action="action"
      @update="emit('update', $event)"
    />

    <template v-else-if="actionType() === 'dialog'">
      <el-form-item label="弹窗类型">
        <el-select
          :model-value="cfgString('type', 'alert')"
          @update:model-value="patch('type', $event)"
        >
          <el-option label="提示" value="alert" />
          <el-option label="确认" value="confirm" />
        </el-select>
      </el-form-item>
      <el-form-item label="标题">
        <el-input
          :model-value="cfgString('title')"
          @update:model-value="patch('title', $event)"
        />
      </el-form-item>
      <el-form-item label="内容">
        <el-input
          :model-value="cfgString('message')"
          @update:model-value="patch('message', $event)"
        />
      </el-form-item>
    </template>

    <template v-else-if="actionType() === 'navigate'">
      <el-form-item label="跳转地址">
        <el-input
          :model-value="cfgString('url')"
          @update:model-value="patch('url', $event)"
        />
      </el-form-item>
    </template>

    <template v-else-if="actionType() === 'delay'">
      <el-form-item label="延迟（毫秒）">
        <el-input-number
          :model-value="cfgNumber('ms', 300)"
          :min="0"
          :step="100"
          @update:model-value="patch('ms', $event)"
        />
      </el-form-item>
    </template>

    <template v-else-if="actionType() === 'reload'">
      <el-text type="info" size="small">刷新当前页面，无需额外参数。</el-text>
    </template>

    <template v-else>
      <el-text type="warning" size="small"
        >该动作类型暂无可视化表单项，请使用高级 JSON 编辑。</el-text
      >
    </template>
  </el-form>
</template>
