import type { ComponentType } from "./schema";

export type FieldValidateType =
  | "none"
  | "email"
  | "url"
  | "phone"
  | "idCard"
  | "number"
  | "integer"
  | "chinese"
  | "english"
  | "custom";

export interface FieldValidateOption {
  label: string;
  value: FieldValidateType;
}

export const fieldValidateTypeOptions: FieldValidateOption[] = [
  { label: "无", value: "none" },
  { label: "邮箱", value: "email" },
  { label: "手机号", value: "phone" },
  { label: "网址", value: "url" },
  { label: "身份证", value: "idCard" },
  { label: "数字", value: "number" },
  { label: "整数", value: "integer" },
  { label: "仅中文", value: "chinese" },
  { label: "仅英文", value: "english" },
  { label: "自定义正则", value: "custom" },
];

export const fieldTypesWithFormatValidation: ComponentType[] = [
  "Input",
  "Textarea",
  "InputNumber",
];

export const validationPropFields = [
  "required",
  "validateType",
  "customPattern",
] as const;

const numericValidateTypes: FieldValidateType[] = [
  "none",
  "number",
  "integer",
  "custom",
];

const basicValidateTypes: FieldValidateType[] = ["none", "custom"];

export function getValidateOptionsForComponentType(
  type: ComponentType,
): FieldValidateOption[] {
  if (type === "Input" || type === "Textarea") {
    return fieldValidateTypeOptions;
  }

  if (type === "InputNumber") {
    return fieldValidateTypeOptions.filter((item) =>
      numericValidateTypes.includes(item.value),
    );
  }

  if (["Switch", "Rate", "Slider", "ColorPicker", "Upload"].includes(type)) {
    return fieldValidateTypeOptions.filter((item) => item.value === "none");
  }

  return fieldValidateTypeOptions.filter((item) =>
    basicValidateTypes.includes(item.value),
  );
}

const formatPatterns: Partial<Record<FieldValidateType, RegExp>> = {
  phone: /^1[3-9]\d{9}$/,
  idCard:
    /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
  number: /^-?\d+(\.\d+)?$/,
  integer: /^-?\d+$/,
  chinese: /^[\u4e00-\u9fa5]+$/,
  english: /^[A-Za-z]+$/,
};

const formatMessages: Partial<Record<FieldValidateType, string>> = {
  email: "请输入正确的邮箱",
  url: "请输入正确的网址",
  phone: "请输入正确的手机号",
  idCard: "请输入正确的身份证号",
  number: "请输入数字",
  integer: "请输入整数",
  chinese: "只能输入中文",
  english: "只能输入英文字母",
  custom: "格式不正确",
};

export function readValidateType(
  props: Record<string, unknown>,
): FieldValidateType {
  const value = props.validateType;
  if (
    typeof value === "string" &&
    fieldValidateTypeOptions.some((item) => item.value === value)
  ) {
    return value as FieldValidateType;
  }

  return "none";
}

function needsCustomRequiredCheck(componentType: ComponentType): boolean {
  return ["Rate", "Switch", "CheckboxGroup", "Slider", "Upload", "InputNumber"].includes(
    componentType,
  );
}

function isEmptyFieldValue(
  value: unknown,
  componentType: ComponentType,
): boolean {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  if (Array.isArray(value) && value.length === 0) {
    return true;
  }

  if (componentType === "Rate" && value === 0) {
    return true;
  }

  return false;
}

function formatRuleMessage(
  validateType: FieldValidateType,
  label: string,
): string {
  return formatMessages[validateType] ?? `${label}格式不正确`;
}

function valueToValidateString(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(",");
  }

  return String(value ?? "");
}

function appendGenericFormatRules(
  rules: Record<string, unknown>[],
  params: {
    validateType: FieldValidateType;
    customPattern: string;
    label: string;
    componentType: ComponentType;
  },
) {
  const { validateType, customPattern, label, componentType } = params;

  if (validateType === "none") {
    return;
  }

  const formatRule = buildFormatRule(validateType, customPattern, label);
  if (!formatRule) {
    return;
  }

  rules.push({
    validator: (
      _rule: unknown,
      value: unknown,
      callback: (error?: Error) => void,
    ) => {
      if (isEmptyFieldValue(value, componentType)) {
        callback();
        return;
      }

      const testValue = valueToValidateString(value);
      const message = String(
        formatRule.message ?? formatRuleMessage(validateType, label),
      );

      if (formatRule.type === "email") {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(testValue)) {
          callback(new Error(message));
          return;
        }
      } else if (formatRule.type === "url") {
        try {
          new URL(testValue);
        } catch {
          callback(new Error(message));
          return;
        }
      } else if (
        formatRule.pattern instanceof RegExp &&
        !formatRule.pattern.test(testValue)
      ) {
        callback(new Error(message));
        return;
      }

      callback();
    },
    trigger: formatRule.trigger ?? "blur",
  });
}

function buildFormatRule(
  validateType: FieldValidateType,
  customPattern: string,
  label: string,
): Record<string, unknown> | undefined {
  if (validateType === "none") {
    return undefined;
  }

  if (validateType === "email") {
    return {
      type: "email",
      message: formatRuleMessage("email", label),
      trigger: "blur",
    };
  }

  if (validateType === "url") {
    return {
      type: "url",
      message: formatRuleMessage("url", label),
      trigger: "blur",
    };
  }

  if (validateType === "custom") {
    if (!customPattern) {
      return undefined;
    }

    try {
      return {
        pattern: new RegExp(customPattern),
        message: formatRuleMessage("custom", label),
        trigger: "blur",
      };
    } catch {
      return undefined;
    }
  }

  const pattern = formatPatterns[validateType];
  if (!pattern) {
    return undefined;
  }

  return {
    pattern,
    message: formatRuleMessage(validateType, label),
    trigger: "blur",
  };
}

function buildLengthMessage(
  minLength: number,
  maxLength: number,
  label: string,
): string {
  if (minLength > 0 && maxLength > 0) {
    return `${label}长度需在 ${minLength} 到 ${maxLength} 个字符`;
  }

  if (minLength > 0) {
    return `${label}至少输入 ${minLength} 个字符`;
  }

  return `${label}最多输入 ${maxLength} 个字符`;
}

function buildLengthRules(
  minLength: number,
  maxLength: number,
  label: string,
  componentType: ComponentType,
): Record<string, unknown>[] {
  if (!["Input", "Textarea"].includes(componentType)) {
    return [];
  }

  const safeMin = Math.max(Math.trunc(minLength), 0);
  const safeMax = Math.max(Math.trunc(maxLength), 0);

  if (safeMin <= 0 && safeMax <= 0) {
    return [];
  }

  const rule: Record<string, unknown> = {
    trigger: "blur",
  };

  if (safeMin > 0) {
    rule.min = safeMin;
  }

  if (safeMax > 0) {
    rule.max = safeMax;
  }

  rule.message = buildLengthMessage(safeMin, safeMax, label);
  return [rule];
}

export function buildFieldRules(params: {
  required: boolean;
  validateType: FieldValidateType;
  customPattern: string;
  label: string;
  componentType: ComponentType;
  minLength?: number;
  maxLength?: number;
}): Record<string, unknown>[] {
  const rules: Record<string, unknown>[] = [];
  const {
    required,
    validateType,
    customPattern,
    label,
    componentType,
    minLength = 0,
    maxLength = 0,
  } = params;

  if (required) {
    const requiredMessage = `${label}不能为空`;

    if (needsCustomRequiredCheck(componentType)) {
      rules.push({
        validator: (
          _rule: unknown,
          value: unknown,
          callback: (error?: Error) => void,
        ) => {
          if (isEmptyFieldValue(value, componentType)) {
            callback(new Error(requiredMessage));
            return;
          }

          callback();
        },
        trigger: ["blur", "change"],
      });
    } else {
      rules.push({
        required: true,
        message: requiredMessage,
        trigger: ["blur", "change"],
      });
    }
  }

  if (componentType === "InputNumber") {
    if (validateType === "integer") {
      rules.push({
        validator: (
          _rule: unknown,
          value: unknown,
          callback: (error?: Error) => void,
        ) => {
          if (value === undefined || value === null || value === "") {
            callback();
            return;
          }

          if (!Number.isInteger(Number(value))) {
            callback(new Error(formatRuleMessage("integer", label)));
            return;
          }

          callback();
        },
        trigger: "change",
      });
    } else if (validateType === "number") {
      rules.push({
        validator: (
          _rule: unknown,
          value: unknown,
          callback: (error?: Error) => void,
        ) => {
          if (value === undefined || value === null || value === "") {
            callback();
            return;
          }

          if (Number.isNaN(Number(value))) {
            callback(new Error(formatRuleMessage("number", label)));
            return;
          }

          callback();
        },
        trigger: "change",
      });
    }

    appendGenericFormatRules(rules, {
      validateType,
      customPattern,
      label,
      componentType,
    });
    return rules;
  }

  if (["Input", "Textarea"].includes(componentType)) {
    rules.push(...buildLengthRules(minLength, maxLength, label, componentType));

    const formatRule = buildFormatRule(validateType, customPattern, label);
    if (formatRule) {
      rules.push(formatRule);
    }

    return rules;
  }

  appendGenericFormatRules(rules, {
    validateType,
    customPattern,
    label,
    componentType,
  });
  return rules;
}
