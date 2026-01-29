# DataWeaver 前端

<p align="center">
  <strong>一站式数据管理与 AI 集成平台</strong>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#系统架构">系统架构</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#使用指南">使用指南</a> •
  <a href="#api-参考">API 参考</a> •
  <a href="#配置说明">配置说明</a>
</p>

<p align="center">
  <a href="./README.md">English Documentation</a>
</p>

---

## 项目概述

**DataWeaver** 是一个企业级平台，旨在连接传统数据库与现代 AI 系统。它能够帮助用户：

- 连接多种数据库系统
- 构建参数化 SQL 查询
- 将查询转换为可复用的工具
- 通过 Model Context Protocol (MCP) 服务器暴露工具
- 使用数据库支持的工具与 AI 模型进行交互

该平台遵循 MCP 规范，使您的数据能够被 Claude、GPT 等基于大语言模型的 AI 助手访问。

## 功能特性

### 数据源管理
- **多数据库支持**：连接 MySQL、PostgreSQL、SQL Server、Oracle 等多种数据库
- **连接测试**：保存前验证数据库连接的有效性
- **Schema 浏览**：可视化浏览表结构、字段和数据类型
- **凭证安全**：数据库凭证加密存储

### 查询构建器
- **SQL 编辑器**：基于 Monaco 的编辑器，支持语法高亮和自动补全
- **参数配置**：定义类型化参数（字符串、数字、布尔、日期）
- **查询验证**：执行前进行语法验证
- **SQL 格式化**：自动格式化 SQL 提高可读性
- **执行历史**：跟踪所有查询执行记录，包括参数和结果

### 工具创建
- **查询转工具**：将任意查询转换为可调用的工具
- **AI 智能描述**：使用配置的 AI 模型自动生成工具描述
- **参数映射**：将查询参数映射为工具输入，并添加描述
- **输出模式定义**：定义工具结果的结构化输出模式
- **版本管理**：跟踪工具的版本和变更

### MCP 服务器管理
- **服务器配置**：配置超时、速率限制、日志和缓存
- **工具选择**：选择要通过每个服务器暴露的工具
- **访问控制**：设置 API 密钥要求、允许的来源（CORS）和 IP 白名单
- **一键发布**：发布服务器并自动生成端点和 API 密钥
- **配置导出**：导出 MCP 配置用于客户端集成

### 实时监控
- **统计仪表板**：查看总调用次数、成功率和响应时间
- **调用趋势**：可视化使用模式随时间的变化
- **热门工具分析**：识别使用最多的工具
- **响应时间分布**：分析性能指标
- **详细日志**：浏览包含参数和错误信息的单次调用日志

### AI 对话集成
- **多供应商支持**：支持 OpenAI、Anthropic、Google 及 8+ 国内大模型供应商
- **工具调用**：AI 可在对话中调用 MCP 工具
- **流式响应**：实时 Token 流式传输，提升用户体验
- **思考过程可视化**：展示 AI 推理过程（支持的模型）
- **上下文感知建议**：根据页面提供特定的提示建议

### 其他特性
- **国际化**：完整支持中英文双语
- **明暗主题**：跟随系统主题，支持手动切换
- **响应式设计**：适配桌面和平板设备
- **状态持久化**：记住用户偏好和聊天历史

## 系统架构

### 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | React 19, TypeScript, Vite |
| **样式** | TailwindCSS 4, Radix UI, shadcn/ui |
| **状态管理** | Zustand (UI 状态), TanStack Query (服务端状态) |
| **表单** | React Hook Form, Zod 验证 |
| **编辑器** | Monaco Editor |
| **图表** | Recharts |
| **HTTP 客户端** | Axios |
| **路由** | React Router DOM 7 |

### 项目结构

```
src/
├── api/                    # API 客户端模块
│   ├── client.ts          # Axios 实例与拦截器
│   ├── datasources.ts     # 数据源接口
│   ├── queries.ts         # 查询接口
│   ├── tools.ts           # 工具接口
│   ├── mcpServers.ts      # MCP 服务器接口
│   ├── chat.ts            # 对话/流式接口
│   └── aiGenerate.ts      # AI 生成工具
├── components/
│   ├── ui/                # 基础 UI 组件 (shadcn/ui)
│   ├── layout/            # 布局组件 (侧边栏, 头部)
│   ├── datasources/       # 数据源组件
│   ├── queries/           # 查询构建器组件
│   ├── tools/             # 工具管理组件
│   ├── mcp-servers/       # MCP 服务器组件
│   └── chat/              # 对话界面组件
├── hooks/                 # 自定义 React Hooks
│   ├── useDataSources.ts
│   ├── useQueries.ts
│   ├── useTools.ts
│   └── useMcpServers.ts
├── stores/                # Zustand 状态存储
│   ├── useAppStore.ts     # 应用全局状态
│   ├── useChatStore.ts    # 对话状态
│   └── useModelStore.ts   # AI 模型配置
├── pages/                 # 页面组件
├── types/                 # TypeScript 类型定义
├── i18n/                  # 国际化
├── lib/                   # 工具函数
└── config/                # 配置文件
```

### 数据流向

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   数据库    │────▶│    查询     │────▶│    工具     │
│    连接     │     │    模板     │     │    定义     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AI 客户端  │◀────│ MCP 服务器  │◀────│    发布     │
│  (Claude)   │     │    端点     │     │    配置     │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- 后端 API 服务器运行中（参见后端文档）

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-org/dataweaver.git
   cd dataweaver/dataweaver-frontend
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件，设置 API 基础 URL：
   ```
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **在浏览器中打开**
   ```
   http://localhost:5173
   ```

### 生产环境构建

```bash
npm run build
npm run preview  # 本地预览构建结果
```

## 使用指南

### 步骤 1：配置 AI 模型

使用 AI 功能前，需要配置您的 LLM 供应商：

1. 进入 **设置** 页面
2. 选择 AI 供应商（如 OpenAI、Anthropic）
3. 输入 API 密钥
4. 选择模型（如 gpt-4、claude-3-opus）
5. 点击 **验证** 测试配置
6. 点击 **保存**

### 步骤 2：添加数据源

连接您的数据库：

1. 进入 **数据源** 页面
2. 点击 **添加数据源**
3. 填写连接信息：
   - 名称：友好的标识符
   - 类型：MySQL、PostgreSQL 等
   - 主机、端口、数据库名
   - 用户名和密码
4. 点击 **测试连接** 验证
5. 点击 **创建**

### 步骤 3：创建查询

构建参数化 SQL 查询：

1. 进入 **查询** 页面
2. 点击 **新建查询**
3. 选择数据源
4. 使用 `{{参数名}}` 语法编写 SQL：
   ```sql
   SELECT * FROM users
   WHERE created_at > {{start_date}}
   AND status = {{status}}
   LIMIT {{limit}}
   ```
5. 配置参数（类型、是否必填、默认值）
6. 使用示例值测试查询
7. 保存查询

### 步骤 4：创建工具

将查询转换为 AI 可调用的工具：

1. 进入 **工具** 页面
2. 点击 **创建工具**
3. 选择一个查询
4. 配置工具详情：
   - 显示名称：人类可读的名称
   - 工具名称：MCP 使用的 snake_case 标识符
   - 描述：点击 **AI 生成** 或手动编写
5. 查看并自定义参数
6. 保存工具

### 步骤 5：设置 MCP 服务器

通过 MCP 服务器暴露工具：

1. 进入 **MCP 服务器** 页面
2. 点击 **创建服务器**
3. 配置基本信息：
   - 名称和描述
4. 进入 **工具** 标签页选择要包含的工具
5. 配置 **高级** 设置：
   - 超时时间（默认：30秒）
   - 速率限制（每分钟请求数）
   - 按需启用缓存
6. 设置 **访问控制**：
   - 要求 API 密钥（推荐）
   - 配置 CORS 允许的来源
   - 添加 IP 白名单（如需要）
7. 点击 **测试** 验证配置
8. 点击 **发布** 部署服务

### 步骤 6：集成 AI 客户端

发布后，将配置用于 AI 客户端：

1. 在发布对话框中点击 **复制配置**
2. 添加到 MCP 客户端配置（如 `claude_desktop_config.json`）：
   ```json
   {
     "mcpServers": {
       "dataweaver": {
         "url": "https://your-api.com/mcp/server-id",
         "apiKey": "your-api-key"
       }
     }
   }
   ```
3. 重启 AI 客户端

### 步骤 7：与数据对话

使用内置对话功能测试：

1. 进入 **对话** 页面或使用浮动窗口
2. 从下拉菜单中选择已发布的 MCP 服务器
3. 提出需要使用工具的问题：
   ```
   查询最近 7 天创建的所有用户
   ```
4. AI 将自动调用相应的工具

## API 参考

### 认证

所有 API 请求需要 Bearer Token：

```
Authorization: Bearer <your-jwt-token>
```

### 接口列表

#### 数据源
| 方法 | 接口 | 描述 |
|------|------|------|
| GET | `/v1/datasources` | 获取所有数据源 |
| POST | `/v1/datasources` | 创建数据源 |
| GET | `/v1/datasources/:id` | 获取数据源详情 |
| PUT | `/v1/datasources/:id` | 更新数据源 |
| DELETE | `/v1/datasources/:id` | 删除数据源 |
| POST | `/v1/datasources/:id/test` | 测试连接 |
| GET | `/v1/datasources/:id/tables` | 获取表列表 |

#### 查询
| 方法 | 接口 | 描述 |
|------|------|------|
| GET | `/v1/queries` | 获取所有查询 |
| POST | `/v1/queries` | 创建查询 |
| GET | `/v1/queries/:id` | 获取查询详情 |
| PUT | `/v1/queries/:id` | 更新查询 |
| DELETE | `/v1/queries/:id` | 删除查询 |
| POST | `/v1/queries/:id/execute` | 执行查询 |
| POST | `/v1/queries/validate` | 验证 SQL |
| POST | `/v1/queries/format` | 格式化 SQL |
| GET | `/v1/queries/history` | 获取执行历史 |

#### 工具
| 方法 | 接口 | 描述 |
|------|------|------|
| GET | `/v1/tools` | 获取所有工具 |
| POST | `/v1/tools` | 创建工具 |
| GET | `/v1/tools/:id` | 获取工具详情 |
| PUT | `/v1/tools/:id` | 更新工具 |
| DELETE | `/v1/tools/:id` | 删除工具 |
| POST | `/v1/tools/:id/test` | 测试工具 |
| POST | `/v1/queries/:id/create-tool` | 从查询创建工具 |

#### MCP 服务器
| 方法 | 接口 | 描述 |
|------|------|------|
| GET | `/v1/mcp-servers` | 获取所有服务器 |
| POST | `/v1/mcp-servers` | 创建服务器 |
| GET | `/v1/mcp-servers/:id` | 获取服务器详情 |
| PUT | `/v1/mcp-servers/:id` | 更新服务器 |
| DELETE | `/v1/mcp-servers/:id` | 删除服务器 |
| POST | `/v1/mcp-servers/:id/publish` | 发布服务器 |
| POST | `/v1/mcp-servers/:id/stop` | 停止服务器 |
| POST | `/v1/mcp-servers/:id/test` | 测试服务器 |
| GET | `/v1/mcp-servers/:id/statistics` | 获取统计数据 |
| GET | `/v1/mcp-servers/:id/logs` | 获取调用日志 |
| GET | `/v1/mcp-servers/:id/config` | 导出配置 |

## 配置说明

### 环境变量

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 后端 API URL | `http://localhost:8080/api` |

### 支持的 LLM 供应商

| 供应商 | 模型 | 备注 |
|--------|------|------|
| OpenAI | gpt-4, gpt-4-turbo, gpt-3.5-turbo | 完整工具调用支持 |
| Anthropic | claude-3-opus, claude-3-sonnet, claude-3-haiku | 完整工具调用支持 |
| Google | gemini-pro, gemini-ultra | 基础支持 |
| Azure OpenAI | 取决于部署 | 与 OpenAI 相同 |
| DeepSeek（深度求索） | deepseek-chat, deepseek-coder | OpenAI 兼容 |
| 通义千问 | qwen-turbo, qwen-plus, qwen-max | DashScope API |
| 智谱 AI | glm-4, glm-3-turbo | GLM API |
| Moonshot（月之暗面） | moonshot-v1 | Kimi API |
| Minimax | abab5.5-chat, abab6-chat | Minimax API |
| 百川智能 | Baichuan2-Turbo | 百川 API |
| 零一万物 | yi-large, yi-medium | 01.AI API |

### 主题配置

应用支持以下主题：
- **系统**：跟随操作系统偏好
- **浅色**：浅色模式
- **深色**：深色模式

主题偏好保存在本地存储中。

### 语言配置

支持的语言：
- 英文 (`en`)
- 简体中文 (`zh`)

语言偏好会被持久化，可在顶部导航栏的下拉菜单中切换。

## 安全考虑

1. **API 密钥**：LLM API 密钥安全存储；保存在浏览器本地存储中
2. **数据库凭证**：安全传输到后端；前端不会暴露
3. **MCP API 密钥**：自动生成；如泄露可重新生成
4. **CORS**：配置允许的来源以限制访问
5. **IP 白名单**：将 MCP 服务器访问限制在已知 IP
6. **JWT Token**：自动过期；过期后需要重新登录

## 常见问题

### 问题排查

**问：对话显示"请先在设置中配置 AI 模型"**
答：进入设置页面，输入 API 密钥并验证配置。

**问：选择 MCP 服务器后显示 0 个工具**
答：确保服务器状态为"已发布"且工具设置为"活跃"。

**问：对话中工具执行失败**
答：请检查：
1. MCP 服务器已发布
2. 工具状态为活跃
3. 后端 API 可访问
4. 数据库连接有效

**问：无法连接数据源**
答：请验证：
1. 数据库服务器正在运行
2. 凭证正确
3. 网络允许连接（防火墙、VPN）
4. SSL 设置与服务器配置匹配

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 致谢

- [shadcn/ui](https://ui.shadcn.com/) 提供精美的 UI 组件
- [TanStack Query](https://tanstack.com/query) 提供强大的数据获取能力
- [Zustand](https://zustand-demo.pmnd.rs/) 提供简洁的状态管理
- [Model Context Protocol](https://modelcontextprotocol.io/) 提供 MCP 规范
