# FlowStudio 需求设计文档

## 一、项目背景

**FlowStudio** 是一个用于构建企业工作流、事件编排与动态应用的可视化低代码平台。采用 Vue3 + Element Plus 技术栈，实现可视化页面设计、组件拖拽、JSON Schema 驱动渲染、变量系统、事件系统、远程物料加载、沙箱隔离运行以及页面预览等核心能力。

平台需支持：

- 页面拖拽式搭建
- 组件动态渲染
- JSON Schema 配置驱动
- 变量与表达式系统
- 事件动作链
- 撤销重做
- Proxy + with 沙箱（表达式 / customJS）
- 页面预览与发布
- 远程物料动态加载

## 二、整体架构设计

系统采用模块化架构：

```txt
packages/
├── designer-core
├── designer-renderer
├── designer-materials
├── designer-event（已实现，见 docs/event-system.md）
├── designer-workflow（已实现，见 docs/workflow-design.md）
├── designer-variable
├── designer-history
├── designer-sandbox
├── designer-preview
├── designer-server
└── app-designer
```

| 模块 | 说明 |
| --- | --- |
| designer-core | 核心 Schema、节点操作、通用类型；流程模板编译（`workflow.ts`） |
| designer-renderer | Schema 渲染器 |
| designer-materials | 物料协议与物料注册 |
| designer-event | 事件动作链引擎（ActionRegistry / Runner / Dispatcher） |
| designer-workflow | 流程设计画布（Workflow）、节点/条件抽屉、`useWorkflowStore` |
| designer-variable | 变量与表达式系统 |
| designer-history | 撤销重做 |
| designer-sandbox | JS 沙箱（Proxy + with，已实现） |
| designer-preview | 页面预览（合并在 renderer `mode=preview`） |
| designer-server | 远程物料服务 |
| app-designer | 可视化设计器 Shell（表单设计 + 流程/基础信息步骤与宿主桥接） |

## 三、设计器页面结构

页面布局参考钉钉宜搭：

```txt
┌─────────────────────────┐
│ 顶部工具栏              │
├──────┬──────────┬───────┤
│物料区│ 设计画布 │右侧面板│
│      │          │属性/事件│
│      │          │变量/日志│
└─────────────────────────┘
```

| 区域 | 功能 |
| --- | --- |
| 物料区 | 拖拽组件 |
| 设计画布 | 页面设计、Schema 渲染、组件选中 |
| 右侧面板 | 通过选项卡管理属性、事件、变量、日志和 Schema |

## 四、JSON Schema 设计

低代码平台核心采用 JSON Schema 驱动。所有页面、组件、事件、变量均采用 JSON 描述。

### 4.1 页面 Schema 示例

```json
{
  "pageId": "page_001",
  "pageName": "画布",
  "components": [
    {
      "id": "form_001",
      "type": "Form",
      "props": {
        "labelWidth": 120
      },
      "children": [
        {
          "id": "input_001",
          "type": "Input",
          "props": {
            "label": "姓名",
            "placeholder": "请输入姓名"
          },
          "model": "form.name"
        },
        {
          "id": "button_001",
          "type": "Button",
          "props": {
            "text": "提交",
            "type": "primary"
          },
          "events": {
            "click": [
              {
                "action": "request",
                "config": {
                  "url": "/api/save",
                  "method": "POST"
                }
              },
              {
                "action": "message",
                "config": {
                  "type": "success",
                  "content": "提交成功"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## 五、组件物料系统设计

组件物料必须具备以下能力：

| 字段 | 说明 |
| --- | --- |
| type | 组件类型 |
| name | 组件名称 |
| icon | 图标 |
| props | 属性配置 |
| events | 支持事件 |
| setter | 属性编辑器 |

### 5.1 组件协议示例

```js
export default {
  type: 'Button',
  name: '按钮',
  icon: 'el-icon-plus',
  props: [
    {
      field: 'text',
      type: 'string',
      defaultValue: '按钮'
    }
  ],
  events: ['click'],
  setter: {
    text: 'StringSetter'
  }
}
```

## 六、远程物料加载设计

系统需支持远程组件动态加载。

### 6.1 加载协议

```json
{
  "name": "Button",
  "url": "https://cdn.xxx.com/button.js"
}
```

### 6.2 加载方式

```js
await import(url)
```

或者：

```js
new Function(code)
```

远程组件须在 **iframe 沙箱**（规划）中运行；页面内表达式与 `customJS` 使用 **Proxy + with**（见第十章），二者不可混用。

## 七、变量系统设计

变量系统用于实现动态数据绑定。

| 类型 | 说明 |
| --- | --- |
| pageState | 页面状态 |
| formData | 表单数据 |
| userInfo | 用户信息 |
| globalVariable | 全局变量 |
| apiData | 接口数据 |

表达式示例：

```js
{{ form.name }}
{{ userInfo.id }}
{{ table.selectedRows }}
```

表达式须在 **Proxy + with** 沙箱中执行（`packages/designer-sandbox`），不得直接访问全局 `window`：

```js
// 概念示意，实际由 runExpression / evaluateTemplate 封装
const sandbox = createScopeProxy({ form, state, message });
runExpression('form.name', sandbox);
```

模板 `{{ form.name }}` 由 `evaluateTemplate` 解析后走同一套沙箱。

## 八、事件系统设计

> **详细设计见 [event-system.md](./event-system.md)**。以下为摘要。

事件系统采用 **配置化动作链 + 插件化 Registry**，核心包 `packages/designer-event`：

```txt
Event Dispatcher → Action Runner → Action Registry → 各 Action 实现
```

| 动作 | 说明 |
| --- | --- |
| request | 请求接口 |
| setVariable | 设置变量 |
| message | 消息提示 |
| dialog | 弹窗 |
| navigate | 页面跳转 |
| condition | 条件分支 |
| loop | 循环 |
| delay | 延迟 |
| customJS | 自定义 JS（Proxy + with 沙箱） |

组件 `events` 与页面 `pageEvents` 均存于 Schema；设计器底部 **事件配置** 面板可可视化编辑。预览态通过 `runEventActions` 执行，字段 `change` 等已接入。

**使用说明（含示例）：** [event-user-guide.md](./event-user-guide.md)、[examples/event-demo-schema.json](./examples/event-demo-schema.json)。

## 九、撤销重做设计

撤销重做采用 Command 模式。

```js
class UpdateNodeCommand {
   execute(){}
   undo(){}
}
```

核心结构：

```txt
undoStack
redoStack
```

数据修改原则：

```js
commandManager.execute(
  new UpdateNodeCommand()
)
```

## 十、沙箱系统设计

本平台**当前采用 Proxy + with 沙箱**（模块 `packages/designer-sandbox`），用于页面内表达式求值、`customJS` 事件脚本等。  
**不使用** `eval(userCode)`，也不对业务脚本裸跑 `new Function(code)`（无隔离参数）。

远程物料 JS 文件隔离属于**另一类场景**，规划用 iframe + postMessage（见 10.6），与下述方案并存、职责分离。

### 10.1 方案：Proxy + with（已实现）

核心思路：用 **Proxy 包装作用域对象**，再在 **`with` 块**内执行用户代码，使用户只能访问注入的 scope，无法通过未声明变量泄漏到全局。

```txt
业务注入 scope（form / state / message …）
        ↓
createScopeProxy(scope)  →  Proxy 代理
        ↓
new Function('__sandbox__', 'with(__sandbox__){ … }')(proxy)
        ↓
返回表达式结果 / 执行脚本副作用
```

标准执行代码（与仓库实现一致）：

```js
import { createScopeProxy, runExpression, runScript } from '@designer-sandbox';

const scope = {
  form: runtimeValues,   // 预览态表单字段值，key 为节点 id
  state: {},
  message: (opts) => { /* ElMessage，白名单 API */ }
};

const sandbox = createScopeProxy(scope);

// 表达式：form.input_xxx
runExpression('form.input_001', sandbox);

// customJS 脚本（多条语句）
runScript("message({ type: 'success', message: '提交' });", sandbox);
```

生成的函数形态：

```js
function (__sandbox__) {
  with (__sandbox__) {
    return (form.name);   // expression 模式
  }
}
```

> **实现约束**：`with` 在 strict 模式下为语法错误，沙箱函数体**禁止**加 `"use strict"`；安全隔离依赖 Proxy 的 `has` / `get` / `set` 拦截，而非 strict 模式。

### 10.2 Proxy 拦截策略

| 陷阱 | 处理方式 |
| --- | --- |
| `with` 向外查找全局变量 | `has()` 对任意属性名返回 `true`，未在 scope 声明的键由 `get` 返回 `undefined`，避免穿透到外层 |
| 逃逸到 `window` / `constructor` 等 | `BLOCKED_SCOPE_KEYS` 黑名单，`get` 返回 `undefined`，`set` / `deleteProperty` 拒绝 |
| 访问 `Symbol.unscopables` | `get` 返回 `undefined`，避免破坏 with 语义 |

黑名单示例（完整列表见 `constants.ts`）：`constructor`、`__proto__`、`eval`、`Function`、`window`、`document`、`globalThis`、`fetch`、`Worker` 等。

### 10.3 作用域注入（白名单）

用户代码**只能**使用显式注入到 `scope` 的变量与函数，不暴露浏览器全局对象。

| 注入名 | 用途 | 当前状态 |
| --- | --- | --- |
| `form` | 预览运行时字段值对象 | 已接入 |
| `state` | 页面状态（预留） | 已占位 |
| `message` | 消息提示 | 已接入（预览按钮事件） |

扩展能力时：在 `createSandboxScope()` 增加字段即可，**不要**把 `window` 传入 scope。

### 10.4 模块 API

| API | 说明 |
| --- | --- |
| `createScopeProxy(scope)` | 将普通对象包装为沙箱 Proxy |
| `runInSandbox(code, scope, { mode })` | 底层执行，`mode`: `expression` \| `script` |
| `runExpression(expr, scope)` | 执行表达式并返回值 |
| `runScript(code, scope)` | 执行脚本语句（customJS） |
| `evaluateTemplate('{{ a }}', scope)` | 模板解析后走 `runExpression` |

错误统一封装为 `SandboxError`。

### 10.5 接入点

| 场景 | 调用链 |
| --- | --- |
| 变量模板 `{{ expr }}` | `evaluateTemplate` → `runExpression` |
| 事件 `customJS` | `runEventActions` → `runScript` |
| 预览按钮点击 | `useRendererRuntime` → `runEventActions` + `createSandboxScope()` |

### 10.6 安全边界（已知限制）

- Proxy + with 适用于**同页面、短脚本、受控 scope**，不能替代进程级隔离。
- 用户仍可在 scope 内调用已注入 API 的副作用（设计如此，靠白名单控制）。
- 不提供任意 `import`、网络、DOM 能力，除非未来显式注入并评审。
- **远程物料 / 第三方完整 JS 文件**不在此沙箱内执行，后续单独用 iframe 沙箱（10.7）。

### 10.7 远程物料沙箱（规划，非当前实现）

远程组件 URL、`import(url)` 加载的完整脚本，计划采用 **iframe + postMessage** 隔离 `window` / `document` / `localStorage`，与 10.1 的 Proxy + with **互补、不混用**。

```txt
主应用
  ↓ postMessage
iframe sandbox
  ↓
执行远程物料代码
```

## 十一、渲染器架构（v1.1.0）

`designer-renderer` 采用分层组件，便于扩展新控件：

```txt
SchemaRenderer（入口，provide 运行时）
└── RendererList（列表，is-edit-mode / is-preview-mode）
    └── RendererNode（按 type 分发）
        ├── ContainerRenderer（网格 / 纵向 + 投放区）
        ├── FormRenderer（el-form + 投放区）
        └── FieldRenderer（薄分发）
            └── fields/*Field.vue（注册表 fieldRendererMap）
```

| 文件 | 职责 |
| --- | --- |
| `composables/useRendererRuntime.ts` | 选中、拖拽子节点、预览 formModel、按钮事件 |
| `composables/useFieldBinding.ts` | 预览态字段双向绑定 |
| `components/FieldFormItem.vue` | 表单项 label、必填、rules |
| `fields/index.ts` | `getFieldRenderer` / `registerFieldRenderer` |

扩展新控件三步：物料定义 → 新增 `XxxField.vue` → 注册表登记。

## 十二、表单校验与字段约束（v1.1.0）

### 12.1 通用校验属性（所有表单物料）

| 属性 | Setter | 说明 |
| --- | --- | --- |
| `required` | BooleanSetter | 必填 |
| `validateType` | SelectSetter | 无 / 邮箱 / 手机 / 网址 / 身份证 / 数字 / 整数 / 仅中文 / 仅英文 / 自定义正则 |
| `customPattern` | StringSetter | 自定义正则字符串 |

规则由 `designer-core/validation.ts` 的 `buildFieldRules` 生成，预览态挂在 `el-form-item` 的 `rules` 上。

### 12.2 长度限制（输入框、多行文本）

| 属性 | 说明 |
| --- | --- |
| `minLength` | 最少字符，0 为不限制 |
| `maxLength` | 最多字符，0 为不限制；大于 0 时显示字数统计 |

## 十三、拖拽投放规则（v1.1.0）

业务规则：

1. **画布**：页面中尚无表单时，**必须先拖入「表单」**；之后才允许容器、按钮、文本等。
2. **表单内**：允许表单字段、容器、按钮、文本；**禁止**嵌套再放入「表单」。
3. **画布 / 容器**：禁止直接投放表单字段（须拖入表单内）。

| 投放区 `data-drop-zone` | 允许 | 禁止 |
| --- | --- | --- |
| `canvas`（已有表单后） | 表单、容器、按钮、文本 | 表单字段 |
| `canvas`（尚无表单） | 仅「表单」 | 其它一切 |
| `container` | 表单、容器、按钮、文本 | 表单字段 |
| `form` | 表单字段、容器、按钮、文本 | **嵌套表单** |

**投放区判定优先级**：指针所在 DOM 向上若同时存在 `form` / `container` / `canvas`，以 **`form` > `container` > `canvas`** 生效，避免表单内部的容器投放区误用容器规则。

实现：`packages/designer-materials/src/dragRules.ts`

- `resolveEffectiveDropZone` / `resolveEffectiveDropZoneAtPoint`：优先级判定
- `schemaHasForm` + `canDropOnCanvas`：画布须先拖表单
- `createDragGroup(zone)`：`group.put` 拦截
- `FormRenderer.onFormChildChange`：兜底移除非法子节点
- 非法投放由 `put` / `move` 拦截（不插入目标列表）

## 十四、预览系统设计

设计器与 Renderer 必须解耦。

编辑模式负责：

- 拖拽
- 属性编辑
- 事件配置

预览模式负责：

- Schema 渲染
- 变量运行
- 事件执行

支持：

- PC 预览
- 移动端预览
- 真机调试

编辑态与预览态样式：

- **编辑态**（`mode=edit`）：容器 / 表单 / 网格保留虚线边框，便于识别投放区。
- **预览态**（`mode=preview`）：`.is-preview-mode` 隐藏设计边框，接近真实页面。

## 十五、推荐技术栈

| 模块 | 技术 |
| --- | --- |
| 前端框架 | Vue3 |
| UI 框架 | Element Plus |
| 状态管理 | Pinia |
| 拖拽 | vuedraggable |
| JSON 编辑器 | jsoneditor |
| 代码编辑器 | monaco-editor |
| 表达式 / customJS 沙箱 | **Proxy + with**（`designer-sandbox`） |
| 远程物料沙箱（规划） | iframe + postMessage |

## 十六、开发阶段建议

### 第一阶段

实现：

- Renderer
- Schema
- 基础拖拽
- 属性面板

### 第二阶段

实现：

- 变量系统
- 事件系统
- 数据源

### 第三阶段

实现：

- iframe 远程物料沙箱（与 Proxy + with 分工）
- 页面预览增强
- 撤销重做

### 第四阶段

实现：

- 远程物料
- 插件系统
- 权限系统
- 多人协同

## 十七、已落地能力总览

> 分版本明细见 **[更新日志](./changelog/README.md)**（`v1.0.0.md`、`v1.1.0.md`、`v1.2.0.md`）。

### v1.0.0（MVP）

- 空画布、物料拖拽、嵌套容器/表单、属性面板、Schema 复制、网格单元格投放。

### v1.1.0

在 v1.0.0 基础上增加：

| 能力 | 说明 |
| --- | --- |
| 渲染器拆分 | `FieldRenderer` + `fields/*` 注册表，易扩展 |
| 表单校验 | 必填、格式、输入框/多行文本长度限制 |
| 沙箱 | `designer-sandbox`，预览 `customJS` / `message` 动作 |
| 拖拽规则 | 表单组件仅能拖入表单；非法投放禁止光标 |
| 预览体验 | 预览无边框、字段可交互、表单校验生效 |
| 物料调整 | 移除穿梭框；容器显示名改为「栅格」 |

### v1.2.0（当前能力基线）

在 v1.1.0 基础上增加，详见 [changelog/v1.2.0.md](./changelog/v1.2.0.md)：

| 能力 | 说明 |
| --- | --- |
| 事件引擎 | `designer-event`：动作注册表、表达式、`runEventActions` |
| 设计器事件面板 | 底部 Dock「事件配置」、常用动作可视化表单、条件分支编辑器 |
| 动作能力 | `request`（axios）、`setVariable`、`setFormValue`、赋值更新下拉选项、`[]` 清空 |
| 选项数据源 | 下拉/单选等支持静态或接口 `/api/options/list|tree`（dev Mock） |
| 撤销重做 | 画布历史栈，Ctrl+Z / Ctrl+Y |
| 文档预览 | `docs-preview.html`，`npm run dev` 可同时打开设计器与文档 |

### 仍未实现（规划）

| 类别 | 项 |
| --- | --- |
| 设计器 Dock | 「变量」「数据源」「页面设置」完整 UI；`pageEvents.pageLoad` 可视化配置 |
| 事件增强 | 动作链拖拽排序、表达式可视化编辑器、parallel、**eventLogs 调试面板** |
| 物料与发布 | iframe 远程物料沙箱；顶栏「发布」、真机预览；Schema 一键导入 |
| 其它 | 属性面板内嵌事件 / customJS 可视化；`loop` / `emit` 专用表单；AI 编排 |
| 流程设计 | 已实现于 `designer-workflow`，见 [workflow-design.md](./workflow-design.md) |

> v1.1.0  changelog 中「仍未实现」里所列的 request、撤销重做等，已在 v1.2.0 落地，以本节为准。

## 十八、总结

本低代码平台核心采用 JSON Schema 驱动，基于 Renderer 渲染页面，通过变量系统、事件系统以及 **Proxy + with 沙箱** 实现页面内动态逻辑，远程扩展则预留 iframe 隔离能力。

整体架构参考钉钉宜搭与企业级低代码平台设计方案。v1.0.0 验证最小闭环，v1.1.0 补齐渲染与校验，v1.2.0 补齐事件编排与 Mock 联调；后续版本变更请维护 `docs/changelog/` 目录。
