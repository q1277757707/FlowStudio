# FlowStudio 事件系统使用指南（含示例）

> 面向 FlowStudio 设计器使用者：如何在界面里配置事件、如何预览验证、各动作 `config` 怎么写。  
> 技术实现细节见 [event-system.md](./event-system.md)。

---

## 一、5 分钟上手

### 1. 启动项目

```bash
npm install
npm run dev
```

浏览器打开 Vite 提示的地址（一般为 `http://localhost:5173`），进入 FlowStudio 设计器。

### 2. 界面在哪里

| 区域 | 作用 |
| --- | --- |
| 左侧 **物料** | 拖组件到画布 |
| 中间 **画布** | 摆放、选中组件 |
| 右侧 **属性** | 改标签、校验等 |
| 底部 **事件配置** | 配置触发事件与动作链（可拖动中间横条调整高度） |
| 底部 **使用文档** | 在新标签页打开本指南（`event-guide.html`） |
| 顶部 **预览** | **只有预览里事件才会执行** |

### 3. 配置一条事件（最短路径）

1. 从左侧拖一个 **单行输入** 到画布  
2. 点击该输入框，使其处于选中（右侧出现属性）  
3. 底部切到 **事件配置** → 左侧选 **change**  
4. 右侧 **添加动作** → 选 **显示消息**  
5. 点击下方动作卡片，在 **动作配置** 里把 JSON 改成：

```json
{
  "type": "success",
  "content": "你输入了：{{event.value}}"
}
```

6. 点顶部 **预览**，在输入框里改值 → 应弹出成功提示  

> **注意**：设计态画布上改值**不会**跑事件，必须点 **预览**。

---

## 二、事件配置面板怎么用

```
┌─────────────────────────────────────────────────────────┐
│  事件配置 │ 变量 │ 数据源 │ 页面设置                      │
├──────────────┬──────────────────────────────────────────┤
│ 触发事件      │ 动作列表              [+ 添加动作]        │
│ · change     │  [设置变量] → [显示消息] → ...            │
│ · focus      │                                          │
│ · blur       │ 动作配置 · 显示消息                       │
│              │ { "type": "success", "content": "..." }  │
└──────────────┴──────────────────────────────────────────┘
```

### 操作步骤

1. **先选中画布上的组件**（未选中会提示「请选择组件」）  
2. **触发事件**：左侧列表来自该物料支持的 events（如 Input 有 `change` / `focus` / `blur`）  
3. **添加动作**：在「动作列表」标题右侧下拉选择动作类型  
4. **编辑 config**：点击某个动作卡片，在下方文本框改 JSON（必须是合法 JSON，保存时自动写入 Schema）  
5. **删除动作**：动作卡片右上角删除按钮  

动作按 **从左到右** 的顺序依次执行（动作链）。

---

## 三、哪些组件能配什么事件

常见物料（完整列表见 `packages/designer-materials`）：

| 组件 | 可配置事件 |
| --- | --- |
| Input / InputNumber / Switch / DatePicker 等 | `change`、`focus`、`blur`（部分还有 `input`） |
| **Select（下拉选择）** | `change`、`visible-change`（下拉展开/收起）、`clear` |
| **RadioGroup（单选框组）** | `change`、`visible-change`（由 setVisible 显隐时触发，`visible` 为 true/false） |
| Textarea | `input`、`change`、`focus`、`blur` |
| Button | `click` |
| Upload | `change`、`success`、`error`、`remove` |
| Container / Form / Text | 暂无（列表为空） |

---

## 四、表达式 `{{ }}` 怎么用

在 **config 的字符串字段** 里可以写模板，运行时会替换成实际值。

| 写法 | 含义 |
| --- | --- |
| `{{event.value}}` | 当前事件携带的值（如 change 的新值） |
| `{{form.组件id}}` | 某个组件当前表单值（key 是节点 **id**，不是 props 里的 label） |
| `{{variables.xxx}}` | 页面变量（由「设置变量」动作写入） |

**示例**：输入框节点 id 为 `input_abc`，按钮 config 里要写 `{{form.input_abc}}`。

选中组件后，可在右侧 **属性** 面板顶部的 **节点 ID** 查看并复制；也可在顶部 **Schema** 弹窗查看整页 JSON。

---

## 五、各动作 config 说明与示例

### 1. 设置变量 `setVariable`

把值写入页面变量 `variables`，供后续动作或表达式使用。

```json
{
  "key": "userName",
  "value": "{{event.value}}"
}
```

---

### 2. 显示消息 `message`

```json
{
  "type": "success",
  "content": "保存成功"
}
```

`type` 可选：`success` | `warning` | `info` | `error`。  
也支持字段名 `message`（与 `content` 等价）。

---

### 3. 请求接口 `request`

本地开发已内置 Mock：**`/api/demo`**（`npm run dev` 时可用，无需真实后端）。

GET 示例（默认动作配置即可测）：

```json
{
  "url": "/api/demo",
  "method": "GET",
  "params": {
    "keyword": "{{variables.userName}}"
  }
}
```

返回示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [{ "id": 1, "name": "演示项 A" }],
    "query": { "keyword": "..." },
    "serverTime": "2026-05-22T12:00:00.000Z"
  }
}
```

POST 示例（`params` 会作为 JSON body 提交）：

```json
{
  "url": "/api/demo",
  "method": "POST",
  "params": {
    "name": "{{variables.userName}}"
  }
}
```

请求成功后，响应会写入 `variables.lastResponse`，下一条动作可用 `{{variables.lastResponse.data}}`。

> 外网演示也可用 `https://jsonplaceholder.typicode.com/posts/1`；日常联调建议用 `/api/demo`。

---

### 4. 弹窗 `dialog`

```json
{
  "type": "confirm",
  "title": "确认提交",
  "message": "确定要提交吗？"
}
```

- `type`: `alert`（仅提示）或 `confirm`（确认/取消）  
- 结果写入 `variables.dialogResult`（`true` / `false`）

---

### 5. 页面跳转 `navigate`

```json
{
  "url": "https://www.example.com"
}
```

---

### 6. 延迟 `delay`

```json
{
  "ms": 500
}
```

常用于「先提示 → 延迟 → 再跳转」。

---

### 7. 条件分支 `condition`

根据表达式结果执行不同子动作链。

```json
{
  "expression": "{{event.value}}",
  "trueActions": [
    {
      "action": "message",
      "config": {
        "type": "success",
        "content": "有内容：{{event.value}}"
      }
    }
  ],
  "falseActions": [
    {
      "action": "message",
      "config": {
        "type": "warning",
        "content": "请输入内容"
      }
    }
  ]
}
```

> 子动作里写 `"action"` 字段即可，不必写 `id`（引擎会自动处理）。

---

### 8. 循环 `loop`

遍历数组，每条执行 `actions` 里的子动作。

```json
{
  "dataSource": "{{variables.list}}",
  "actions": [
    {
      "action": "message",
      "config": {
        "type": "info",
        "content": "第 {{variables.currentIndex}} 项：{{variables.currentItem}}"
      }
    }
  ]
}
```

循环体内可用：`variables.currentItem`、`variables.currentIndex`。  
需先用 **设置变量** 写入数组，例如：

```json
{ "key": "list", "value": ["苹果", "香蕉", "橙子"] }
```

---

### 9. 自定义 JS `customJS`

在沙箱中执行脚本（可访问 `form`、`variables`、`event`、`message`）。

```json
{
  "code": "message({ type: 'info', message: '当前值：' + event.value })"
}
```

勿写 `eval`、访问 `window` 等未注入对象。

---

### 10. 刷新页面 `reload`

```json
{}
```

---

### 11. 显示/隐藏组件 `setVisible`

仅 **预览** 有效；设计画布仍显示全部组件。

```json
{
  "componentId": "input_detail",
  "visible": true
}
```

`visible: false` 为隐藏。常与 Select 的 **条件分支** 联用。

---

### 12. 触发嵌套事件 `emit`

```json
{
  "eventName": "custom",
  "actions": [
    {
      "action": "message",
      "config": { "type": "info", "content": "嵌套动作已执行" }
    }
  ]
}
```

---

## 六、完整实战示例

### 示例 A：输入同步到变量并提示（推荐新手）

**目标**：姓名输入框 `change` 时，把值存到 `variables.userName` 并弹出提示。

**操作**：

1. 拖入 **单行输入**，右侧把标签改为「姓名」  
2. 选中该组件 → 事件 **change** → 添加 **设置变量**  
3. config：

```json
{
  "key": "userName",
  "value": "{{event.value}}"
}
```

4. 再添加 **显示消息**：

```json
{
  "type": "success",
  "content": "你好，{{variables.userName}}"
}
```

5. **预览** → 输入文字 → 应看到提示且变量已更新  

---

### 示例 D：第一个输入框的内容显示到第二个输入框（联动）

**目标**：在「输入 A」里打字，「输入 B」里实时显示相同内容。

> 说明：目前没有单独的「设置字段值」动作，用 **自定义 JS** 写入 `form` 即可（`form` 的 key 是组件 **id**）。

**操作**：

1. 拖入两个 **单行输入**，标签分别改为「输入 A」「输入 B」  
2. 分别选中两个输入框，在右侧 **属性** 面板顶部查看 **节点 ID**（可点复制按钮），例如 `input_abc111` 和 `input_def222`  
3. **只选中「输入 A」** → 事件 **change** → 添加 **自定义 JS**  
4. config（把 `input_def222` 换成你第二个输入框的真实 id）：

```json
{
  "code": "form['input_def222'] = event.value"
}
```

5. **预览** → 在输入 A 里输入 → 输入 B 应同步显示相同文字  

**注意**：

- `setVariable` 只写入页面变量，**不会**自动填进另一个输入框  
- 第二个框若要在设计态也能看到联动，同样只在预览里生效  
- 示例 Schema 见 [event-demo-schema.json](./examples/event-demo-schema.json) 中的 `input_source` / `input_mirror`  

---

### 示例 E：下拉选择（Select）怎么配事件

**和 Input 的相同点**

- 选中 **下拉选择** → 底部选 **change** → 添加动作，写法与 Input 一致  
- `{{event.value}}`：当前选中的值  
- `{{form.节点ID}}`：读取某个 Select 已选值  
- 联动另一个组件：`form['目标节点ID'] = event.value`（自定义 JS）

**和 Input 的不同点**

| 项目 | Input | Select |
| --- | --- | --- |
| `event.value` | 输入的字符串 | 选项里的 **value**（如 `option1`），不是「选项一」文案 |
| 多选 | — | 属性里开启「多选」后，`event.value` 为 **数组**，如 `["option1","option2"]` |
| 默认选项 | — | 在右侧属性 **选项配置** 里改 label / value |

#### E1：选中后提示（最简）

选中 Select → **change** → **显示消息**：

```json
{
  "type": "success",
  "content": "你选择了：{{event.value}}"
}
```

若要显示中文文案，需自己在选项里约定 value，或用 **条件分支** / **自定义 JS** 做映射。

#### E2：选中后请求 `/api/demo`

**change** → **请求接口**：

```json
{
  "url": "/api/demo",
  "method": "POST",
  "params": {
    "status": "{{event.value}}"
  }
}
```

预览里改下拉选项 → Mock 会返回 `data.received.status` 为你选的 value。

#### E3：Select 选中值同步到输入框

1. 拖 **下拉选择** + **单行输入**  
2. 复制输入框 **节点 ID**（如 `input_target`）  
3. 只选中 Select → **change** → **自定义 JS**：

```json
{
  "code": "form['input_target'] = event.value"
}
```

输入框里会显示 `option1` 这类 **value**；若要显示「选项一」，请在选项配置里把 value 设成中文，或写 JS 做映射。

#### E4：按选项走不同分支

**change** → **条件分支**：

```json
{
  "expression": "{{event.value}} === 'option2'",
  "trueActions": [
    {
      "action": "message",
      "config": { "type": "warning", "content": "你选了选项二" }
    }
  ],
  "falseActions": [
    {
      "action": "message",
      "config": { "type": "info", "content": "当前值：{{event.value}}" }
    }
  ]
}
```

#### E5：多选 Select

开启 **多选** 后，`event.value` 为数组，提示建议用自定义 JS：

```json
{
  "code": "message({ type: 'info', message: '已选：' + (Array.isArray(event.value) ? event.value.join(', ') : event.value) })"
}
```

#### E6：选 A 显示输入框、选 B 隐藏（显隐联动）

完整步骤、示意图、Schema 与排错见专用示例文档：

**[examples/select-visible-linkage.md](./examples/select-visible-linkage.md)**

简要步骤：

1. 拖 **下拉选择** + **单行输入**；Select 选项 `A`/`B`，**默认值** `A`  
2. 复制详情输入框 **节点 ID**（如 `input_detail`）  
3. 选中 Select → **change** → **条件分支** + 两条 **setVisible**（见上文专用文档中的 JSON）  
4. **预览** 验证  

---

### 示例 B：按钮提交前确认再请求

**目标**：点击按钮 → 确认框 → 调接口 → 成功提示。

1. 拖入 **按钮**，文案改为「提交」  
2. 事件选 **click**，按顺序添加动作：

**① 弹窗 confirm**

```json
{
  "type": "confirm",
  "title": "提交",
  "message": "确认提交当前数据？"
}
```

**② 条件分支**（只有点确定才继续）

```json
{
  "expression": "{{variables.dialogResult}}",
  "trueActions": [
    {
      "action": "request",
      "config": {
        "url": "https://jsonplaceholder.typicode.com/posts",
        "method": "POST",
        "params": {
          "title": "{{variables.userName}}",
          "body": "demo",
          "userId": 1
        }
      }
    },
    {
      "action": "message",
      "config": {
        "type": "success",
        "content": "提交成功"
      }
    }
  ],
  "falseActions": [
    {
      "action": "message",
      "config": {
        "type": "info",
        "content": "已取消"
      }
    }
  ]
}
```

3. 先按示例 A 配好输入框变量 `userName`，再预览测试。

---

### 示例 C：页面加载欢迎语（pageLoad）

页面级事件写在 Schema 的 `pageEvents.pageLoad`，**打开预览时自动执行一次**。

当前设计器 **Schema 弹窗为只读**，无法直接粘贴整页 JSON。可用两种方式：

1. **开发调试**：参考仓库内完整示例文件  
   [`docs/examples/event-demo-schema.json`](./examples/event-demo-schema.json)  
   将其中的 `pageEvents` 段合并进你的页面 Schema（或通过代码 `schema.pageEvents = ...` 初始化）。

2. **仅组件事件**：日常配置用底部面板即可，不依赖 `pageEvents`。

`pageLoad` 示例片段：

```json
"pageEvents": {
  "pageLoad": [
    {
      "action": "message",
      "config": {
        "type": "info",
        "content": "欢迎进入本页面"
      }
    }
  ]
}
```

---

## 七、示例文档与 Schema

### 示例文档目录

**[docs/examples/README.md](./examples/README.md)** — 所有示例索引

| 示例 | 文档 |
| --- | --- |
| **Select 选 A 显示 / 选 B 隐藏输入框（默认 A）** | [select-visible-linkage.md](./examples/select-visible-linkage.md) |
| 输入框互相同步、接口 Mock、按钮提交等 | [event-user-guide.md](./event-user-guide.md) 第六节 |

### 完整 Schema 文件

路径：**[docs/examples/event-demo-schema.json](./examples/event-demo-schema.json)**

包含：

- `select_mode` + `input_detail`：Select 显隐联动（见 [select-visible-linkage.md](./examples/select-visible-linkage.md)）  
- `input_source` / `input_mirror`：输入同步  
- `select_status`：Select 调 `/api/demo`  
- 姓名输入框、提交按钮、`pageEvents.pageLoad` 等  

使用方式：

1. 优先打开上表 **专用示例文档** 按步骤配置  
2. 或打开 JSON，复制对应节点的 `events` / `config` 到设计器 **动作配置**（`componentId` 改成你的节点 ID）  
3. 整份 Schema 导入能力接入后可一键加载  

---

## 八、预览与调试

| 现象 | 原因 / 处理 |
| --- | --- |
| 改了 config 没反应 | JSON 语法错误（多逗号、单引号等）不会写入，请检查格式 |
| 画布上操作没触发 | 事件仅在 **预览** 模式执行 |
| 表达式显示原文 `{{...}}` | 变量名写错，或 `variables` 里还没有该 key |
| `{{form.xxx}}` 为空 | `xxx` 必须是组件 **id**，在 Schema 里查 |
| 按钮没配事件点了也有提示 | 默认行为：无 `click` 动作时显示「按钮已点击」 |
| 接口报错 | 跨域或地址不可用；开发环境可用 `/api/demo` Mock |
| 选 A/B 输入框不显隐 | 仅在预览生效；`componentId` 须为目标节点 ID，见 [select-visible-linkage.md](./examples/select-visible-linkage.md) |

动作执行日志会写入运行时 `eventLogs`（最近 100 条），后续版本会提供可视化调试面板。

---

## 九、和 Schema 的关系

保存后，事件存在每个组件的 `events` 字段里，例如：

```json
{
  "id": "node_xxx",
  "type": "Input",
  "props": { "label": "姓名" },
  "events": {
    "change": [
      {
        "id": "action_1730...",
        "action": "setVariable",
        "config": { "key": "userName", "value": "{{event.value}}" }
      }
    ]
  }
}
```

顶部 **Schema** 按钮可查看、复制整页 JSON，便于备份或与后端对接。

---

## 十、相关文档

- [examples/README.md](./examples/README.md) — **示例文档索引**  
- [examples/select-visible-linkage.md](./examples/select-visible-linkage.md) — Select 显隐联动完整示例  
- [event-system.md](./event-system.md) — 架构、扩展 Action、Runner 流程  
- [lowcode-design.md](./lowcode-design.md) — 平台整体设计  
- [changelog/v1.2.0.md](./changelog/v1.2.0.md) — 事件系统版本说明  
