export interface ChatContext {
  path: string
  suggestions: {
    en: string[]
    zh: string[]
  }
}

export const chatContexts: ChatContext[] = [
  {
    path: '/',
    suggestions: {
      en: ['Analyze data overview', 'Quick start guide', 'Show system status'],
      zh: ['分析数据概览', '快速入门指南', '显示系统状态'],
    },
  },
  {
    path: '/datasources',
    suggestions: {
      en: ['Help me add a new data source', 'Troubleshoot connection issues', 'List supported databases'],
      zh: ['帮我添加新的数据源', '连接问题排查', '列出支持的数据库'],
    },
  },
  {
    path: '/queries',
    suggestions: {
      en: ['Help me write a SQL query', 'Optimize SQL performance', 'Explain this query'],
      zh: ['帮我写一个SQL查询', '优化SQL性能', '解释这个查询'],
    },
  },
  {
    path: '/tools',
    suggestions: {
      en: ['How to create a new tool', 'Configure tool parameters', 'Best practices for tools'],
      zh: ['如何创建一个新工具', '工具参数配置', '工具最佳实践'],
    },
  },
  {
    path: '/mcp-servers',
    suggestions: {
      en: ['Explain MCP server configuration', 'Publishing workflow guide', 'Monitor server status'],
      zh: ['解释MCP服务器配置', '发布流程指南', '监控服务器状态'],
    },
  },
  {
    path: '/settings',
    suggestions: {
      en: ['Configure AI model', 'Theme settings', 'Export/import configuration'],
      zh: ['配置AI模型', '主题设置', '导出/导入配置'],
    },
  },
  {
    path: '/chat',
    suggestions: {
      en: ['What can you help me with?', 'Tell me about DataWeaver', 'How to get started?'],
      zh: ['你能帮我做什么？', '介绍一下DataWeaver', '如何开始使用？'],
    },
  },
]

export function getSuggestionsForPath(
  pathname: string,
  language: 'en' | 'zh'
): string[] {
  // Find exact match first
  const exactMatch = chatContexts.find((ctx) => ctx.path === pathname)
  if (exactMatch) {
    return exactMatch.suggestions[language]
  }

  // Find prefix match for nested routes
  const prefixMatch = chatContexts.find(
    (ctx) => ctx.path !== '/' && pathname.startsWith(ctx.path)
  )
  if (prefixMatch) {
    return prefixMatch.suggestions[language]
  }

  // Default to root suggestions
  const defaultContext = chatContexts.find((ctx) => ctx.path === '/')
  return defaultContext?.suggestions[language] || []
}
