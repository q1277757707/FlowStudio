import type { EventActionType } from '@designer-core/schema';

export interface ActionTypeMeta {
  type: EventActionType;
  label: string;
  description: string;
  defaultConfig: Record<string, unknown>;
}

export const actionTypeList: ActionTypeMeta[] = [
  {
    type: 'setVariable',
    label: '设置变量',
    description:
      '可一次写入多个页面变量（值支持 {{ }} 表达式），预览中用 {{variables.变量名}} 读取。',
    defaultConfig: {
      variables: [{ key: 'varName', value: '{{event.value}}' }]
    }
  },
  {
    type: 'setVisible',
    label: '显示/隐藏组件',
    description: '控制指定节点在预览中的显隐（componentId 为节点 ID）',
    defaultConfig: { componentId: 'target_node_id', visible: true }
  },
  {
    type: 'setFormValue',
    label: '组件赋值',
    description:
      '写入目标组件：下拉等赋 list 更新选项、list[0].value 设选中值、[] 清空；其它组件写 form 值。',
    defaultConfig: {
      assignments: [{ componentId: '', value: '{{variables.lastResponse}}' }]
    }
  },
  {
    type: 'message',
    label: '显示消息',
    description: '弹出消息提示',
    defaultConfig: { type: 'success', content: '操作成功' }
  },
  {
    type: 'request',
    label: '请求接口',
    description:
      '调用 HTTP 接口；参数支持 {{ }} 表达式；成功后写入 variables.lastResponse，并可配置「成功后赋值」写入组件。',
    defaultConfig: {
      url: '/api/demo',
      method: 'GET',
      params: { keyword: '{{event.value}}' },
      assignments: []
    }
  },
  {
    type: 'dialog',
    label: '弹窗',
    description: '确认框或提示框',
    defaultConfig: { type: 'alert', title: '提示', message: '确定继续吗？' }
  },
  {
    type: 'navigate',
    label: '页面跳转',
    description: '跳转到指定地址',
    defaultConfig: { url: '/' }
  },
  {
    type: 'delay',
    label: '延迟',
    description: '延迟执行后续动作（毫秒）',
    defaultConfig: { ms: 300 }
  },
  {
    type: 'condition',
    label: '条件分支',
    description: '按表达式执行不同动作链',
    defaultConfig: {
      expression: '{{event.value}}',
      trueActions: [],
      falseActions: []
    }
  },
  {
    type: 'loop',
    label: '循环',
    description: '遍历数据源执行子动作',
    defaultConfig: { dataSource: '{{variables.list}}', actions: [] }
  },
  {
    type: 'customJS',
    label: '自定义 JS',
    description: '在 Proxy+with 沙箱中执行脚本',
    defaultConfig: { code: "message({ type: 'info', message: 'hello' })" }
  },
  {
    type: 'reload',
    label: '刷新页面',
    description: '重新加载当前页面',
    defaultConfig: {}
  },
  {
    type: 'emit',
    label: '触发事件',
    description: '触发嵌套动作链',
    defaultConfig: { eventName: 'custom', actions: [] }
  }
];

export function getActionMeta(type: EventActionType): ActionTypeMeta | undefined {
  return actionTypeList.find((item) => item.type === type);
}

/** 支持可视化表单配置的动作（不含条件分支、循环、自定义 JS 等） */
export const visualActionConfigTypes = actionTypeList.filter(
  (item) => !['condition', 'loop', 'emit', 'customJS'].includes(item.type)
  // setFormValue 允许嵌套在条件分支内
);

/** @deprecated 使用 visualActionConfigTypes */
export const nestedBranchActionTypes = visualActionConfigTypes;

export function supportsVisualActionConfig(type: EventActionType | undefined): boolean {
  if (!type) {
    return false;
  }

  return visualActionConfigTypes.some((item) => item.type === type);
}
