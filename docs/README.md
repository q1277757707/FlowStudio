# FlowStudio 文档

**FlowStudio** — 一个用于构建企业工作流、事件编排与动态应用的可视化低代码平台。

## 如何预览 Markdown

### 在 Cursor / VS Code 里（推荐装插件）

1. 打开本仓库后，若提示安装推荐扩展，点 **安装**（或命令面板 `Extensions: Show Recommended Extensions`）。
2. 推荐扩展：
   - **Markdown All in One** — 目录、快捷键、预览增强
   - **Markdown Preview Github Styling** — 预览样式接近 GitHub
3. 打开任意 `docs/**/*.md`，按 **Ctrl+Shift+V**（侧边预览 **Ctrl+K V**）即可预览。

### 在浏览器里（开发服务器）

```bash
npm run dev
```

启动后会**同时**打开设计器（`/`）与文档预览（`/docs-preview.html`），同一端口，无需再起第二个服务。

若只想看文档：

```bash
npm run docs
```

仅打开文档预览页。

## 文档索引

| 文档 | 适合谁 | 说明 |
| --- | --- | --- |
| [event-user-guide.md](./event-user-guide.md) | **设计器使用者** | 事件怎么配、怎么预览、动作 config 示例 |
| [examples/README.md](./examples/README.md) | **设计器使用者** | 示例文档索引（含 Select 显隐联动等） |
| [examples/select-visible-linkage.md](./examples/select-visible-linkage.md) | 使用者 | Select 选 A 显示 / 选 B 隐藏输入框 |
| [examples/event-demo-schema.json](./examples/event-demo-schema.json) | 使用者 / 开发 | 可复制的完整页面 Schema |
| [event-system.md](./event-system.md) | 开发 | 事件引擎架构与扩展 |
| [lowcode-design.md](./lowcode-design.md) | 产品 / 开发 | 平台整体设计 |
| [changelog/](./changelog/) | 所有人 | 版本更新记录 |
