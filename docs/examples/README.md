# 示例文档索引

本目录提供可照着做的配置示例，配合 [event-user-guide.md](../event-user-guide.md) 使用。

| 示例 | 文档 | Schema 节点 |
| --- | --- | --- |
| Select 选 A 显示 / 选 B 隐藏输入框 | [select-visible-linkage.md](./select-visible-linkage.md) | `select_mode`、`input_detail` |
| 输入 A 同步到输入 B | [event-user-guide.md §示例 D](../event-user-guide.md) | `input_source`、`input_mirror` |
| Select 调 Mock 接口 | [event-user-guide.md §示例 E2](../event-user-guide.md) | `select_status` |
| 条件 true 拉选项 / false 清空 | [event-user-guide.md §条件分支](../event-user-guide.md) | 自定：true `request`+list，false `setFormValue` + `[]` |
| 变量 + 按钮提交 | [event-user-guide.md §示例 A/B](../event-user-guide.md) | `input_user_name`、`btn_submit` |
| 整页合集 | — | [event-demo-schema.json](./event-demo-schema.json) |

## 如何使用

1. 打开对应 **示例文档**，按步骤在设计器里配置  
2. 或打开 `event-demo-schema.json`，找到同名 `id` 的 `events` / `config` 复制到 **动作配置**  
3. 节点 ID 以你画布上为准（右侧属性面板可复制），示例里的 `input_detail` 等需替换为真实 ID  
4. **整份 Schema 一键导入**尚未接入，需手动复制配置  
