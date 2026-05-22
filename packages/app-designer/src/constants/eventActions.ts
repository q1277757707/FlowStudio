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
    description: '写入页面变量，支持 {{ }} 表达式',
    defaultConfig: { key: 'varName', value: '{{event.value}}' }
  },
  {
    type: 'setVisible',
    label: '显示/隐藏组件',
    description: '控制指定节点在预览中的显隐（componentId 为节点 ID）',
    defaultConfig: { componentId: 'target_node_id', visible: true }
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
    description: '调用 HTTP 接口',
    defaultConfig: { url: '/api/demo', method: 'GET', params: {} }
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
