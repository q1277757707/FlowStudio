import { createGridCells, type ComponentType, type LowCodeNode } from '@designer-core/schema';
import { fieldValidateTypeOptions } from '@designer-core/validation';
import { createNodeId } from '@designer-core/id';
import {
  createFlatOptionDataSourceProps,
  createTreeOptionDataSourceProps,
  flatOptionDataSourceSetter,
  treeOptionDataSourceSetter
} from './optionDataSource';

export type SetterType =
  | 'StringSetter'
  | 'NumberSetter'
  | 'SelectSetter'
  | 'BooleanSetter'
  | 'OptionSetter'
  | 'TransferSetter';

export interface MaterialPropOption {
  label: string;
  value: string | number | boolean;
  children?: MaterialPropOption[];
}

export interface MaterialProp {
  field: string;
  label: string;
  type: SetterType;
  defaultValue?: unknown;
  options?: MaterialPropOption[];
}

export interface MaterialMeta {
  type: ComponentType;
  name: string;
  icon: string;
  category: string;
  props: MaterialProp[];
  events: string[];
  setter: Record<string, SetterType>;
  canHaveChildren?: boolean;
}

const textLengthLimitProps = [
  {
    field: 'minLength',
    label: '最少字符',
    type: 'NumberSetter' as const,
    defaultValue: 0
  },
  {
    field: 'maxLength',
    label: '最多字符',
    type: 'NumberSetter' as const,
    defaultValue: 0
  }
];

const textLengthLimitSetter = {
  minLength: 'NumberSetter',
  maxLength: 'NumberSetter'
} as const;

const validationFieldProps = [
  {
    field: 'required',
    label: '必填',
    type: 'BooleanSetter' as const,
    defaultValue: false
  },
  {
    field: 'validateType',
    label: '校验格式',
    type: 'SelectSetter' as const,
    defaultValue: 'none',
    options: fieldValidateTypeOptions
  },
  {
    field: 'customPattern',
    label: '自定义正则',
    type: 'StringSetter' as const,
    defaultValue: ''
  }
];

const validationSetter = {
  required: 'BooleanSetter',
  validateType: 'SelectSetter',
  customPattern: 'StringSetter'
} as const;

const baseFieldProps = [
  {
    field: 'label',
    label: '标签',
    type: 'StringSetter' as const,
    defaultValue: '字段'
  },
  {
    field: 'placeholder',
    label: '占位提示',
    type: 'StringSetter' as const,
    defaultValue: '请选择'
  },
  ...validationFieldProps
];

const defaultOptions = [
  {
    label: '选项一',
    value: 'option1'
  },
  {
    label: '选项二',
    value: 'option2'
  }
];

const defaultTreeOptions = [
  {
    label: '分组一',
    value: 'group1',
    children: [
      {
        label: '选项一',
        value: 'option1'
      }
    ]
  },
  {
    label: '分组二',
    value: 'group2',
    children: [
      {
        label: '选项二',
        value: 'option2'
      }
    ]
  }
];

export const materialList: MaterialMeta[] = [
  {
    type: 'Container',
    name: '栅格',
    icon: 'Grid',
    category: '布局',
    canHaveChildren: true,
    props: [
      {
        field: 'title',
        label: '标题',
        type: 'StringSetter',
        defaultValue: '栅格'
      },
      {
        field: 'layout',
        label: '布局',
        type: 'SelectSetter',
        defaultValue: 'grid',
        options: [
          {
            label: '纵向',
            value: 'vertical'
          },
          {
            label: '网格',
            value: 'grid'
          }
        ]
      },
      {
        field: 'rows',
        label: '行数',
        type: 'NumberSetter',
        defaultValue: 2
      },
      {
        field: 'cols',
        label: '列数',
        type: 'NumberSetter',
        defaultValue: 2
      }
    ],
    events: [],
    setter: {
      title: 'StringSetter',
      layout: 'SelectSetter',
      rows: 'NumberSetter',
      cols: 'NumberSetter'
    }
  },
  {
    type: 'Form',
    name: '表单',
    icon: 'Tickets',
    category: '表单',
    canHaveChildren: true,
    props: [
      {
        field: 'labelWidth',
        label: '标签宽度',
        type: 'NumberSetter',
        defaultValue: 120
      },
      {
        field: 'labelPosition',
        label: '标签位置',
        type: 'SelectSetter',
        defaultValue: 'right',
        options: [
          {
            label: '右侧',
            value: 'right'
          },
          {
            label: '左侧',
            value: 'left'
          },
          {
            label: '顶部',
            value: 'top'
          }
        ]
      }
    ],
    events: [],
    setter: {
      labelWidth: 'NumberSetter',
      labelPosition: 'SelectSetter'
    }
  },
  {
    type: 'Input',
    name: '输入框',
    icon: 'Edit',
    category: '表单',
    props: [
      {
        field: 'label',
        label: '标签',
        type: 'StringSetter',
        defaultValue: '字段'
      },
      {
        field: 'placeholder',
        label: '占位提示',
        type: 'StringSetter',
        defaultValue: '请输入'
      },
      ...textLengthLimitProps,
      ...validationFieldProps
    ],
    events: ['change', 'focus', 'blur'],
    setter: {
      label: 'StringSetter',
      placeholder: 'StringSetter',
      ...textLengthLimitSetter,
      ...validationSetter
    }
  },
  {
    type: 'Textarea',
    name: '多行文本',
    icon: 'Document',
    category: '表单',
    props: [
      {
        field: 'label',
        label: '标签',
        type: 'StringSetter',
        defaultValue: '多行文本'
      },
      {
        field: 'placeholder',
        label: '占位提示',
        type: 'StringSetter',
        defaultValue: '请输入内容'
      },
      {
        field: 'rows',
        label: '行数',
        type: 'NumberSetter',
        defaultValue: 3
      },
      ...textLengthLimitProps,
      ...validationFieldProps
    ],
    events: ['input', 'change', 'focus', 'blur'],
    setter: {
      label: 'StringSetter',
      placeholder: 'StringSetter',
      rows: 'NumberSetter',
      ...textLengthLimitSetter,
      ...validationSetter
    }
  },
  {
    type: 'InputNumber',
    name: '数字输入',
    icon: 'Sort',
    category: '表单',
    props: [
      {
        field: 'label',
        label: '标签',
        type: 'StringSetter',
        defaultValue: '数字'
      },
      {
        field: 'min',
        label: '最小值',
        type: 'NumberSetter',
        defaultValue: 0
      },
      {
        field: 'max',
        label: '最大值',
        type: 'NumberSetter',
        defaultValue: 100
      },
      {
        field: 'step',
        label: '步长',
        type: 'NumberSetter',
        defaultValue: 1
      },
      ...validationFieldProps
    ],
    events: ['change', 'focus', 'blur'],
    setter: {
      label: 'StringSetter',
      min: 'NumberSetter',
      max: 'NumberSetter',
      step: 'NumberSetter',
      ...validationSetter
    }
  },
  {
    type: 'Select',
    name: '下拉选择',
    icon: 'Select',
    category: '表单',
    props: [
      ...baseFieldProps,
      ...createFlatOptionDataSourceProps(),
      {
        field: 'options',
        label: '选项配置',
        type: 'OptionSetter',
        defaultValue: defaultOptions
      },
      {
        field: 'multiple',
        label: '多选',
        type: 'BooleanSetter',
        defaultValue: false
      },
      {
        field: 'defaultValue',
        label: '默认值',
        type: 'StringSetter',
        defaultValue: ''
      }
    ],
    events: ['change', 'visible-change', 'clear'],
    setter: {
      label: 'StringSetter',
      placeholder: 'StringSetter',
      ...flatOptionDataSourceSetter,
      options: 'OptionSetter',
      multiple: 'BooleanSetter',
      defaultValue: 'StringSetter',
      ...validationSetter
    }
  },
  {
    type: 'RadioGroup',
    name: '单选框组',
    icon: 'CircleCheck',
    category: '表单',
    props: [
      {
        field: 'label',
        label: '标签',
        type: 'StringSetter',
        defaultValue: '单选'
      },
      ...createFlatOptionDataSourceProps(),
      {
        field: 'options',
        label: '选项配置',
        type: 'OptionSetter',
        defaultValue: defaultOptions
      },
      ...validationFieldProps
    ],
    events: ['change', 'visible-change'],
    setter: {
      label: 'StringSetter',
      ...flatOptionDataSourceSetter,
      options: 'OptionSetter',
      ...validationSetter
    }
  },
  {
    type: 'CheckboxGroup',
    name: '多选框组',
    icon: 'Finished',
    category: '表单',
    props: [
      {
        field: 'label',
        label: '标签',
        type: 'StringSetter',
        defaultValue: '多选'
      },
      ...createFlatOptionDataSourceProps(),
      {
        field: 'options',
        label: '选项配置',
        type: 'OptionSetter',
        defaultValue: defaultOptions
      },
      ...validationFieldProps
    ],
    events: ['change'],
    setter: {
      label: 'StringSetter',
      ...flatOptionDataSourceSetter,
      options: 'OptionSetter',
      ...validationSetter
    }
  },
  {
    type: 'Switch',
    name: '开关',
    icon: 'SwitchButton',
    category: '表单',
    props: [
      {
        field: 'label',
        label: '标签',
        type: 'StringSetter',
        defaultValue: '开关'
      },
      {
        field: 'activeText',
        label: '开启文案',
        type: 'StringSetter',
        defaultValue: '开'
      },
      {
        field: 'inactiveText',
        label: '关闭文案',
        type: 'StringSetter',
        defaultValue: '关'
      },
      ...validationFieldProps
    ],
    events: ['change'],
    setter: {
      label: 'StringSetter',
      activeText: 'StringSetter',
      inactiveText: 'StringSetter',
      ...validationSetter
    }
  },
  {
    type: 'DatePicker',
    name: '日期选择',
    icon: 'Calendar',
    category: '表单',
    props: [
      ...baseFieldProps,
      {
        field: 'dateType',
        label: '日期类型',
        type: 'SelectSetter',
        defaultValue: 'date',
        options: [
          {
            label: '日期',
            value: 'date'
          },
          {
            label: '日期时间',
            value: 'datetime'
          },
          {
            label: '日期范围',
            value: 'daterange'
          }
        ]
      }
    ],
    events: ['change', 'focus', 'blur'],
    setter: {
      label: 'StringSetter',
      placeholder: 'StringSetter',
      dateType: 'SelectSetter',
      ...validationSetter
    }
  },
  {
    type: 'TimePicker',
    name: '时间选择',
    icon: 'Timer',
    category: '表单',
    props: baseFieldProps,
    events: ['change', 'focus', 'blur'],
    setter: {
      label: 'StringSetter',
      placeholder: 'StringSetter',
      ...validationSetter
    }
  },
  {
    type: 'Slider',
    name: '滑块',
    icon: 'Operation',
    category: '表单',
    props: [
      {
        field: 'label',
        label: '标签',
        type: 'StringSetter',
        defaultValue: '滑块'
      },
      {
        field: 'min',
        label: '最小值',
        type: 'NumberSetter',
        defaultValue: 0
      },
      {
        field: 'max',
        label: '最大值',
        type: 'NumberSetter',
        defaultValue: 100
      },
      {
        field: 'step',
        label: '步长',
        type: 'NumberSetter',
        defaultValue: 1
      },
      ...validationFieldProps
    ],
    events: ['change', 'input'],
    setter: {
      label: 'StringSetter',
      min: 'NumberSetter',
      max: 'NumberSetter',
      step: 'NumberSetter',
      ...validationSetter
    }
  },
  {
    type: 'Rate',
    name: '评分',
    icon: 'Star',
    category: '表单',
    props: [
      {
        field: 'label',
        label: '标签',
        type: 'StringSetter',
        defaultValue: '评分'
      },
      {
        field: 'max',
        label: '最大分值',
        type: 'NumberSetter',
        defaultValue: 5
      },
      ...validationFieldProps
    ],
    events: ['change'],
    setter: {
      label: 'StringSetter',
      max: 'NumberSetter',
      ...validationSetter
    }
  },
  {
    type: 'ColorPicker',
    name: '颜色选择',
    icon: 'Brush',
    category: '表单',
    props: [
      {
        field: 'label',
        label: '标签',
        type: 'StringSetter',
        defaultValue: '颜色'
      },
      {
        field: 'showAlpha',
        label: '透明度',
        type: 'BooleanSetter',
        defaultValue: false
      },
      ...validationFieldProps
    ],
    events: ['change', 'active-change'],
    setter: {
      label: 'StringSetter',
      showAlpha: 'BooleanSetter',
      ...validationSetter
    }
  },
  {
    type: 'Cascader',
    name: '级联选择',
    icon: 'Connection',
    category: '表单',
    props: [
      ...baseFieldProps,
      ...createTreeOptionDataSourceProps(),
      {
        field: 'options',
        label: '选项配置',
        type: 'OptionSetter',
        defaultValue: defaultTreeOptions
      }
    ],
    events: ['change', 'expand-change', 'visible-change'],
    setter: {
      label: 'StringSetter',
      placeholder: 'StringSetter',
      ...treeOptionDataSourceSetter,
      options: 'OptionSetter',
      ...validationSetter
    }
  },
  {
    type: 'TreeSelect',
    name: '树形选择',
    icon: 'Share',
    category: '表单',
    props: [
      ...baseFieldProps,
      ...createTreeOptionDataSourceProps(),
      {
        field: 'data',
        label: '数据配置',
        type: 'OptionSetter',
        defaultValue: defaultTreeOptions
      },
      {
        field: 'multiple',
        label: '多选',
        type: 'BooleanSetter',
        defaultValue: false
      }
    ],
    events: ['change', 'visible-change', 'node-click'],
    setter: {
      label: 'StringSetter',
      placeholder: 'StringSetter',
      ...treeOptionDataSourceSetter,
      data: 'OptionSetter',
      multiple: 'BooleanSetter',
      ...validationSetter
    }
  },
  {
    type: 'Upload',
    name: '上传',
    icon: 'UploadFilled',
    category: '表单',
    props: [
      {
        field: 'label',
        label: '标签',
        type: 'StringSetter',
        defaultValue: '上传'
      },
      {
        field: 'buttonText',
        label: '按钮文案',
        type: 'StringSetter',
        defaultValue: '点击上传'
      },
      {
        field: 'tip',
        label: '提示',
        type: 'StringSetter',
        defaultValue: '支持常见文件格式'
      },
      {
        field: 'multiple',
        label: '多文件',
        type: 'BooleanSetter',
        defaultValue: false
      },
      ...validationFieldProps
    ],
    events: ['change', 'success', 'error', 'remove'],
    setter: {
      label: 'StringSetter',
      buttonText: 'StringSetter',
      tip: 'StringSetter',
      multiple: 'BooleanSetter',
      ...validationSetter
    }
  },
  {
    type: 'Button',
    name: '按钮',
    icon: 'Pointer',
    category: '基础',
    props: [
      {
        field: 'text',
        label: '文案',
        type: 'StringSetter',
        defaultValue: '按钮'
      },
      {
        field: 'type',
        label: '类型',
        type: 'SelectSetter',
        defaultValue: 'primary',
        options: [
          {
            label: '主要',
            value: 'primary'
          },
          {
            label: '成功',
            value: 'success'
          },
          {
            label: '警告',
            value: 'warning'
          },
          {
            label: '危险',
            value: 'danger'
          },
          {
            label: '默认',
            value: ''
          }
        ]
      }
    ],
    events: ['click'],
    setter: {
      text: 'StringSetter',
      type: 'SelectSetter'
    }
  },
  {
    type: 'Text',
    name: '文本',
    icon: 'Document',
    category: '基础',
    props: [
      {
        field: 'text',
        label: '内容',
        type: 'StringSetter',
        defaultValue: '普通文本'
      }
    ],
    events: [],
    setter: {
      text: 'StringSetter'
    }
  }
];

export function createNodeFromMaterial(material: MaterialMeta): LowCodeNode {
  const props = material.props.reduce<Record<string, unknown>>((result, prop) => {
    result[prop.field] = prop.defaultValue;
    return result;
  }, {});

  if (material.type === 'Container') {
    const rows = Number(props.rows ?? 2);
    const cols = Number(props.cols ?? 2);

    return {
      id: createNodeId(material.type),
      type: material.type,
      props,
      children: [],
      gridCells: createGridCells(rows, cols)
    };
  }

  return {
    id: createNodeId(material.type),
    type: material.type,
    props,
    children: material.canHaveChildren ? [] : undefined
  };
}

export function getMaterialByType(type: ComponentType): MaterialMeta | undefined {
  return materialList.find((material) => material.type === type);
}

export function materialHasValidationSettings(material: MaterialMeta): boolean {
  const fields = ['required', 'validateType', 'customPattern'] as const;

  return fields.some(
    (field) => material.props.some((prop) => prop.field === field) || field in material.setter
  );
}

export * from './dragRules';
export * from './optionDataSource';
