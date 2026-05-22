<script setup lang="ts">
import type { LowCodeNode } from "@designer-core/schema";
import { useFieldValidation } from "../composables/useFieldValidation";
import type { RendererMode } from "../types";

const props = defineProps<{
  mode: RendererMode;
  node: LowCodeNode;
}>();

const { label, required, fieldProp, rules, isPreview } = useFieldValidation(
  props.node,
  props.mode,
);
</script>

<template>
  <el-form-item
    :label="label"
    :prop="fieldProp"
    :class="{ 'is-required': required }"
    :required="isPreview ? undefined : required"
    :rules="rules"
  >
    <slot />
  </el-form-item>
</template>
