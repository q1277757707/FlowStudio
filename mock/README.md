# 开发环境 API Mock

仅在 `npm run dev` 时由 Vite 插件 `viteApiMockPlugin` 注入，生产构建不包含。

## `/api/demo`

| 方法 | 说明 |
| --- | --- |
| GET | 返回演示列表 + 回显 query 参数 |
| POST / PUT / PATCH | 回显请求 body，返回模拟 `id` |

统一响应结构：

```json
{
  "code": 0,
  "message": "ok",
  "data": { }
}
```

### 本地验证

```bash
curl "http://localhost:5173/api/demo?keyword=test"
curl -X POST http://localhost:5173/api/demo -H "Content-Type: application/json" -d "{\"name\":\"张三\"}"
```

设计器事件动作默认 `url` 为 `/api/demo`，预览里配置「请求接口」即可直接测试。
