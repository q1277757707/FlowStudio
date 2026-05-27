# 流程设计模块

设计器顶栏 **「流程设计」** 步骤对应的画布、节点配置抽屉、条件分支与流程 JSON 导出，已抽离为独立 Monorepo 包 **`@flow-studio/designer-workflow`**。UI 与交互与拆分前一致，仅调整代码归属与依赖边界。

## 包职责划分

| 包 | 职责 |
| --- | --- |
| `@flow-studio/designer-core` | 流程模板类型、`compileWorkflowTemplate`、条件组 Draft 类型、校验与 `walkFlowItems` 等**纯逻辑** |
| `@flow-studio/designer-workflow` | 流程画布（`workflow-canvas`）、节点抽屉、Pinia `useWorkflowStore`、流程样式 |
| `@flow-studio/app-designer` | 设计器 Shell（顶栏步骤切换）、基础信息页、表单设计；通过桥接函数向流程包注入页面元数据 |

```txt
designer-core (workflow.ts)
       ↑
designer-workflow (UI + store + workflow-canvas)
       ↑
app-designer (DesignerShell、BasicInfoPanel、collectFormFields)
```

## 目录结构

```txt
packages/designer-workflow/
├── package.json
└── src/
    ├── index.ts                    # 入口：导出 API + import 样式
    ├── store/
    │   ├── workflow.ts             # 流程 Pinia store
    │   ├── pageMetaBridge.ts       # 页面 pageId / pageName 注入
    │   └── formFieldsBridge.ts     # 表单字段列表注入（条件分支变量）
    ├── workflow-canvas/               # 画布、节点包装、adapter、条件转换
    ├── components/
    │   ├── WorkflowDesignerPanel.vue
    │   ├── WorkflowPropertyPanel.vue
    │   ├── WorkflowConditionEditor.vue
    │   ├── WorkflowAddMenu.vue
    │   └── workflow-drawer/        # 审批 / 抄送 / 办理抽屉
    └── styles/
        ├── index.css               # 聚合 workflow-shell / drawer / workflow-canvas
        ├── workflow-shell.css
        └── workflow-drawer.css
```

## 对外 API

从 `@designer-workflow` 导入（`tsconfig` / Vite 已配置别名）：

```ts
import {
  WorkflowDesignerPanel,
  useWorkflowStore,
  bindWorkflowPageMeta,
  bindWorkflowFormFields
} from '@designer-workflow';

import type {
  WorkflowSelection,
  WorkflowBasicInfo,
  WorkflowAdministrator,
  WorkflowFlowGroup,
  WorkflowPageMeta
} from '@designer-workflow';
```

| 导出 | 说明 |
| --- | --- |
| `WorkflowDesignerPanel` | 流程设计主面板（画布 + 右侧属性抽屉） |
| `useWorkflowStore` | 流程模板、nodeConfig、选中态、编译 JSON 等 |
| `bindWorkflowPageMeta` | 宿主注入 `pageId` / `pageName`，用于同步流程模板元信息 |
| `bindWorkflowFormFields` | 宿主注入表单组件树收集函数，供条件分支选择表单字段 |

样式由包入口自动加载，应用根只需：

```ts
// src/main.ts
import '@designer-workflow';
```

无需再单独引入 `workflow-canvas.css` 或 `src/styles.css` 中的流程区块样式。

## 与 app-designer 的集成

`DesignerShell` 在 `onMounted` 时绑定宿主数据，避免 `designer-workflow` 直接依赖表单设计 store：

```ts
import { bindWorkflowPageMeta, bindWorkflowFormFields } from '@designer-workflow';
import { collectFormFieldOptions } from '../workflow/collectFormFields';

bindWorkflowPageMeta(() => ({
  pageId: designer.schema.pageId,
  pageName: designer.schema.pageName
}));

bindWorkflowFormFields(() => designer.schema.components, collectFormFieldOptions);
```

- **基础信息**（`BasicInfoPanel`）仍位于 `app-designer`，通过 `useWorkflowStore()` 读写 `basicInfo`。
- **表单字段收集**（`packages/app-designer/src/workflow/collectFormFields.ts`）遍历 `LowCodeNode` 树，生成条件编辑器下拉选项。

## 数据流概要

1. **画布编辑**：以 `nodeConfig`（Workflow 树）为准；变更经 `syncFromNodeConfig` 同步到 `flowItems`。
2. **节点抽屉**：打开时 `normalizeWorkflowNodeDraft` 生成草稿；点 **保存** 后 `updateWorkflowNode` 写回 `nodeConfig`。
3. **条件分支**：草稿确认后 `updateBranchConditionGroups` 写入分支，并编译为摘要字符串。
4. **流程 JSON**：打开前调用 `refreshFlowSnapshot()`，再以 `compileWorkflowTemplate`（core）生成节点链，含嵌套条件分支。

## 扩展与二次集成

若在其他宿主（非当前 `app-designer`）嵌入流程设计：

1. 安装 / 引用 workspace 包 `@flow-studio/designer-workflow` 与 `@flow-studio/designer-core`。
2. 配置 Vite / TS 别名 `@designer-workflow` → `packages/designer-workflow/src`。
3. 挂载 `WorkflowDesignerPanel`，并注册 Pinia。
4. 调用 `bindWorkflowPageMeta`、`bindWorkflowFormFields` 注入业务上下文。

单独使用流程设计页、不依赖表单 schema 时，可不绑定 `bindWorkflowFormFields`，条件编辑器仅展示预设变量。

## 相关文件（开发参考）

| 路径 | 说明 |
| --- | --- |
| `packages/designer-core/src/workflow.ts` | 模板编译、FlowItem 类型、校验 |
| `packages/designer-workflow/src/workflow-canvas/adapter.ts` | nodeConfig ↔ flowItems 互转 |
| `packages/designer-workflow/src/workflow-canvas/nodeNormalize.ts` | 打开抽屉时节点默认值、会签类型同步 |
| `packages/app-designer/src/components/DesignerShell.vue` | 流程步骤、JSON 弹窗、桥接绑定 |

## 相关文档

- [lowcode-design.md](./lowcode-design.md) — 平台整体架构
- [changelog/v1.2.1.md](./changelog/v1.2.1.md) — 本模块拆分变更记录
