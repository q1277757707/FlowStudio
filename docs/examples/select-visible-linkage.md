# 示例：Select 选 A 显示输入框，选 B 隐藏（默认 A）

> 场景：下拉有 **A**、**B** 两个选项；选 **A** 时显示「详情」输入框，选 **B** 时隐藏；打开页面时默认 **A**（输入框可见）。

---

## 一、效果说明

| 操作 | 预览效果 |
| --- | --- |
| 打开预览，默认 A | 显示「详情」输入框 |
| 下拉改为 B | 隐藏「详情」输入框 |
| 再改回 A | 再次显示输入框 |
| 设计态画布 | **始终显示**所有组件（方便拖拽编辑），显隐仅在预览生效 |

```txt
  [ 模式 ▼ A ]  ──change──►  event.value === 'A' ?
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
            setVisible(详情, true)          setVisible(详情, false)
                    │                               │
                    ▼                               ▼
            [ 详情输入框 显示 ]              [ 详情输入框 隐藏 ]
```

---

## 二、准备组件

### 1. 下拉选择（Select）

从左侧物料拖入 **下拉选择**，在右侧 **属性** 配置：

| 属性 | 值 |
| --- | --- |
| 标签 | 模式（可自定） |
| 选项配置 | 两项：label/value 均为 `A`；label/value 均为 `B` |
| 默认值 | `A` |
| 多选 | 关闭 |

### 2. 单行输入（Input）

再拖入 **单行输入**：

| 属性 | 值 |
| --- | --- |
| 标签 | 详情（仅选 A 时显示） |
| 占位提示 | 请输入详情 |

### 3. 记下节点 ID

1. 选中 **详情输入框** → 右侧属性顶部 **节点 ID** → 点复制  
   下文用 `input_detail` 表示，**请换成你的真实 ID**  
2. 可选：选中 Select，记下其节点 ID（本示例不强制使用）

---

## 三、配置事件（核心）

1. 选中 **下拉选择**（不要选输入框）  
2. 底部 **事件配置** → 左侧 **change**  
3. **添加动作** → **条件分支**  
4. 在 **动作配置** 中粘贴（记得改 `componentId`）：

```json
{
  "expression": "{{event.value}} === 'A'",
  "trueActions": [
    {
      "action": "setVisible",
      "config": {
        "componentId": "input_detail",
        "visible": true
      }
    }
  ],
  "falseActions": [
    {
      "action": "setVisible",
      "config": {
        "componentId": "input_detail",
        "visible": false
      }
    }
  ]
}
```

### 字段说明

| 字段 | 说明 |
| --- | --- |
| `expression` | 当前选中值是否为 `A`（与选项里的 **value** 一致，区分大小写） |
| `setVisible` | 动作类型：**显示/隐藏组件** |
| `componentId` | 要控制的组件 **节点 ID**（详情输入框的 ID） |
| `visible` | `true` 显示，`false` 隐藏 |

---

## 四、验证

1. 点击顶部 **预览**  
2. 确认下拉默认为 **A**，下方有「详情」输入框  
3. 改为 **B** → 输入框消失  
4. 改回 **A** → 输入框出现  

---

## 五、仓库内完整 Schema 参考

文件：[event-demo-schema.json](./event-demo-schema.json)

相关片段（节点 ID 固定为示例用，导入时需与画布一致）：

```json
{
  "id": "select_mode",
  "type": "Select",
  "props": {
    "label": "模式",
    "options": [
      { "label": "A", "value": "A" },
      { "label": "B", "value": "B" }
    ],
    "defaultValue": "A"
  },
  "events": {
    "change": [
      {
        "action": "condition",
        "config": {
          "expression": "{{event.value}} === 'A'",
          "trueActions": [
            {
              "action": "setVisible",
              "config": { "componentId": "input_detail", "visible": true }
            }
          ],
          "falseActions": [
            {
              "action": "setVisible",
              "config": { "componentId": "input_detail", "visible": false }
            }
          ]
        }
      }
    ]
  }
},
{
  "id": "input_detail",
  "type": "Input",
  "props": {
    "label": "详情（仅选 A 时显示）",
    "placeholder": "请输入详情"
  }
}
```

---

## 六、常见问题

| 现象 | 处理 |
| --- | --- |
| 预览里改选无反应 | 确认在 **预览** 测试；检查 JSON 是否合法、是否选中 Select 配的事件 |
| 选 B 仍显示输入框 | `componentId` 是否填成详情输入框的 **节点 ID**；表达式是否 `'A'` 与选项 value 一致 |
| 画布上也想隐藏 | 当前不支持，设计态始终显示全部组件 |
| 默认要 B、且一开始隐藏详情 | 默认值改为 `B`，并增加 **页面 pageLoad** 动作：`setVisible` + `visible: false`（见 [event-user-guide](../event-user-guide.md) 示例 C） |
| 选 A 还要调接口 | 在 `trueActions` 里再加一条 `request`，url 填 `/api/demo` |

---

## 七、扩展

- **多个输入框**：在 `trueActions` / `falseActions` 里各加多条 `setVisible`，`componentId` 指向不同节点  
- **选 A 显示、选 B 显示另一块**：B 分支里对 `input_b` 设 `visible: true`，同时对 `input_a` 设 `false`  
- **与变量联动**：可先 `setVariable`，再用 `customJS` 或后续条件分支处理更复杂逻辑  

---

## 相关文档

- [event-user-guide.md §示例 E6](../event-user-guide.md) — 使用指南中的简版步骤  
- [event-user-guide.md §setVisible](../event-user-guide.md) — 动作说明  
- [examples/README.md](./README.md) — 示例索引  
