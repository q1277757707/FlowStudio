<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { DocumentCopy } from '@element-plus/icons-vue';
import {
  fieldValidateTypeOptions,
  getValidateOptionsForComponentType,
  validationPropFields
} from '@designer-core/validation';
import {
  getMaterialByType,
  getOptionApiDefaultProps,
  isOptionApiProp,
  isOptionSourceComponent,
  isOptionStaticProp,
  materialHasValidationSettings
} from '@designer-materials/index';
import { useDesignerStore } from '../store/designer';

interface EditableOption {
  label: string;
  value: string | number | boolean;
}

interface EditableTransferItem {
  key: string | number;
  label: string;
  disabled?: boolean;
}

const designer = useDesignerStore();

const selectedMaterial = computed(() => {
  if (!designer.selectedNode) {
    return undefined;
  }

  return getMaterialByType(designer.selectedNode.type);
});

const supportsValidation = computed(() => {
  if (!selectedMaterial.value) {
    return false;
  }

  return materialHasValidationSettings(selectedMaterial.value);
});

const validateOptions = computed(() => {
  if (!designer.selectedNode) {
    return fieldValidateTypeOptions;
  }

  return getValidateOptionsForComponentType(designer.selectedNode.type);
});

const showFormatRuleSelect = computed(() => validateOptions.value.length > 1);

function isPropVisible(field: string): boolean {
  const nodeType = designer.selectedNode?.type ?? '';

  if (!isOptionSourceComponent(nodeType)) {
    return true;
  }

  const source = String(propValue('optionsSource') ?? 'static');

  if (isOptionApiProp(field)) {
    return source === 'api';
  }

  if (isOptionStaticProp(field)) {
    return source === 'static';
  }

  return true;
}

const visibleProps = computed(() => {
  const props = selectedMaterial.value?.props ?? [];

  return props
    .filter((prop) => !validationPropFields.includes(prop.field as (typeof validationPropFields)[number]))
    .filter((prop) => isPropVisible(prop.field));
});

function propValue(field: string) {
  return designer.selectedNode?.props[field];
}

function updateProp(field: string, value: unknown) {
  designer.updateSelectedProp(field, value);

  if (field === 'optionsSource' && value === 'api' && designer.selectedNode) {
    const nodeType = designer.selectedNode.type;

    if (isOptionSourceComponent(nodeType)) {
      const defaults = getOptionApiDefaultProps(nodeType);

      for (const [key, defaultValue] of Object.entries(defaults)) {
        const current = designer.selectedNode.props[key];

        if (current === undefined || current === '') {
          designer.updateSelectedProp(key, defaultValue);
        }
      }
    }
  }
}

function updateValidateType(value: string) {
  updateProp('validateType', value);

  if (value !== 'custom') {
    updateProp('customPattern', '');
  }
}

function optionItems(field: string): EditableOption[] {
  const value = propValue(field);
  return Array.isArray(value) ? (value as EditableOption[]) : [];
}

function updateOption(field: string, index: number, key: keyof EditableOption, value: string) {
  const nextOptions = [...optionItems(field)];
  nextOptions[index] = {
    ...nextOptions[index],
    [key]: value
  };
  updateProp(field, nextOptions);
}

function addOption(field: string) {
  updateProp(field, [
    ...optionItems(field),
    {
      label: `选项${optionItems(field).length + 1}`,
      value: `option${optionItems(field).length + 1}`
    }
  ]);
}

function removeOption(field: string, index: number) {
  updateProp(
    field,
    optionItems(field).filter((_, currentIndex) => currentIndex !== index)
  );
}

function transferItems(field: string): EditableTransferItem[] {
  const value = propValue(field);
  return Array.isArray(value) ? (value as EditableTransferItem[]) : [];
}

function updateTransferItem(field: string, index: number, key: keyof EditableTransferItem, value: unknown) {
  const nextItems = [...transferItems(field)];
  nextItems[index] = {
    ...nextItems[index],
    [key]: value
  };
  updateProp(field, nextItems);
}

function addTransferItem(field: string) {
  updateProp(field, [
    ...transferItems(field),
    {
      key: `option${transferItems(field).length + 1}`,
      label: `选项${transferItems(field).length + 1}`
    }
  ]);
}

function removeTransferItem(field: string, index: number) {
  updateProp(
    field,
    transferItems(field).filter((_, currentIndex) => currentIndex !== index)
  );
}

const selectedNodeId = computed(() => designer.selectedNode?.id ?? '');

async function copyNodeId() {
  const id = selectedNodeId.value;

  if (!id) {
    return;
  }

  try {
    await navigator.clipboard.writeText(id);
    ElMessage.success('节点 ID 已复制');
  } catch {
    ElMessage.error('复制失败，请手动选择复制');
  }
}
</script>

<template>
  <aside class="designer-panel property-panel">
    <el-tabs model-value="props" class="right-panel-tabs">
      <el-tab-pane label="属性" name="props">
        <div class="right-tab-content">
          <el-empty v-if="!designer.selectedNode" description="请选择画布中的组件" :image-size="80" />

          <template v-else>
            <section class="property-section">
              <div class="property-section__title">组件属性</div>

              <el-form label-position="top" class="setter-form property-form">
                <el-form-item label="节点 ID">
                  <div class="node-id-field">
                    <el-input
                      class="node-id-field__input"
                      :model-value="selectedNodeId"
                      readonly
                    />
                    <el-button
                      class="node-id-field__copy"
                      :icon="DocumentCopy"
                      title="复制节点 ID"
                      @click="copyNodeId"
                    />
                  </div>
                  <p class="node-id-field__hint">用于事件配置中的 form['节点ID']、联动等</p>
                </el-form-item>

                <el-form-item label="组件类型">
                  <el-input :model-value="selectedMaterial?.name ?? designer.selectedNode.type" disabled />
                </el-form-item>

                <el-form-item v-for="prop in visibleProps" :key="prop.field" :label="prop.label">
                  <el-input
                    v-if="prop.type === 'StringSetter'"
                    :model-value="String(propValue(prop.field) ?? '')"
                    @update:model-value="updateProp(prop.field, $event)"
                  />

                  <el-input-number
                    v-else-if="prop.type === 'NumberSetter'"
                    :model-value="Number(propValue(prop.field) ?? 0)"
                    :min="0"
                    @update:model-value="updateProp(prop.field, $event)"
                  />

                  <el-select
                    v-else-if="prop.type === 'SelectSetter'"
                    :model-value="String(propValue(prop.field) ?? '')"
                    @update:model-value="updateProp(prop.field, $event)"
                  >
                    <el-option
                      v-for="option in prop.options ?? []"
                      :key="String(option.value)"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>

                  <el-switch
                    v-else-if="prop.type === 'BooleanSetter'"
                    :model-value="Boolean(propValue(prop.field))"
                    @update:model-value="updateProp(prop.field, $event)"
                  />

                  <div v-else-if="prop.type === 'OptionSetter'" class="setter-list">
                    <div v-for="(option, index) in optionItems(prop.field)" :key="index" class="setter-row">
                      <el-input
                        class="setter-row__input"
                        :model-value="option.label"
                        placeholder="显示文案"
                        @update:model-value="updateOption(prop.field, index, 'label', $event)"
                      />
                      <el-input
                        class="setter-row__input"
                        :model-value="String(option.value)"
                        placeholder="值"
                        @update:model-value="updateOption(prop.field, index, 'value', $event)"
                      />
                      <el-button type="danger" plain @click="removeOption(prop.field, index)">删除</el-button>
                    </div>
                    <el-button size="small" plain @click="addOption(prop.field)">添加选项</el-button>
                  </div>

                  <div v-else-if="prop.type === 'TransferSetter'" class="setter-list">
                    <div v-for="(item, index) in transferItems(prop.field)" :key="index" class="setter-row">
                      <el-input
                        class="setter-row__input"
                        :model-value="String(item.key)"
                        placeholder="键"
                        @update:model-value="updateTransferItem(prop.field, index, 'key', $event)"
                      />
                      <el-input
                        class="setter-row__input"
                        :model-value="item.label"
                        placeholder="显示文案"
                        @update:model-value="updateTransferItem(prop.field, index, 'label', $event)"
                      />
                      <el-switch
                        :model-value="Boolean(item.disabled)"
                        active-text="禁用"
                        @update:model-value="updateTransferItem(prop.field, index, 'disabled', $event)"
                      />
                      <el-button type="danger" plain @click="removeTransferItem(prop.field, index)">删除</el-button>
                    </div>
                    <el-button size="small" plain @click="addTransferItem(prop.field)">添加数据</el-button>
                  </div>
                </el-form-item>
              </el-form>
            </section>

            <section v-if="supportsValidation" class="property-section">
              <div class="property-section__title">校验设置</div>

              <el-form label-position="top" class="setter-form validation-form">
                <el-form-item>
                  <el-checkbox
                    :model-value="Boolean(propValue('required'))"
                    @update:model-value="updateProp('required', $event)"
                  >
                    是否必填
                  </el-checkbox>
                </el-form-item>

                <el-form-item v-if="showFormatRuleSelect" label="校验规则">
                  <el-select
                    :model-value="String(propValue('validateType') ?? 'none')"
                    placeholder="选择校验规则"
                    @update:model-value="updateValidateType($event)"
                  >
                    <el-option
                      v-for="option in validateOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item
                  v-if="propValue('validateType') === 'custom'"
                  label="自定义正则"
                >
                  <el-input
                    :model-value="String(propValue('customPattern') ?? '')"
                    placeholder="例如 ^[A-Za-z0-9_]{4,16}$"
                    @update:model-value="updateProp('customPattern', $event)"
                  />
                  <p class="validation-hint">输入 JavaScript 正则表达式，不含首尾斜杠</p>
                </el-form-item>

                <el-alert
                  v-if="propValue('validateType') === 'custom' && !propValue('customPattern')"
                  type="warning"
                  :closable="false"
                  show-icon
                  title="请填写自定义正则后校验才会生效"
                />
              </el-form>
            </section>

            <section class="property-section property-desc">
              <div class="property-section__title">组件说明</div>
              <p class="property-desc__text">
                {{ selectedMaterial?.name }} 组件用于页面表单与内容展示，可通过右侧属性面板配置字段标识、标题、占位提示与校验规则。
              </p>
              <el-popconfirm title="确定删除该组件吗？" @confirm="designer.removeSelectedNode()">
                <template #reference>
                  <el-button size="small" type="danger" plain class="property-delete">删除组件</el-button>
                </template>
              </el-popconfirm>
            </section>
          </template>
        </div>
      </el-tab-pane>

      <el-tab-pane label="样式" name="style">
        <div class="right-tab-content">
          <el-text type="info">样式面板将在后续版本支持间距、字号、颜色等配置。</el-text>
        </div>
      </el-tab-pane>
    </el-tabs>
  </aside>
</template>
