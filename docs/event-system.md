# FlowStudio 事件系统设计文档

> 本文档描述 FlowStudio 已实现的事件引擎能力，对应代码包 `packages/designer-event`。

**不会用？先看使用指南：** [event-user-guide.md](./event-user-guide.md)（含界面步骤与 [示例文档](./examples/README.md) / [示例 Schema](./examples/event-demo-schema.json)）。

## 一、事件系统目标

实现一个**可视化、配置化、插件化、异步化、可编排**的事件引擎，参考钉钉宜搭、阿里 LowCode Engine、飞书低代码等平台。

系统支持：

- 页面事件（如 `pageLoad`）
- 组件事件（`click`、`change`、`blur` 等）
- 动作链顺序执行
- 条件分支（`condition`）
- 循环（`loop`）
- 自定义 JS（`customJS`，Proxy + with 沙箱）
- 变量联动（`setVariable` + `{{ }}` 表达式）
- 动作执行日志

---

## 二、整体架构

```txt
Event Trigger（组件/页面触发）
        ↓
Event Dispatcher（事件调度）
        ↓
Action Runner（动作链执行器）
        ↓
Action Registry（插件注册表）
        ↓
Action Executor（各 Action 实现）
        ↓
Runtime Context（运行时上下文）
        ↓
Expression Resolver（表达式解析）
        ↓
Sandbox（packages/designer-sandbox，Proxy + with）
```

| 模块 | 路径 | 说明 |
| --- | --- | --- |
| Event Dispatcher | `designer-event/runner/EventDispatcher.ts` | 合并事件 payload，调度动作链 |
| Action Runner | `designer-event/runner/ActionRunner.ts` | 顺序执行、日志、错误策略 |
| Action Registry | `designer-event/registry/ActionRegistry.ts` | Action 插件注册 |
| Runtime Context | `designer-event/context/RuntimeContext.ts` | 统一运行时上下文 |
| Expression | `designer-event/expression/ExpressionResolver.ts` | `{{ }}` 与表达式求值 |
| Sandbox | `packages/designer-sandbox` | Proxy + with，禁止裸 `eval` |

---

## 三、核心设计原则

### 1. 配置化

禁止在物料中写死 `onClick(){ request() }`，统一使用 Schema：

```json
{
  "events": {
    "change": [
      {
        "id": "action_001",
        "action": "setVariable",
        "config": {
          "key": "form_name",
          "value": "{{event.value}}"
        }
      },
      {
        "id": "action_002",
        "action": "message",
        "config": {
          "type": "success",
          "content": "保存成功"
        }
      }
    ]
  }
}
```

### 2. 插件化

通过 `ActionRegistry.register(type, action)` 扩展新动作，内置动作在 `registerBuiltinActions.ts` 中注册。

### 3. 异步化

所有 Action 实现 `async execute(config, ctx)`，Runner 使用 `await` 顺序执行。

### 4. 可编排

- 顺序执行：动作数组按序执行
- 条件分支：`condition` → `trueActions` / `falseActions`
- 循环：`loop` → `dataSource` + `actions`
- 延迟：`delay` → `ms`
- 嵌套触发：`emit`

### 5. 沙箱隔离

表达式与 `customJS` 通过 `packages/designer-sandbox` 的 **Proxy + with** 执行，仅可访问注入的 `form`、`variables`、`event`、`message` 等白名单对象。

> 说明：文档早期版本提到 iframe 沙箱；**当前实现与 `lowcode-design.md` 第十章一致，采用 Proxy + with**。公网不可信用户代码场景建议另行评估 iframe / Worker。

---

## 四、目录结构

```txt
packages/designer-event/src/
├── actions/           # 各 Action 实现
├── runner/            # ActionRunner、EventDispatcher
├── registry/          # ActionRegistry、registerBuiltinActions
├── context/           # RuntimeContext 工具
├── expression/        # ExpressionResolver
├── log/               # EventLogger
├── types/             # 类型定义
└── index.ts           # 对外导出 runEventActions
```

设计器 UI：

```txt
packages/app-designer/src/
├── components/EventPanel.vue    # 事件配置面板
└── constants/eventActions.ts    # 动作元数据与默认 config
```

---

## 五、Schema 设计

### 5.1 组件事件

```ts
// packages/designer-core/src/schema.ts
interface LowCodeNode {
  events?: Record<string, EventAction[]>;
}

interface EventAction {
  id?: string;
  action: EventActionType;  // 主字段
  type?: EventActionType;   // 与 action 等价
  config?: Record<string, unknown>;
}
```

### 5.2 页面事件

```ts
interface PageSchema {
  pageEvents?: Record<string, EventAction[]>;
}
```

预览打开时自动执行 `pageEvents.pageLoad`（若已配置）。

### 5.3 支持的动作类型

| type | 说明 |
| --- | --- |
| request | HTTP 请求（fetch） |
| setVariable | 设置页面变量 |
| message | 消息提示 |
| dialog | 弹窗（alert/confirm） |
| navigate | 页面跳转 |
| reload | 刷新页面 |
| emit | 触发嵌套动作链 |
| condition | 条件分支 |
| loop | 循环子动作 |
| delay | 延迟 |
| customJS | 自定义脚本（沙箱） |
| setVisible | 预览态显示/隐藏指定节点 |

---

## 六、Runtime Context

预览态由 `useRendererRuntime` 构建：

```ts
{
  form: Record<string, unknown>;       // 字段值，key 为节点 id
  variables: Record<string, unknown>; // 页面变量
  pageState: Record<string, unknown>;  // 与 variables 同源
  components: Record<string, unknown>;
  event: Record<string, unknown>;      // 当前事件 payload
  message, dialog, router, api        // 注入的平台能力
}
```

触发字段 `change` 时，`event` 中包含 `{ value }`。

---

## 七、表达式

支持：

```txt
{{form.nodeId}}
{{variables.submitResult}}
{{event.value}}
```

由 `ExpressionResolver` 调用 `evaluateTemplate` / `runExpression`（designer-sandbox）求值。

---

## 八、执行流程

设计器内配置步骤与可复制示例见 **[event-user-guide.md](./event-user-guide.md)**。

### 8.1 预览按钮点击

```txt
ButtonField @click
  → useRendererRuntime.handleButtonClick
  → dispatchNodeEvent(node, 'click')
  → runEventActions(actions, ctx)
```

### 8.2 输入框值变化

```txt
InputField @update:model-value
  → useFieldBinding.onUpdate
  → useFieldEvents.onChange
  → runEventActions(node.events.change, ctx)
```

### 8.3 设计器配置

底部 **事件配置** 面板（`EventPanel.vue`）：

1. 选择画布组件
2. 选择触发事件（来自物料 `events` 列表）
3. 添加/删除/排序动作
4. JSON 编辑 `config`

---

## 九、日志与错误

- 每条动作记录 `start` / `success` / `error` 及 `duration`
- 默认 `continueOnError: true`（预览态），单条失败不中断整条链
- 日志写入 `runtime.eventLogs`（最近 100 条）

---

## 十、扩展新 Action

```ts
import { BaseAction } from '@designer-event/actions/BaseAction';
import { globalActionRegistry } from '@designer-event';

class MyAction extends BaseAction {
  async execute(config, ctx) {
    // ...
    return this.success();
  }
}

globalActionRegistry.register('myAction', new MyAction());
```

并在 `designer-core` 的 `EventActionType` 与 `eventActions.ts` 元数据中补充类型。

---

## 十一、配置示例

### 值改变 → 设置变量 + 提示

```json
{
  "change": [
    {
      "id": "action_1",
      "action": "setVariable",
      "config": {
        "key": "form_name",
        "value": "{{event.value}}"
      }
    },
    {
      "id": "action_2",
      "action": "message",
      "config": {
        "type": "success",
        "content": "输入成功"
      }
    }
  ]
}
```

### 条件分支

```json
{
  "action": "condition",
  "config": {
    "expression": "{{event.value}}",
    "trueActions": [
      { "action": "message", "config": { "type": "success", "content": "有值" } }
    ],
    "falseActions": [
      { "action": "message", "config": { "type": "warning", "content": "为空" } }
    ]
  }
}
```

---

## 十二、后续规划

### 已实现（相对初版规划）

- [x] 内置 `request` / `setVariable` / `message` / `dialog` / `navigate` 等动作
- [x] 设计器底部事件面板与常用动作**可视化 config**（非纯 JSON）
- [x] 条件分支可视化（`ConditionBranchEditor`）
- [x] `setFormValue`、请求成功后 `assignments`、动态更新下拉选项
- [x] 预览 `pageEvents.pageLoad` 运行时执行
- [x] `eventLogs` 运行时收集（最近 100 条）

### 待实现

- [ ] 动作链拖拽排序
- [ ] 可视化表达式编辑器
- [ ] 并行执行（parallel）
- [ ] **eventLogs 可视化调试面板**（设计器内查看）
- [ ] **页面级事件 UI**（`pageLoad` 等配置入口）
- [ ] Dock「变量 / 数据源 / 页面设置」完整能力
- [ ] Schema 一键导入、`loop` / `emit` / `customJS` 专用表单
- [ ] 工作流 / AI 编排对接
