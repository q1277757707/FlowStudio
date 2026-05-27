<script setup lang="ts">
import { Plus, UserFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useWorkflowStore } from '../store/workflow';

const workflow = useWorkflowStore();

function onModifyIcon() {
  ElMessage.info('图标修改功能开发中');
}

function onAddGroup() {
  ElMessage.info('新增分组功能开发中');
}

function onAddAdmin() {
  ElMessage.info('添加流程管理员功能开发中');
}
</script>

<template>
  <div class="basic-info-panel">
    <div class="basic-info-panel__inner">
      <header class="basic-info-panel__header">
        <h2 class="basic-info-panel__title">基础信息</h2>
        <p class="basic-info-panel__desc">配置流程的基本属性，便于在列表中识别与管理</p>
      </header>

      <el-form
        class="basic-info-form"
        label-position="right"
        label-width="108px"
        :model="workflow.basicInfo"
        size="large"
      >
        <el-form-item label="图标" required>
          <div class="basic-info-form__icon-row">
            <div class="basic-info-form__icon-preview">
              <el-icon :size="26"><UserFilled /></el-icon>
            </div>
            <button type="button" class="basic-info-form__link" @click="onModifyIcon">修改</button>
          </div>
        </el-form-item>

        <el-form-item label="名称" required>
          <el-input
            v-model="workflow.basicInfo.name"
            placeholder="请输入流程名称"
            maxlength="64"
            clearable
            @change="workflow.syncBasicInfoToMeta()"
          />
        </el-form-item>

        <el-form-item label="说明">
          <el-input
            v-model="workflow.basicInfo.description"
            type="textarea"
            :rows="4"
            placeholder="简要描述该流程的用途与适用场景"
            maxlength="500"
            show-word-limit
            resize="none"
          />
        </el-form-item>

        <el-form-item label="分组" required>
          <div class="basic-info-form__group-row">
            <el-select
              v-model="workflow.basicInfo.groupId"
              placeholder="选择流程分组"
              class="basic-info-form__group-select"
            >
              <el-option
                v-for="group in workflow.flowGroups"
                :key="group.id"
                :label="group.name"
                :value="group.id"
              />
            </el-select>
            <button type="button" class="basic-info-form__link basic-info-form__link--with-icon" @click="onAddGroup">
              <el-icon><Plus /></el-icon>
              新增分组
            </button>
          </div>
        </el-form-item>

        <el-form-item label="流程管理员" required>
          <div class="basic-info-form__admins">
            <span
              v-for="admin in workflow.basicInfo.administrators"
              :key="admin.id"
              class="basic-info-form__admin-tag"
            >
              {{ admin.name }}
              <button
                type="button"
                class="basic-info-form__admin-remove"
                aria-label="移除"
                @click="workflow.removeAdministrator(admin.id)"
              >
                ×
              </button>
            </span>
            <button
              type="button"
              class="basic-info-form__add-admin"
              aria-label="添加管理员"
              @click="onAddAdmin"
            >
              <el-icon><Plus /></el-icon>
            </button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.basic-info-panel {
  flex: 1;
  overflow: auto;
  padding: 40px 32px 56px;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgb(24 144 255 / 6%), transparent),
    #f5f7fa;
}

.basic-info-panel__inner {
  max-width: 680px;
  margin: 0 auto;
  padding: 36px 44px 44px;
  background: #fff;
  border: 1px solid rgb(0 0 0 / 4%);
  border-radius: 12px;
  box-shadow:
    0 1px 2px rgb(0 0 0 / 4%),
    0 8px 24px rgb(0 0 0 / 4%);
}

.basic-info-panel__header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.basic-info-panel__title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: 0.02em;
}

.basic-info-panel__desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #8c8c8c;
}

.basic-info-form :deep(.el-form-item) {
  margin-bottom: 28px;
}

.basic-info-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.basic-info-form :deep(.el-form-item__label) {
  padding-right: 20px;
  color: #595959;
  font-size: 14px;
  line-height: 40px;
}

.basic-info-form :deep(.el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label::before) {
  margin-right: 4px;
  color: #ff4d4f;
}

.basic-info-form :deep(.el-input__wrapper),
.basic-info-form :deep(.el-textarea__inner) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e8e8e8 inset;
  transition: box-shadow 0.2s;
}

.basic-info-form :deep(.el-input__wrapper:hover),
.basic-info-form :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #bfbfbf inset;
}

.basic-info-form :deep(.el-input__wrapper.is-focus),
.basic-info-form :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--lc-primary) inset;
}

.basic-info-form :deep(.el-select) {
  width: 100%;
  max-width: 400px;
}

.basic-info-form__icon-row {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 40px;
}

.basic-info-form__icon-preview {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(145deg, #40a9ff 0%, #1890ff 55%, #096dd9 100%);
  color: #fff;
  box-shadow:
    0 4px 12px rgb(24 144 255 / 35%),
    0 0 0 3px rgb(24 144 255 / 8%);
}

.basic-info-form__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  color: var(--lc-primary);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.15s, opacity 0.15s;
}

.basic-info-form__link:hover {
  color: #40a9ff;
}

.basic-info-form__link--with-icon {
  flex-shrink: 0;
  margin-left: 4px;
  white-space: nowrap;
}

.basic-info-form__group-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 520px;
}

.basic-info-form__group-select {
  flex: 1;
  min-width: 0;
}

.basic-info-form__admins {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  min-height: 40px;
}

.basic-info-form__admin-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px 0 12px;
  border-radius: 6px;
  background: #f5f5f5;
  color: #434343;
  font-size: 13px;
  line-height: 1;
}

.basic-info-form__admin-remove {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #8c8c8c;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.basic-info-form__admin-remove:hover {
  background: rgb(0 0 0 / 6%);
  color: #595959;
}

.basic-info-form__add-admin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  color: #8c8c8c;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s,
    background 0.15s;
}

.basic-info-form__add-admin:hover {
  border-color: var(--lc-primary);
  background: #e6f7ff;
  color: var(--lc-primary);
}
</style>
