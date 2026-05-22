export const OPTION_SOURCE_COMPONENT_TYPES = [
  'Select',
  'RadioGroup',
  'CheckboxGroup',
  'Cascader',
  'TreeSelect'
] as const;

export type OptionSourceComponentType = (typeof OPTION_SOURCE_COMPONENT_TYPES)[number];

export const OPTION_API_PROP_FIELDS = [
  'requestUrl',
  'requestMethod',
  'requestParams',
  'dataPath',
  'labelField',
  'valueField',
  'childrenField'
] as const;

export const OPTION_STATIC_PROP_FIELDS = ['options', 'data'] as const;

export function isOptionSourceComponent(type: string): type is OptionSourceComponentType {
  return (OPTION_SOURCE_COMPONENT_TYPES as readonly string[]).includes(type);
}

export function isOptionApiProp(field: string): boolean {
  return (OPTION_API_PROP_FIELDS as readonly string[]).includes(field);
}

export function isOptionStaticProp(field: string): boolean {
  return (OPTION_STATIC_PROP_FIELDS as readonly string[]).includes(field);
}

export function isTreeOptionComponent(type: string): boolean {
  return type === 'Cascader' || type === 'TreeSelect';
}

/** 接口数据源默认配置（切换为 api 或请求时兜底） */
export function getOptionApiDefaultProps(type: string): Record<string, unknown> {
  const tree = isTreeOptionComponent(type);

  return {
    requestUrl: tree ? '/api/options/tree' : '/api/options/list',
    requestMethod: 'GET',
    requestParams: '{}',
    dataPath: tree ? 'data.tree' : 'data.list',
    labelField: 'label',
    valueField: 'value',
    ...(tree ? { childrenField: 'children' } : {})
  };
}

const requestMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' }
];

/** 平铺选项（下拉 / 单选 / 多选） */
export function createFlatOptionDataSourceProps() {
  return [
    {
      field: 'optionsSource',
      label: '数据来源',
      type: 'SelectSetter' as const,
      defaultValue: 'static',
      options: [
        { label: '静态配置', value: 'static' },
        { label: '接口请求', value: 'api' }
      ]
    },
    {
      field: 'requestUrl',
      label: '接口地址',
      type: 'StringSetter' as const,
      defaultValue: '/api/options/list'
    },
    {
      field: 'requestMethod',
      label: '请求方式',
      type: 'SelectSetter' as const,
      defaultValue: 'GET',
      options: requestMethodOptions
    },
    {
      field: 'requestParams',
      label: '请求参数',
      type: 'StringSetter' as const,
      defaultValue: '{}'
    },
    {
      field: 'dataPath',
      label: '数据路径',
      type: 'StringSetter' as const,
      defaultValue: 'data.list'
    },
    {
      field: 'labelField',
      label: '显示字段',
      type: 'StringSetter' as const,
      defaultValue: 'label'
    },
    {
      field: 'valueField',
      label: '值字段',
      type: 'StringSetter' as const,
      defaultValue: 'value'
    }
  ];
}

/** 树形选项（级联 / 树选择），含 children 字段映射 */
export function createTreeOptionDataSourceProps() {
  return [
    ...createFlatOptionDataSourceProps().map((prop) => {
      if (prop.field === 'requestUrl') {
        return { ...prop, defaultValue: '/api/options/tree' };
      }
      if (prop.field === 'dataPath') {
        return { ...prop, defaultValue: 'data.tree' };
      }
      return prop;
    }),
    {
      field: 'childrenField',
      label: '子节点字段',
      type: 'StringSetter' as const,
      defaultValue: 'children'
    }
  ];
}

export const flatOptionDataSourceSetter = {
  optionsSource: 'SelectSetter' as const,
  requestUrl: 'StringSetter' as const,
  requestMethod: 'SelectSetter' as const,
  requestParams: 'StringSetter' as const,
  dataPath: 'StringSetter' as const,
  labelField: 'StringSetter' as const,
  valueField: 'StringSetter' as const
};

export const treeOptionDataSourceSetter = {
  ...flatOptionDataSourceSetter,
  childrenField: 'StringSetter' as const
};
