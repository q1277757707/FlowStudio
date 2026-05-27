<script setup lang="ts">
import { computed, ref } from 'vue';
import { Search } from '@element-plus/icons-vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import Draggable from 'vuedraggable';
import { createNodeFromMaterial, materialList, type MaterialMeta } from '@designer-materials/index';

const materialTab = ref('basic');
const searchKeyword = ref('');
const activeCategories = ref(['布局', '表单', '基础']);

const categoryLabels: Record<string, string> = {
  布局: '布局组件',
  表单: '表单组件',
  基础: '展示组件'
};

const filteredMaterials = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  return materialList.filter((material) => {
    if (materialTab.value === 'business') {
      return false;
    }
    if (!keyword) {
      return true;
    }
    return material.name.toLowerCase().includes(keyword) || material.type.toLowerCase().includes(keyword);
  });
});

const groupedMaterials = computed(() => {
  return filteredMaterials.value.reduce<Record<string, MaterialMeta[]>>((result, material) => {
    result[material.category] ??= [];
    result[material.category].push(material);
    return result;
  }, {});
});

function cloneMaterial(material: MaterialMeta) {
  return createNodeFromMaterial(material);
}

function iconComponent(name: string) {
  return ElementPlusIconsVue[name as keyof typeof ElementPlusIconsVue];
}
</script>

<template>
  <aside class="designer-panel material-panel">
    <el-tabs v-model="materialTab" class="material-panel__tabs">
      <el-tab-pane label="基础组件" name="basic" />
      <el-tab-pane label="业务组件" name="business" />
    </el-tabs>

    <el-input
      v-model="searchKeyword"
      class="material-panel__search"
      placeholder="搜索组件"
      :prefix-icon="Search"
      clearable
    />

    <div class="material-scroll">
      <el-empty
        v-if="materialTab === 'business'"
        description="业务组件库将在后续版本开放"
        :image-size="72"
      />

      <el-collapse v-else v-model="activeCategories" class="material-collapse">
        <el-collapse-item
          v-for="(materials, category) in groupedMaterials"
          :key="category"
          :name="category"
          :title="categoryLabels[category] ?? category"
        >
          <Draggable
            class="material-list"
            :list="materials"
            :clone="cloneMaterial"
            :group="{ name: 'designer-components', pull: 'clone', put: false }"
            :sort="false"
            item-key="type"
          >
            <template #item="{ element }">
              <div class="material-card" :data-component-type="element.type" :title="element.name">
                <span class="material-card__icon-wrap">
                  <el-icon class="material-card__icon">
                    <component :is="iconComponent(element.icon)" />
                  </el-icon>
                </span>
                <span class="material-card__name">{{ element.name }}</span>
              </div>
            </template>
          </Draggable>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-button class="material-panel__more" text type="primary">更多组件</el-button>
  </aside>
</template>
