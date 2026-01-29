# DataWeaver Frontend

<p align="center">
  <strong>A comprehensive data management and AI integration platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#usage-guide">Usage Guide</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#configuration">Configuration</a>
</p>

<p align="center">
  <a href="./README.zh-CN.md">中文文档</a>
</p>

---

## Overview

**DataWeaver** is an enterprise-grade platform that bridges the gap between traditional databases and modern AI systems. It enables users to:

- Connect to multiple database systems
- Build parameterized SQL queries
- Transform queries into reusable tools
- Expose tools through Model Context Protocol (MCP) servers
- Interact with AI models using database-backed tools

The platform follows the MCP specification, making your data accessible to AI assistants like Claude, GPT, and other LLM-based applications.

## Features

### Data Source Management
- **Multi-Database Support**: Connect to MySQL, PostgreSQL, SQL Server, Oracle, and more
- **Connection Testing**: Validate database connections before saving
- **Schema Browser**: Explore tables, columns, and data types visually
- **Secure Credentials**: Encrypted storage of database credentials

### Query Builder
- **SQL Editor**: Monaco-based editor with syntax highlighting and auto-completion
- **Parameter Configuration**: Define typed parameters (string, number, boolean, date)
- **Query Validation**: Syntax validation before execution
- **SQL Formatting**: Auto-format SQL for readability
- **Execution History**: Track all query executions with parameters and results

### Tool Creation
- **Query-to-Tool Conversion**: Transform any query into a callable tool
- **AI-Powered Descriptions**: Generate tool descriptions using configured AI models
- **Parameter Mapping**: Map query parameters to tool inputs with descriptions
- **Output Schema Definition**: Define structured output schemas for tool results
- **Version Management**: Track tool versions and changes

### MCP Server Management
- **Server Configuration**: Configure timeout, rate limiting, logging, and caching
- **Tool Selection**: Choose which tools to expose through each server
- **Access Control**: Set API key requirements, allowed origins (CORS), and IP whitelists
- **One-Click Publishing**: Publish servers with auto-generated endpoints and API keys
- **Configuration Export**: Export MCP configuration for client integration

### Real-Time Monitoring
- **Statistics Dashboard**: View total calls, success rates, and response times
- **Call Trends**: Visualize usage patterns over time
- **Top Tools Analysis**: Identify most-used tools
- **Response Time Distribution**: Analyze performance metrics
- **Detailed Logs**: Browse individual call logs with parameters and errors

### AI Chat Integration
- **Multi-Provider Support**: OpenAI, Anthropic, Google, and 8+ Chinese LLM providers
- **Tool Calling**: AI can invoke MCP tools during conversations
- **Streaming Responses**: Real-time token streaming for better UX
- **Thinking Visualization**: Display AI reasoning process (for supported models)
- **Context-Aware Suggestions**: Page-specific prompt suggestions

### Additional Features
- **Internationalization**: Full English and Chinese language support
- **Dark/Light Theme**: System-aware theme with manual override
- **Responsive Design**: Works on desktop and tablet devices
- **Persistent State**: Remembers user preferences and chat history

## Architecture

### Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | React 19, TypeScript, Vite |
| **Styling** | TailwindCSS 4, Radix UI, shadcn/ui |
| **State Management** | Zustand (UI state), TanStack Query (server state) |
| **Forms** | React Hook Form, Zod validation |
| **Editor** | Monaco Editor |
| **Charts** | Recharts |
| **HTTP Client** | Axios |
| **Routing** | React Router DOM 7 |

### Project Structure

```
src/
├── api/                    # API client modules
│   ├── client.ts          # Axios instance with interceptors
│   ├── datasources.ts     # Data source endpoints
│   ├── queries.ts         # Query endpoints
│   ├── tools.ts           # Tool endpoints
│   ├── mcpServers.ts      # MCP server endpoints
│   ├── chat.ts            # Chat/streaming endpoints
│   └── aiGenerate.ts      # AI generation utilities
├── components/
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── layout/            # Layout components (Sidebar, Header)
│   ├── datasources/       # Data source components
│   ├── queries/           # Query builder components
│   ├── tools/             # Tool management components
│   ├── mcp-servers/       # MCP server components
│   └── chat/              # Chat interface components
├── hooks/                 # Custom React hooks
│   ├── useDataSources.ts
│   ├── useQueries.ts
│   ├── useTools.ts
│   └── useMcpServers.ts
├── stores/                # Zustand stores
│   ├── useAppStore.ts     # App-wide state
│   ├── useChatStore.ts    # Chat state
│   └── useModelStore.ts   # AI model configuration
├── pages/                 # Page components
├── types/                 # TypeScript type definitions
├── i18n/                  # Internationalization
├── lib/                   # Utility functions
└── config/                # Configuration files
```

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Database   │────▶│   Query     │────▶│    Tool     │
│  Connection │     │  Template   │     │  Definition │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AI Client  │◀────│ MCP Server  │◀────│   Publish   │
│  (Claude)   │     │  Endpoint   │     │   Config    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API server running (see backend documentation)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/dataweaver.git
   cd dataweaver/dataweaver-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your API base URL:
   ```
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
npm run preview  # Preview the build locally
```

## Usage Guide

### Step 1: Configure AI Model

Before using AI features, configure your preferred LLM provider:

1. Navigate to **Settings** page
2. Select your AI provider (e.g., OpenAI, Anthropic)
3. Enter your API key
4. Choose a model (e.g., gpt-4, claude-3-opus)
5. Click **Validate** to test the configuration
6. Click **Save**

### Step 2: Add Data Sources

Connect to your databases:

1. Go to **Data Sources** page
2. Click **Add Data Source**
3. Fill in connection details:
   - Name: A friendly identifier
   - Type: MySQL, PostgreSQL, etc.
   - Host, Port, Database name
   - Username and Password
4. Click **Test Connection** to verify
5. Click **Create**

### Step 3: Create Queries

Build parameterized SQL queries:

1. Navigate to **Queries** page
2. Click **New Query**
3. Select a data source
4. Write your SQL with parameters using `{{parameter_name}}` syntax:
   ```sql
   SELECT * FROM users
   WHERE created_at > {{start_date}}
   AND status = {{status}}
   LIMIT {{limit}}
   ```
5. Configure parameters (type, required, default value)
6. Test the query with sample values
7. Save the query

### Step 4: Create Tools

Convert queries into AI-callable tools:

1. Go to **Tools** page
2. Click **Create Tool**
3. Select a query
4. Configure tool details:
   - Display Name: Human-readable name
   - Tool Name: snake_case identifier for MCP
   - Description: Click **AI Generate** or write manually
5. Review and customize parameters
6. Save the tool

### Step 5: Set Up MCP Server

Expose tools through an MCP server:

1. Navigate to **MCP Servers** page
2. Click **Create Server**
3. Configure basic info:
   - Name and description
4. Go to **Tools** tab and select tools to include
5. Configure **Advanced** settings:
   - Timeout (default: 30s)
   - Rate limit (requests per minute)
   - Enable caching if needed
6. Set up **Access Control**:
   - Require API key (recommended)
   - Configure allowed origins for CORS
   - Add IP whitelist if needed
7. Click **Test** to validate configuration
8. Click **Publish** to deploy

### Step 6: Integrate with AI Clients

After publishing, use the configuration with AI clients:

1. Click **Copy Configuration** in the publish dialog
2. Add to your MCP client config (e.g., `claude_desktop_config.json`):
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
3. Restart your AI client

### Step 7: Chat with Your Data

Use the built-in chat to test:

1. Go to **Chat** page or use the floating widget
2. Select your published MCP server from the dropdown
3. Ask questions that require your tools:
   ```
   Show me all users created in the last 7 days
   ```
4. The AI will automatically call the appropriate tools

## API Reference

### Authentication

All API requests require a Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Data Sources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/datasources` | List all data sources |
| POST | `/v1/datasources` | Create data source |
| GET | `/v1/datasources/:id` | Get data source |
| PUT | `/v1/datasources/:id` | Update data source |
| DELETE | `/v1/datasources/:id` | Delete data source |
| POST | `/v1/datasources/:id/test` | Test connection |
| GET | `/v1/datasources/:id/tables` | List tables |

#### Queries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/queries` | List all queries |
| POST | `/v1/queries` | Create query |
| GET | `/v1/queries/:id` | Get query |
| PUT | `/v1/queries/:id` | Update query |
| DELETE | `/v1/queries/:id` | Delete query |
| POST | `/v1/queries/:id/execute` | Execute query |
| POST | `/v1/queries/validate` | Validate SQL |
| POST | `/v1/queries/format` | Format SQL |
| GET | `/v1/queries/history` | Get execution history |

#### Tools
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/tools` | List all tools |
| POST | `/v1/tools` | Create tool |
| GET | `/v1/tools/:id` | Get tool |
| PUT | `/v1/tools/:id` | Update tool |
| DELETE | `/v1/tools/:id` | Delete tool |
| POST | `/v1/tools/:id/test` | Test tool |
| POST | `/v1/queries/:id/create-tool` | Create tool from query |

#### MCP Servers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/mcp-servers` | List all servers |
| POST | `/v1/mcp-servers` | Create server |
| GET | `/v1/mcp-servers/:id` | Get server |
| PUT | `/v1/mcp-servers/:id` | Update server |
| DELETE | `/v1/mcp-servers/:id` | Delete server |
| POST | `/v1/mcp-servers/:id/publish` | Publish server |
| POST | `/v1/mcp-servers/:id/stop` | Stop server |
| POST | `/v1/mcp-servers/:id/test` | Test server |
| GET | `/v1/mcp-servers/:id/statistics` | Get statistics |
| GET | `/v1/mcp-servers/:id/logs` | Get call logs |
| GET | `/v1/mcp-servers/:id/config` | Export config |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8080/api` |

### Supported LLM Providers

| Provider | Models | Notes |
|----------|--------|-------|
| OpenAI | gpt-4, gpt-4-turbo, gpt-3.5-turbo | Full tool calling support |
| Anthropic | claude-3-opus, claude-3-sonnet, claude-3-haiku | Full tool calling support |
| Google | gemini-pro, gemini-ultra | Basic support |
| Azure OpenAI | Depends on deployment | Same as OpenAI |
| DeepSeek | deepseek-chat, deepseek-coder | OpenAI-compatible |
| Qwen | qwen-turbo, qwen-plus, qwen-max | DashScope API |
| Zhipu AI | glm-4, glm-3-turbo | GLM API |
| Moonshot | moonshot-v1 | Kimi API |
| Minimax | abab5.5-chat, abab6-chat | Minimax API |
| Baichuan | Baichuan2-Turbo | Baichuan API |
| Yi | yi-large, yi-medium | 01.AI API |

### Theme Configuration

The application supports:
- **System**: Follow OS preference
- **Light**: Light mode
- **Dark**: Dark mode

Theme preference is persisted in local storage.

### Language Configuration

Supported languages:
- English (`en`)
- Chinese Simplified (`zh`)

Language preference is persisted and can be changed in the header dropdown.

## Security Considerations

1. **API Keys**: Store LLM API keys securely; they are stored in browser local storage
2. **Database Credentials**: Transmitted securely to backend; never exposed to frontend
3. **MCP API Keys**: Auto-generated; can be regenerated if compromised
4. **CORS**: Configure allowed origins to restrict access
5. **IP Whitelist**: Restrict MCP server access to known IPs
6. **JWT Tokens**: Auto-expire; re-login required after expiration

## Troubleshooting

### Common Issues

**Q: Chat shows "Please configure AI model in Settings"**
A: Go to Settings, enter your API key, and validate the configuration.

**Q: MCP server shows 0 tools after selection**
A: Ensure the server has published status and tools are set to "active".

**Q: Tool execution fails in chat**
A: Check that:
1. The MCP server is published
2. Tools are active
3. Backend API is accessible
4. Database connection is valid

**Q: Cannot connect to data source**
A: Verify:
1. Database server is running
2. Credentials are correct
3. Network allows connection (firewall, VPN)
4. SSL settings match server configuration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [TanStack Query](https://tanstack.com/query) for powerful data fetching
- [Zustand](https://zustand-demo.pmnd.rs/) for simple state management
- [Model Context Protocol](https://modelcontextprotocol.io/) for the MCP specification
