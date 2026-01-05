# 家庭共享日历前端

基于 Vue 3 + TypeScript + Vite 构建的家庭共享日历和任务管理系统前端应用。

## 技术栈

- **Vue 3** - 前端框架（Composition API）
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **Pinia** - 现代状态管理
- **Vue Router** - 路由管理
- **Axios** - HTTP 客户端

## 核心功能

### 1. 用户认证
- 用户注册和登录
- JWT Token 管理（localStorage + 内存双重存储）
- 自动 Token 附加和刷新
- 401 自动跳转登录

### 2. 群组管理
- 创建和管理多个群组
- 邀请成员加入群组
- 群组切换（全局状态）
- 成员角色管理

### 3. 日历事件
- 创建、编辑、删除事件
- 支持全天事件
- 时间和地点信息
- 按群组隔离数据

### 4. 任务管理
- 任务 CRUD 操作
- 状态管理（待处理、进行中、已完成）
- 优先级设置（高、中、低）
- 截止日期跟踪
- 状态和优先级筛选

### 5. 笔记
- 创建、编辑、删除笔记
- Markdown 风格内容展示
- 卡片式网格布局
- 按群组组织

## 项目结构

```
src/
├── api/                      # API 服务层
│   ├── client.ts            # Axios 实例配置 + 拦截器
│   ├── auth.ts              # 认证 API
│   ├── groups.ts            # 群组 API
│   ├── events.ts            # 事件 API
│   ├── tasks.ts             # 任务 API
│   └── notes.ts             # 笔记 API
├── stores/                   # Pinia 状态管理
│   ├── auth.ts              # 认证状态（token、user）
│   └── group.ts             # 群组状态（groups、currentGroup）
├── router/
│   └── index.ts             # 路由配置 + 守卫
├── views/                    # 页面组件
│   ├── LoginView.vue        # 登录页
│   ├── RegisterView.vue     # 注册页
│   ├── GroupsView.vue       # 群组管理页
│   ├── CalendarView.vue     # 日历事件页
│   ├── TasksView.vue        # 任务管理页
│   └── NotesView.vue        # 笔记页
├── components/               # 可复用组件
│   └── layout/
│       ├── AppLayout.vue    # 应用主布局
│       └── GroupSelector.vue # 群组选择器
├── types/
│   └── index.ts             # TypeScript 类型定义
├── App.vue                   # 根组件
└── main.ts                   # 应用入口

```

## 架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│          Views (页面层)              │  用户交互
├─────────────────────────────────────┤
│      Components (组件层)             │  可复用 UI
├─────────────────────────────────────┤
│        Stores (状态层)               │  Pinia 全局状态
├─────────────────────────────────────┤
│         API (服务层)                 │  HTTP 请求封装
├─────────────────────────────────────┤
│      Axios Client (传输层)          │  请求/响应拦截
└─────────────────────────────────────┘
```

### 数据流

1. **用户交互** → 组件触发事件
2. **组件** → 调用 Store actions 或 API 服务
3. **API 服务** → 通过 Axios 发送 HTTP 请求
4. **Axios 拦截器** → 自动附加 JWT Token
5. **后端响应** → 更新 Store 状态
6. **响应式更新** → 组件自动重新渲染

### 路由守卫逻辑

```typescript
// 1. 检查认证状态
if (需要登录 && 未登录) → 跳转到 /login

// 2. 检查群组选择
if (需要群组 && 未选择群组) → 跳转到 /groups

// 3. 已登录用户访问公开页面
if (已登录 && 访问 /login) → 跳转到 /groups
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置后端 API 地址：

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 运行

### 4. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录

### 5. 预览生产构建

```bash
npm run preview
```

## API 集成

### 后端要求

- RESTful API
- JWT Bearer Token 认证
- CORS 已配置
- 后端运行在 `http://localhost:8000`

### API 端点

所有 API 请求都会通过 Vite 代理转发到后端：

```javascript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true
  }
}
```

## 开发指南

### 添加新功能

1. **定义类型** - 在 `src/types/index.ts` 添加 TypeScript 接口
2. **创建 API 服务** - 在 `src/api/` 添加 API 调用函数
3. **创建/更新 Store** - 如需全局状态，在 `src/stores/` 添加
4. **创建页面组件** - 在 `src/views/` 创建新页面
5. **添加路由** - 在 `src/router/index.ts` 注册路由
6. **更新导航** - 在 `AppLayout.vue` 添加导航链接

### 代码规范

- 使用 **Composition API** (`<script setup>`)
- **TypeScript** 严格模式
- 组件按功能命名（如 `GroupsView.vue`）
- API 函数使用 async/await
- 统一的错误处理（Toast 提示）

## 注意事项

1. **Token 管理**：Token 同时存储在内存（Pinia state）和 localStorage，页面刷新时自动恢复
2. **群组上下文**：所有业务数据都基于当前选择的群组，切换群组会自动刷新数据
3. **路由守卫**：自动检查登录状态和群组选择，未满足条件自动跳转
4. **错误处理**：API 错误统一通过 Toast 提示用户
5. **响应式设计**：所有页面基本支持移动端浏览

## 扩展建议

未来可以添加的功能：

- [ ] 事件日历视图（月/周/日视图）
- [ ] 任务拖拽排序
- [ ] 实时通知（WebSocket）
- [ ] 文件附件上传
- [ ] 评论和讨论功能
- [ ] 搜索和过滤增强
- [ ] 导出功能（iCal、CSV）
- [ ] 主题切换（深色模式）
- [ ] 国际化支持

## License

MIT

