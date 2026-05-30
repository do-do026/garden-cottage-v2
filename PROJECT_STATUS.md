# 🏡 Garden Cottage V2 — 工程状态报告

> 生成时间：2026-05-30 · 仓库：`do-do026/garden-cottage-v2` · 分支：`main`

---

## 📊 项目概览

| 指标 | 数值 |
|------|------|
| 前端文件 | 36 `.tsx` + 22 `.ts` = 58 |
| 后端文件 | 21 `.ts` |
| 共享类型/常量 | 2 `.ts` |
| 设计文档 | 3 `.md/.mermaid` |
| Git 提交 | 5 commits |
| 编译状态 | ⚠️ 5 个预存 TS 警告（非阻断） |

### 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Vite 5 + React 18 + MUI v5 + Zustand 4.5 + Tailwind CSS + Socket.IO Client |
| 后端 | Express 4 + Socket.IO 4 + better-sqlite3 11 + node-cron + ws + ssh2 |
| 共享 | TypeScript 5.5 strict，`shared/types.ts` + `shared/constants.ts` |

---

## ✅ 已完成项 / V2 交付清单

### T01 — 项目基础设施
- monorepo 结构：`/src` (前端) + `/server` (后端) + `/shared` (共享)
- Vite 配置 + MUI ThemeProvider + Zustand stores
- SQLite 数据库 schema（chats, bots, messages, tasks, participants）
- Socket.IO 双工通信层 + REST API (`/api/*` 路由)
- API Key 认证中间件 + 速率限制

### T02 — 数据层 (9 文件)
- `chatStore.ts`：`activeBotId`、`addChatParticipant`、`removeChatParticipant`
- `botStore.ts`：`updateBotContext`、`getBotsForChat` (跨 store 查询)
- `useChat.ts`：mention 提取 `@botId`
- `api.ts`：`updateBotContext()`、`addChatParticipant()`、`removeChatParticipant()`、`connectorType`
- 后端路由：`PATCH /bots/:id/context`、`POST/DELETE /chats/:id/participants`
- 数据库迁移：V2 ALTER TABLE (participants, contextStrategy, maxContextMessages, connectorType)

### T03 — @mention + Bot Switch (6 文件)
- `utils/mention.ts`：`extractMentionAtCursor`、`replaceMentionAtCursor`、`parseMentions`（regex: `/@([a-zA-Z0-9_-]+)/g`）
- `MentionAutocomplete.tsx`：MUI Popper 下拉 + 键盘导航 (↑↓/Enter/Escape)
- `BotSwitcher.tsx`：MUI Chip+Menu 切换投喂目标 bot
- `MessageInput.tsx` + `ChatArea.tsx`：集成 mention 和 BotSwitcher

### T04 — CARD + WIDGET 消息类型 (8 文件)
- 4 种卡片：`BouquetCard`、`RecipeCard`、`TaskCard`（LinearProgress 进度条）、`InfoCard`（DOMPurify 净化 HTML）
- `CardRenderer.tsx`：dispatcher 读取 `message.metadata.card.template`
- `PollWidget.tsx`：完整投票组件（投票按钮、百分比条、倒计时、多选）
- `WidgetRenderer.tsx`：dispatcher 可扩展
- `MessageRenderer.tsx`：新增 `case MessageType.CARD/WIDGET`

### T05 — 集成层 (4 文件)
- `socket/manager.ts`：`WIDGET_VOTE` 监听器、`widget:result`/`widget:closed` 广播
- `uiStore.ts`：V2 扩展 `applyUIMod` — `ADD_BUTTON`、`SHOW_MODAL`、`SET_FONT`、`SET_LAYOUT`
- `useSocket.ts`：StrictMode 修复（cleanup 只取消订阅不 disconnect）
- `useTheme.ts`：bot 动态字体覆盖

### Operit HTTP Connector (6 文件)
- `operitConnector.ts`：HTTP POST 到 `/api/external-chat`，30s AbortController 超时
- 与 `HermesClient`(WebSocket) 共存，通过 `connectorType: 'hermes' | 'operit'` 路由
- SSH 反向隧道模式：`ssh -R 8094:127.0.0.1:8094`
- `socket/manager.ts`：统一 `sendToBot()` 依据 connectorType 分发

### BugFix 轮次
1. Bot 创建流程修复（DB 列缺省 + 前端错误提示 + connectorType UI）
2. Operit 端点路径修正：`/api/message` → `/api/external-chat`
3. 页面双重 padding 修复：BotsPage/TasksPage/SettingsPage 移除多余 `pt:TOPBAR_HEIGHT`
4. API Key 前后端默认值统一为 `garden-cottage-v2-secret-key-change-me`

### 用户可配置功能
- Settings 页 API Key 输入框（password 类型，localStorage 持久化）
- Settings 页主题切换 / 主色选择 / Hermes 连接测试 / 通知开关

---

## ⚠️ 技术债

### 🔴 高优先级 — 应尽快处理

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| 1 | **TS 类型错误：`SET_FONT`/`SET_LAYOUT` 不在 `UIModType` 联合类型中** | `uiStore.ts:222,231` + `shared/types.ts` | `shared/types.ts` 的 `UIModType` 定义未包含 V2 新增的 mod 类型，导致 switch-case 类型收窄失效 |
| 2 | **"Failed to fetch" 错误信息不友好** | `api.ts` → 各页面 | 401/网络错误统一显示为 "Failed to fetch"，未区分真实原因（网络断 vs 认证失败 vs 服务宕机） |
| 3 | **`TaskCard` / `PollWidget` 等组件未被端到端测试** | 前端 widgets + cards | 只有 QA agent 的逻辑测试，无浏览器环境验证 |

### 🟡 中优先级 — 建议处理

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| 4 | **`setDeadline` / `estimateTokens` / `bid` 未使用变量** | `PollWidget.tsx:67`, `useBotContext.ts:13,52` | TS 编译警告，可能是预留功能未完成 |
| 5 | **Hermes WebSocket 连接未实测** | `hermesClient.ts` + 前端连接流程 | 用户只验证了 Operit HTTP，WS 路径可能存在隐藏 bug |
| 6 | **settings 页图标按钮（通知/设置/账户）无功能** | `TopNavbar.tsx:58-66` | 点击无响应，纯占位 |
| 7 | **About 版本号硬编码 `v1.0.0`** | `SettingsPage.tsx:219` | 应改为 `v2.0.0` 或从 `package.json` 读取 |

### 🟢 低优先级 — 可延后

| # | 问题 | 位置 | 影响 |
|---|------|------|------|
| 8 | **无 CI/CD pipeline** | 项目根 | 纯手动编译部署 |
| 9 | **无 Docker 化** | — | 环境依赖手动安装 |
| 10 | **V2.1 功能未实现** | — | flower-arrange/emoji-board/RPG widgets 列入计划但未开始 |
| 11 | **V2.2 功能未实现** | — | MCP protocol + Skill system |

---

## 📁 关键文件索引

### 用户最可能需要关注的

| 用途 | 路径 |
|------|------|
| 启动前端 | `npm run dev`（根目录） |
| 启动后端 | `cd server && npx tsx src/index.ts` |
| API Key 设置 | Settings 页 或 `src/services/api.ts` 的 `getApiKey()` |
| 环境变量 | `.env.example`（复制为 `.env`） |
| 数据库 | `server/data/hermes-chat.db`（SQLite） |
| 共享类型 | `shared/types.ts` |
| 系统架构 | `docs/system_design.md` |
| 类图 | `docs/class-diagram.mermaid` |
| 时序图 | `docs/sequence-diagram.mermaid` |

### 最近改动 (commit `edbd4ac`)

```
src/pages/BotsPage.tsx       — 移除双重 pt
src/pages/TasksPage.tsx      — 同上
src/pages/SettingsPage.tsx   — 同上 + placeholder 更新
src/services/api.ts          — API key 默认值更新
server/src/config.ts         — 后端 API key 默认值同步
server/src/middleware/auth.ts — 注释更新
```

---

## 🔧 用户启动检查清单

```
☐ 1. 确认 backend 运行: cd server && npx tsx src/index.ts  (默认端口 3001)
☐ 2. 确认 frontend 运行: npm run dev  (默认端口 5173)
☐ 3. 浏览器打开 http://localhost:5173
☐ 4. Settings → API Key 确认值匹配后端
☐ 5. Bots → Add Bot → 创建测试 bot
☐ 6. Chats → 发消息测试
☐ 7. (Operit) 手机端建立 SSH 隧道后测试 Operit 连接
☐ 8. (Hermes) 启动 Hermes agent 后测试 WebSocket 连接
```

---

## 📋 下一版本 (V2.1) 规划

1. **flower-arrange widget**：花艺排列交互组件
2. **emoji-board widget**：表情面板组件
3. **RPG widget**：轻量角色扮演面板
4. **错误信息改进**：区分 401/网络/500 等不同错误场景
5. **TS 类型修复**：补齐 `UIModType` 联合类型
