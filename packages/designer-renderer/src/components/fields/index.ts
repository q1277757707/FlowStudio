import type { Component } from 'vue';
import type { ComponentType } from '@designer-core/schema';
import ButtonField from './ButtonField.vue';
import CascaderField from './CascaderField.vue';
import CheckboxGroupField from './CheckboxGroupField.vue';
import ColorPickerField from './ColorPickerField.vue';
import DatePickerField from './DatePickerField.vue';
import InputField from './InputField.vue';
import InputNumberField from './InputNumberField.vue';
import RadioGroupField from './RadioGroupField.vue';
import RateField from './RateField.vue';
import SelectField from './SelectField.vue';
import SliderField from './SliderField.vue';
import SwitchField from './SwitchField.vue';
import TextField from './TextField.vue';
import TextareaField from './TextareaField.vue';
import TimePickerField from './TimePickerField.vue';
import TreeSelectField from './TreeSelectField.vue';
import UploadField from './UploadField.vue';

export const fieldRendererMap: Partial<Record<ComponentType, Component>> = {
  Input: InputField,
  Textarea: TextareaField,
  InputNumber: InputNumberField,
  Select: SelectField,
  RadioGroup: RadioGroupField,
  CheckboxGroup: CheckboxGroupField,
  Switch: SwitchField,
  DatePicker: DatePickerField,
  TimePicker: TimePickerField,
  Slider: SliderField,
  Rate: RateField,
  ColorPicker: ColorPickerField,
  Cascader: CascaderField,
  TreeSelect: TreeSelectField,
  Upload: UploadField,
  Button: ButtonField,
  Text: TextField
};

export function getFieldRenderer(type: ComponentType): Component | undefined {
  return fieldRendererMap[type];
}

export function registerFieldRenderer(type: ComponentType, component: Component) {
  fieldRendererMap[type] = component;
}
