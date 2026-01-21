export const translations = {
  en: {
    // Common
    common: {
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      update: 'Update',
      search: 'Search',
      loading: 'Loading',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      back: 'Back',
      home: 'Home',
      goBack: 'Go Back',
      goHome: 'Go Home',
    },

    // Navigation
    nav: {
      dashboard: 'Dashboard',
      dataSources: 'Data Sources',
      queries: 'Queries',
      tools: 'Tools',
      mcpServers: 'MCP Servers',
      jobs: 'Jobs',
      settings: 'Settings',
    },

    // Auth / Login
    auth: {
      login: 'Login',
      loginTitle: 'Welcome Back',
      loginDescription: 'Enter your credentials to access the application',
      username: 'Username',
      usernamePlaceholder: 'admin',
      email: 'Email',
      emailPlaceholder: 'user@example.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      loginButton: 'Login',
      loggingIn: 'Logging in...',
      loginError: 'Invalid username or password',
      userNotActive: 'User account is not active',
      skipLogin: 'Skip Login (Development)',
      register: 'Register',
      registerTitle: 'Create Account',
      registerDescription: 'Sign up for a new account',
      registerButton: 'Create Account',
      registering: 'Creating account...',
      registerSuccess: 'Account created successfully!',
      registerError: 'Registration failed',
      userExists: 'User with this username or email already exists',
      haveAccount: 'Already have an account?',
      noAccount: "Don't have an account?",
      signIn: 'Sign in',
      signUp: 'Sign up',
    },

    // Data Sources
    dataSources: {
      title: 'Data Sources',
      createNew: 'Create New',
      searchPlaceholder: 'Search data sources...',
      noDataSources: 'No Data Sources',
      noDataSourcesDesc: 'Create your first data source to get started',
      noResults: 'No Results Found',
      noResultsDesc: 'Try using different search keywords',
      selectOne: 'Select a Data Source',
      selectOneDesc: 'Select a data source from the left panel to view details',

      // Form
      form: {
        name: 'Name',
        namePlaceholder: 'Production Database',
        type: 'Database Type',
        typePlaceholder: 'Select database type',
        host: 'Host',
        hostPlaceholder: 'localhost',
        port: 'Port',
        database: 'Database',
        databasePlaceholder: 'mydb',
        username: 'Username',
        usernamePlaceholder: 'postgres',
        password: 'Password',
        passwordPlaceholder: '••••••••',
        passwordKeepHint: 'Leave empty to keep current password',
        description: 'Description',
        descriptionOptional: 'Description (Optional)',
        descriptionPlaceholder: 'Description of this data source...',
        testConnection: 'Test Connection',
        creating: 'Creating',
        updating: 'Updating',
      },

      // Status
      status: {
        active: 'Active',
        inactive: 'Inactive',
        error: 'Error',
      },

      // Actions
      actions: {
        viewTables: 'View Tables',
        backToDetail: 'Back to Details',
      },

      // Details
      details: {
        title: 'Connection Information',
        host: 'Host',
        port: 'Port',
        database: 'Database',
        username: 'Username',
        status: 'Status',
        createdAt: 'Created At',
        description: 'Description',
      },

      // Connection Test
      connectionTest: {
        title: 'Test Database Connection',
        subtitle: 'Verifying database connection configuration...',
        testing: 'Connecting...',
        success: 'Connection Successful!',
        failed: 'Connection Failed',
        failedDesc: 'Please check your connection configuration and try again',
        configCorrect: 'Database connection configuration is correct and ready to use.',
        done: 'Done',
        close: 'Close',
        latency: 'Latency',
      },

      // Tables
      tables: {
        title: 'Table List',
        searchPlaceholder: 'Search tables...',
        noTables: 'No Tables Found',
        noTablesDesc: 'No accessible tables in this data source',
        tableName: 'Table Name',
        rowCount: 'Row Count',
        showing: 'Showing',
        of: 'of',
        tables: 'tables',
      },

      // Messages
      messages: {
        createSuccess: 'Data source created successfully!',
        updateSuccess: 'Data source updated successfully!',
        deleteSuccess: 'Data source deleted successfully!',
        createError: 'Failed to create data source',
        updateError: 'Failed to update data source',
        deleteError: 'Failed to delete data source',
        loadError: 'Failed to load data sources',
        testError: 'Connection test failed',
        deleteConfirm: 'Confirm Delete',
        deleteConfirmDesc: 'Are you sure you want to delete data source "{name}"? This action cannot be undone.',
      },
    },

    // Tools
    tools: {
      title: 'Tools',
      selectPrompt: 'Select a tool or create a new one',
      selectPromptDesc: 'Choose a tool from the list or click the New button to create one',
      createNew: 'Create New Tool',
      createTitle: 'Create New Tool',
      editTitle: 'Edit Tool',

      // List
      list: {
        title: 'Tools',
        create: 'New',
        searchPlaceholder: 'Search tools...',
        ungrouped: 'Ungrouped',
        empty: 'No tools yet',
        noResults: 'No tools found',
        createFirst: 'Create your first tool',
        deleteTitle: 'Delete Tool',
        deleteConfirm: 'Are you sure you want to delete this tool? This action cannot be undone.',
      },

      // Tabs
      tabs: {
        basic: 'Basic Info',
        parameters: 'Parameters',
        output: 'Output Schema',
        test: 'Test',
      },

      // Basic Info
      basicInfo: {
        title: 'Basic Information',
        description: 'Configure the basic properties of your tool.',
      },

      // Form
      form: {
        query: 'Associated Query',
        queryPlaceholder: 'Select a query',
        noQueries: 'No queries available',
        displayName: 'Display Name',
        displayNamePlaceholder: 'User-friendly name',
        name: 'Tool Name (snake_case)',
        namePlaceholder: 'tool_name',
        nameHint: 'Used as the MCP tool identifier. Only lowercase letters, numbers, and underscores.',
        description: 'Description',
        descriptionPlaceholder: 'Describe what this tool does. Supports Markdown.',
        descriptionHint: 'This description will be shown to AI models. Be clear and concise.',
        generateDescription: 'AI Generate',
      },

      // Parameters Tab
      parametersTab: {
        title: 'Parameters',
        description: 'Configure how parameters are exposed to AI models.',
      },

      // Parameters
      parameters: {
        selectQueryFirst: 'Please select a query first to configure parameters.',
        noParameters: 'The selected query has no parameters.',
        hint: 'Configure how parameters are exposed to AI models. You can override the query defaults.',
        resetAll: 'Reset All',
        resetTooltip: 'Reset all parameters to query defaults',
        resetOne: 'Reset to query default',
        required: 'Required',
        modified: 'Modified',
        type: 'Type',
        default: 'Default Value',
        defaultPlaceholder: 'Optional default value',
        requiredLabel: 'Required',
        requiredHint: 'AI must provide this parameter',
        description: 'Description',
        descriptionPlaceholder: 'Describe what this parameter does',
        descriptionHint: 'This description helps AI understand how to use this parameter.',
        format: 'Format',
      },

      // Output Tab
      outputTab: {
        title: 'Output Schema',
        description: 'Define the JSON Schema for the tool output.',
      },

      // Output Schema
      outputSchema: {
        hint: 'Define the JSON Schema for the tool output. This helps AI models understand the response structure.',
        visual: 'Visual',
        json: 'JSON',
        generateTitle: 'Generate from Test',
        generateHint: 'Execute the tool with default parameters to infer the output schema.',
        generate: 'Generate Schema',
        generated: 'Schema generated successfully!',
        apply: 'Apply',
        preview: 'Schema Preview',
        empty: 'No schema defined yet.',
        itemProperties: 'Item Properties:',
        jsonEditor: 'JSON Schema',
      },

      // Test Tab
      testTab: {
        title: 'Test Tool',
        description: 'Test your tool with sample parameters and view the MCP definition.',
      },

      // Test
      test: {
        saveFirst: 'Please save the tool first to test it.',
        testTab: 'Test',
        mcpTab: 'MCP Definition',
        parameters: 'Parameters',
        parametersHint: 'Enter test values for each parameter.',
        required: 'Required',
        execute: 'Execute Test',
        executing: 'Executing...',
        success: 'Execution Successful',
        failed: 'Execution Failed',
        error: 'Error',
        rows: 'rows',
        preview: 'Data Preview',
        showingFirst: 'Showing first 10 of',
        mcpDefinition: 'MCP Tool Definition',
        mcpHint: 'The tool definition as exposed to MCP clients.',
        copyMcp: 'Copy to clipboard',
        copied: 'Copied to clipboard!',
        copyFailed: 'Failed to copy',
        noMcpDefinition: 'MCP definition not available.',
      },

      // Messages
      messages: {
        createSuccess: 'Tool created successfully!',
        updateSuccess: 'Tool updated successfully!',
        deleteSuccess: 'Tool deleted successfully!',
        createError: 'Failed to create tool',
        updateError: 'Failed to update tool',
        deleteError: 'Failed to delete tool',
        testError: 'Failed to test tool',
        generateError: 'Failed to generate description',
      },
    },

    // MCP Servers
    mcpServers: {
      title: 'MCP Servers',
      subtitle: 'Manage and publish your MCP servers',
      create: 'New Server',
      searchPlaceholder: 'Search servers...',
      empty: 'No MCP servers yet',
      noResults: 'No servers found',
      createFirst: 'Create your first server',
      notFound: 'Server not found',
      backToList: 'Back to list',

      status: {
        draft: 'Draft',
        published: 'Published',
        stopped: 'Stopped',
        error: 'Error',
      },

      card: {
        tools: 'tools',
        noDescription: 'No description',
        configure: 'Configure',
        monitoring: 'Monitoring',
        copyConfig: 'Copy Config',
        publish: 'Publish',
        stop: 'Stop',
      },

      createDialog: {
        title: 'Create MCP Server',
        subtitle: 'Create a new MCP server to expose your tools.',
        name: 'Name',
        namePlaceholder: 'my-mcp-server',
        descriptionLabel: 'Description',
        descriptionPlaceholder: 'Describe your MCP server...',
      },

      deleteDialog: {
        title: 'Delete Server',
        description: 'Are you sure you want to delete this MCP server? This action cannot be undone.',
      },

      configTabs: {
        basic: 'Basic Info',
        tools: 'Tools',
        advanced: 'Advanced',
        access: 'Access Control',
      },

      basicInfo: {
        title: 'Basic Information',
        subtitle: 'Configure the basic properties of your MCP server.',
        name: 'Name',
        namePlaceholder: 'my-mcp-server',
        descriptionLabel: 'Description',
        descriptionPlaceholder: 'Describe your MCP server...',
        endpoint: 'Endpoint',
        apiKey: 'API Key',
      },

      toolsTab: {
        title: 'Tool Selection',
        description: 'Select which tools to expose through this MCP server.',
      },

      advancedTab: {
        title: 'Advanced Configuration',
        description: 'Configure performance and behavior settings.',
      },

      accessTab: {
        title: 'Access Control',
        description: 'Configure security and access restrictions.',
      },

      toolSelector: {
        available: 'Available Tools',
        selected: 'Selected Tools',
        searchPlaceholder: 'Search tools...',
        selectAll: 'Select All',
        noResults: 'No matching tools',
        allSelected: 'All tools selected',
        noSelected: 'No tools selected',
        moveAllRight: 'Move all to right',
        moveRight: 'Move selected to right',
        moveLeft: 'Move selected to left',
        moveAllLeft: 'Move all to left',
      },

      config: {
        timeout: 'Timeout (seconds)',
        timeoutHint: 'Maximum execution time for each tool call',
        rateLimit: 'Rate Limit (requests/minute)',
        rateLimitHint: 'Maximum number of requests allowed per minute',
        logLevel: 'Log Level',
        logLevelHint: 'Minimum log level to record',
        logLevels: {
          debug: 'Debug',
          info: 'Info',
          warn: 'Warning',
          error: 'Error',
        },
        enableCache: 'Enable Cache',
        enableCacheHint: 'Cache tool responses for repeated queries',
        cacheExpiration: 'Cache Expiration (ms)',
        cacheExpirationHint: 'How long to keep cached responses (default: 5 minutes)',
      },

      accessControl: {
        apiKeyRequired: 'Require API Key',
        apiKeyRequiredHint: 'Clients must provide a valid API key to access this server',
        allowedOrigins: 'Allowed Origins (CORS)',
        allowedOriginsHint: 'List of allowed origins for cross-origin requests. Leave empty to allow all.',
        originPlaceholder: 'https://example.com',
        ipWhitelist: 'IP Whitelist',
        ipWhitelistHint: 'Only allow requests from these IP addresses. Leave empty to allow all.',
        ipPlaceholder: '192.168.1.1 or 10.0.0.0/24',
      },

      actions: {
        test: 'Test',
        publish: 'Publish',
      },

      test: {
        success: 'Test Passed',
        failed: 'Test Failed',
      },

      configCopy: {
        title: 'MCP Configuration',
        description: 'Copy this configuration to use with your MCP client.',
        usageTitle: 'How to use:',
        step1: 'Copy the configuration below',
        step2: 'Add it to your MCP client configuration file (e.g., claude_desktop_config.json)',
        step3: 'Restart your MCP client to apply changes',
        copy: 'Copy',
        copied: 'Copied!',
        copyFailed: 'Failed to copy',
        loadFailed: 'Failed to load configuration',
        serverName: 'Server',
        endpoint: 'Endpoint',
      },

      monitoring: {
        title: 'Monitoring Dashboard',
        noData: 'No monitoring data available',
        totalCalls: 'Total Calls',
        today: 'today',
        successRate: 'Success Rate',
        excellent: 'Excellent',
        good: 'Good',
        needsAttention: 'Needs attention',
        avgResponseTime: 'Avg Response Time',
        fast: 'Fast',
        normal: 'Normal',
        slow: 'Slow',
        topTool: 'Top Tool',
        calls: 'calls',
        callTrend: 'Call Trend',
        callTrendDesc: 'Daily call volume over time',
        successCalls: 'Success',
        errorCalls: 'Errors',
        topTools: 'Top Tools',
        topToolsDesc: 'Most frequently called tools',
        responseTimeDistribution: 'Response Time Distribution',
        recentCalls: 'Recent Calls',
        recentCallsDesc: 'Latest tool invocations',
        time: 'Time',
        tool: 'Tool',
        status: 'Status',
        responseTime: 'Response Time',
        noLogs: 'No recent calls',
        noChartData: 'No data to display',
        autoRefreshOn: 'Auto-refresh ON',
        autoRefreshOff: 'Auto-refresh OFF',
        configure: 'Configure',
        notPublished: 'Server not published',
        notPublishedDesc: 'Publish the server to see monitoring data.',
        goToConfigure: 'Go to Configure',
      },
    },

    // Queries
    queries: {
      title: 'Queries',
      searchPlaceholder: 'Search queries...',
      noQueries: 'No queries yet',
      noResults: 'No matching queries',
      selectPrompt: 'Select a query or create a new one',
      selectPromptDesc: 'Choose a query from the list or click the + button to create a new one',
      createNew: 'Create New Query',
      deleteConfirm: 'Delete Query',
      deleteConfirmDesc: 'Are you sure you want to delete "{name}"? This action cannot be undone.',

      // Form
      form: {
        namePlaceholder: 'Query name',
        descriptionPlaceholder: 'Description (optional)',
      },

      // Actions
      actions: {
        format: 'Format',
        validate: 'Validate',
      },

      // Editor
      editor: {
        paramsDetected: 'Parameters:',
      },

      // Tabs
      tabs: {
        params: 'Parameters',
        test: 'Test',
        history: 'History',
      },

      // Parameter Config
      paramConfig: {
        type: 'Type',
        defaultValue: 'Default Value',
        defaultValuePlaceholder: 'Optional',
        description: 'Description',
        descriptionPlaceholder: 'Parameter description...',
        required: 'Required',
        unconfiguredParams: 'Unconfigured parameters detected:',
        noParams: 'No parameters configured',
        noParamsHint: 'Use :paramName syntax in your SQL to define parameters',
      },

      // Test Panel
      testPanel: {
        parameters: 'Parameters',
        execute: 'Execute Query',
        executing: 'Executing...',
        noResults: 'Execute query to see results',
        executionFailed: 'Execution Failed',
        success: 'Success',
        rows: 'rows',
        exportCSV: 'Export CSV',
        missingParams: 'Missing required parameters:',
      },

      // History
      history: {
        empty: 'No execution history',
        emptyHint: 'Execute a query to see history here',
        rows: 'rows',
        params: 'Params',
        rerun: 'Re-run query',
      },

      // Schema Explorer
      schema: {
        dataSource: 'Data Source',
        selectDataSource: 'Select data source',
        searchTables: 'Search tables...',
        selectPrompt: 'Select a data source',
        noTables: 'No tables found',
        noResults: 'No matching tables',
        tables: 'tables',
      },

      // Messages
      messages: {
        createSuccess: 'Query created successfully!',
        updateSuccess: 'Query updated successfully!',
        deleteSuccess: 'Query deleted successfully!',
        createError: 'Failed to create query',
        updateError: 'Failed to update query',
        deleteError: 'Failed to delete query',
        formatSuccess: 'SQL formatted',
        formatError: 'Failed to format SQL',
        validateSuccess: 'SQL is valid',
        validateError: 'SQL validation failed',
        selectDataSource: 'Please select a data source first',
        nameRequired: 'Query name is required',
        sqlRequired: 'SQL is required',
        saveFirst: 'Please save the query first',
      },
    },

    // Error Pages
    errors: {
      notFound: {
        title: '404',
        subtitle: 'Page Not Found',
        description: 'Sorry, the page you are looking for does not exist. Please check the URL or return to the homepage.',
      },
      general: {
        title: 'An Error Occurred',
        description: 'The application encountered an unexpected error',
        details: 'Error Details',
        technicalDetails: 'Technical Details (Developer Information)',
        persistentError: 'If the problem persists, please contact technical support or refresh the page.',
      },
    },
  },

  zh: {
    // Common
    common: {
      create: '创建',
      edit: '编辑',
      delete: '删除',
      cancel: '取消',
      save: '保存',
      saving: '保存中...',
      update: '更新',
      search: '搜索',
      loading: '加载中',
      error: '错误',
      success: '成功',
      confirm: '确认',
      back: '返回',
      home: '首页',
      goBack: '返回上一页',
      goHome: '返回首页',
    },

    // Navigation
    nav: {
      dashboard: '仪表板',
      dataSources: '数据源',
      queries: '查询',
      tools: '工具',
      mcpServers: 'MCP 服务器',
      jobs: '任务',
      settings: '设置',
    },

    // Auth / Login
    auth: {
      login: '登录',
      loginTitle: '欢迎回来',
      loginDescription: '输入您的凭据以访问应用程序',
      username: '用户名',
      usernamePlaceholder: 'admin',
      email: '邮箱',
      emailPlaceholder: 'user@example.com',
      password: '密码',
      passwordPlaceholder: '••••••••',
      loginButton: '登录',
      loggingIn: '登录中...',
      loginError: '用户名或密码错误',
      userNotActive: '用户账户未激活',
      skipLogin: '跳过登录（开发模式）',
      register: '注册',
      registerTitle: '创建账户',
      registerDescription: '注册一个新账户',
      registerButton: '创建账户',
      registering: '创建中...',
      registerSuccess: '账户创建成功！',
      registerError: '注册失败',
      userExists: '该用户名或邮箱已存在',
      haveAccount: '已有账户？',
      noAccount: '还没有账户？',
      signIn: '登录',
      signUp: '注册',
    },

    // Data Sources
    dataSources: {
      title: '数据源',
      createNew: '新建',
      searchPlaceholder: '搜索数据源...',
      noDataSources: '还没有数据源',
      noDataSourcesDesc: '创建第一个数据源开始使用',
      noResults: '没有匹配的结果',
      noResultsDesc: '尝试使用不同的搜索关键词',
      selectOne: '选择一个数据源',
      selectOneDesc: '从左侧列表中选择数据源查看详情',

      // Form
      form: {
        name: '名称',
        namePlaceholder: '生产数据库',
        type: '数据库类型',
        typePlaceholder: '选择数据库类型',
        host: '主机地址',
        hostPlaceholder: 'localhost',
        port: '端口',
        database: '数据库名',
        databasePlaceholder: 'mydb',
        username: '用户名',
        usernamePlaceholder: 'postgres',
        password: '密码',
        passwordPlaceholder: '••••••••',
        passwordKeepHint: '留空以保持密码不变',
        description: '描述',
        descriptionOptional: '描述（可选）',
        descriptionPlaceholder: '关于此数据源的描述...',
        testConnection: '测试连接',
        creating: '创建中',
        updating: '更新中',
      },

      // Status
      status: {
        active: '活跃',
        inactive: '禁用',
        error: '错误',
      },

      // Actions
      actions: {
        viewTables: '查看表列表',
        backToDetail: '返回详情',
      },

      // Details
      details: {
        title: '连接信息',
        host: '主机地址',
        port: '端口',
        database: '数据库',
        username: '用户名',
        status: '状态',
        createdAt: '创建时间',
        description: '描述',
      },

      // Connection Test
      connectionTest: {
        title: '测试数据库连接',
        subtitle: '正在验证数据库连接配置...',
        testing: '连接中...',
        success: '连接成功！',
        failed: '连接失败',
        failedDesc: '请检查连接配置并重试',
        configCorrect: '数据库连接配置正确，可以正常使用。',
        done: '完成',
        close: '关闭',
        latency: '延迟',
      },

      // Tables
      tables: {
        title: '表列表',
        searchPlaceholder: '搜索表名...',
        noTables: '没有找到表',
        noTablesDesc: '此数据源中没有可访问的表',
        tableName: '表名',
        rowCount: '行数',
        showing: '显示',
        of: '/',
        tables: '个表',
      },

      // Messages
      messages: {
        createSuccess: '数据源创建成功！',
        updateSuccess: '数据源更新成功！',
        deleteSuccess: '数据源删除成功！',
        createError: '创建数据源失败',
        updateError: '更新数据源失败',
        deleteError: '删除数据源失败',
        loadError: '加载数据源失败',
        testError: '连接测试失败',
        deleteConfirm: '确认删除',
        deleteConfirmDesc: '确定要删除数据源 "{name}" 吗？此操作无法撤销。',
      },
    },

    // Tools
    tools: {
      title: '工具',
      selectPrompt: '选择一个工具或创建新工具',
      selectPromptDesc: '从列表中选择工具或点击新建按钮创建',
      createNew: '创建新工具',
      createTitle: '创建新工具',
      editTitle: '编辑工具',

      // List
      list: {
        title: '工具',
        create: '新建',
        searchPlaceholder: '搜索工具...',
        ungrouped: '未分组',
        empty: '暂无工具',
        noResults: '没有找到工具',
        createFirst: '创建第一个工具',
        deleteTitle: '删除工具',
        deleteConfirm: '确定要删除此工具吗？此操作无法撤销。',
      },

      // Tabs
      tabs: {
        basic: '基本信息',
        parameters: '参数配置',
        output: '输出模式',
        test: '测试',
      },

      // Basic Info
      basicInfo: {
        title: '基本信息',
        description: '配置工具的基本属性。',
      },

      // Form
      form: {
        query: '关联查询',
        queryPlaceholder: '选择查询',
        noQueries: '暂无可用查询',
        displayName: '显示名称',
        displayNamePlaceholder: '用户友好的名称',
        name: '工具名称（snake_case）',
        namePlaceholder: 'tool_name',
        nameHint: '用作 MCP 工具标识符，仅支持小写字母、数字和下划线。',
        description: '描述',
        descriptionPlaceholder: '描述此工具的功能，支持 Markdown。',
        descriptionHint: '此描述将展示给 AI 模型，请确保清晰简洁。',
        generateDescription: 'AI 生成',
      },

      // Parameters Tab
      parametersTab: {
        title: '参数配置',
        description: '配置参数如何暴露给 AI 模型。',
      },

      // Parameters
      parameters: {
        selectQueryFirst: '请先选择一个查询以配置参数。',
        noParameters: '所选查询没有参数。',
        hint: '配置参数如何暴露给 AI 模型，您可以覆盖查询的默认值。',
        resetAll: '全部重置',
        resetTooltip: '重置所有参数到查询默认值',
        resetOne: '重置为查询默认值',
        required: '必填',
        modified: '已修改',
        type: '类型',
        default: '默认值',
        defaultPlaceholder: '可选的默认值',
        requiredLabel: '必填',
        requiredHint: 'AI 必须提供此参数',
        description: '描述',
        descriptionPlaceholder: '描述此参数的作用',
        descriptionHint: '此描述帮助 AI 理解如何使用此参数。',
        format: '格式',
      },

      // Output Tab
      outputTab: {
        title: '输出模式',
        description: '定义工具输出的 JSON Schema。',
      },

      // Output Schema
      outputSchema: {
        hint: '定义工具输出的 JSON Schema，帮助 AI 模型理解响应结构。',
        visual: '可视化',
        json: 'JSON',
        generateTitle: '从测试生成',
        generateHint: '使用默认参数执行工具以推断输出模式。',
        generate: '生成模式',
        generated: '模式生成成功！',
        apply: '应用',
        preview: '模式预览',
        empty: '尚未定义模式。',
        itemProperties: '项属性：',
        jsonEditor: 'JSON Schema',
      },

      // Test Tab
      testTab: {
        title: '测试工具',
        description: '使用示例参数测试工具并查看 MCP 定义。',
      },

      // Test
      test: {
        saveFirst: '请先保存工具才能测试。',
        testTab: '测试',
        mcpTab: 'MCP 定义',
        parameters: '参数',
        parametersHint: '为每个参数输入测试值。',
        required: '必填',
        execute: '执行测试',
        executing: '执行中...',
        success: '执行成功',
        failed: '执行失败',
        error: '错误',
        rows: '行',
        preview: '数据预览',
        showingFirst: '显示前 10 条，共',
        mcpDefinition: 'MCP 工具定义',
        mcpHint: '暴露给 MCP 客户端的工具定义。',
        copyMcp: '复制到剪贴板',
        copied: '已复制到剪贴板！',
        copyFailed: '复制失败',
        noMcpDefinition: 'MCP 定义不可用。',
      },

      // Messages
      messages: {
        createSuccess: '工具创建成功！',
        updateSuccess: '工具更新成功！',
        deleteSuccess: '工具删除成功！',
        createError: '创建工具失败',
        updateError: '更新工具失败',
        deleteError: '删除工具失败',
        testError: '测试工具失败',
        generateError: '生成描述失败',
      },
    },

    // MCP Servers
    mcpServers: {
      title: 'MCP 服务器',
      subtitle: '管理和发布你的 MCP 服务器',
      create: '新建服务器',
      searchPlaceholder: '搜索服务器...',
      empty: '暂无 MCP 服务器',
      noResults: '没有找到服务器',
      createFirst: '创建第一个服务器',
      notFound: '服务器未找到',
      backToList: '返回列表',

      status: {
        draft: '草稿',
        published: '已发布',
        stopped: '已停止',
        error: '错误',
      },

      card: {
        tools: '个工具',
        noDescription: '暂无描述',
        configure: '配置',
        monitoring: '监控',
        copyConfig: '复制配置',
        publish: '发布',
        stop: '停止',
      },

      createDialog: {
        title: '创建 MCP 服务器',
        subtitle: '创建一个新的 MCP 服务器来暴露你的工具。',
        name: '名称',
        namePlaceholder: 'my-mcp-server',
        descriptionLabel: '描述',
        descriptionPlaceholder: '描述你的 MCP 服务器...',
      },

      deleteDialog: {
        title: '删除服务器',
        description: '确定要删除此 MCP 服务器吗？此操作无法撤销。',
      },

      configTabs: {
        basic: '基本信息',
        tools: '工具选择',
        advanced: '高级配置',
        access: '访问控制',
      },

      basicInfo: {
        title: '基本信息',
        subtitle: '配置 MCP 服务器的基本属性。',
        name: '名称',
        namePlaceholder: 'my-mcp-server',
        descriptionLabel: '描述',
        descriptionPlaceholder: '描述你的 MCP 服务器...',
        endpoint: '端点',
        apiKey: 'API 密钥',
      },

      toolsTab: {
        title: '工具选择',
        description: '选择要通过此 MCP 服务器暴露的工具。',
      },

      advancedTab: {
        title: '高级配置',
        description: '配置性能和行为设置。',
      },

      accessTab: {
        title: '访问控制',
        description: '配置安全和访问限制。',
      },

      toolSelector: {
        available: '可用工具',
        selected: '已选工具',
        searchPlaceholder: '搜索工具...',
        selectAll: '全选',
        noResults: '没有匹配的工具',
        allSelected: '所有工具已选择',
        noSelected: '未选择工具',
        moveAllRight: '全部移到右边',
        moveRight: '移到右边',
        moveLeft: '移到左边',
        moveAllLeft: '全部移到左边',
      },

      config: {
        timeout: '超时时间（秒）',
        timeoutHint: '每次工具调用的最大执行时间',
        rateLimit: '速率限制（请求/分钟）',
        rateLimitHint: '每分钟允许的最大请求数',
        logLevel: '日志级别',
        logLevelHint: '最低记录的日志级别',
        logLevels: {
          debug: '调试',
          info: '信息',
          warn: '警告',
          error: '错误',
        },
        enableCache: '启用缓存',
        enableCacheHint: '为重复查询缓存工具响应',
        cacheExpiration: '缓存过期时间（毫秒）',
        cacheExpirationHint: '缓存响应的保留时间（默认：5 分钟）',
      },

      accessControl: {
        apiKeyRequired: '需要 API 密钥',
        apiKeyRequiredHint: '客户端必须提供有效的 API 密钥才能访问此服务器',
        allowedOrigins: '允许的来源（CORS）',
        allowedOriginsHint: '允许跨域请求的来源列表。留空允许所有。',
        originPlaceholder: 'https://example.com',
        ipWhitelist: 'IP 白名单',
        ipWhitelistHint: '只允许来自这些 IP 地址的请求。留空允许所有。',
        ipPlaceholder: '192.168.1.1 或 10.0.0.0/24',
      },

      actions: {
        test: '测试',
        publish: '发布',
      },

      test: {
        success: '测试通过',
        failed: '测试失败',
      },

      configCopy: {
        title: 'MCP 配置',
        description: '复制此配置以在你的 MCP 客户端中使用。',
        usageTitle: '使用方法：',
        step1: '复制下面的配置',
        step2: '将其添加到你的 MCP 客户端配置文件（如 claude_desktop_config.json）',
        step3: '重启你的 MCP 客户端以应用更改',
        copy: '复制',
        copied: '已复制！',
        copyFailed: '复制失败',
        loadFailed: '加载配置失败',
        serverName: '服务器',
        endpoint: '端点',
      },

      monitoring: {
        title: '监控仪表盘',
        noData: '暂无监控数据',
        totalCalls: '总调用次数',
        today: '今日',
        successRate: '成功率',
        excellent: '优秀',
        good: '良好',
        needsAttention: '需要关注',
        avgResponseTime: '平均响应时间',
        fast: '快速',
        normal: '正常',
        slow: '缓慢',
        topTool: '最常用工具',
        calls: '次调用',
        callTrend: '调用趋势',
        callTrendDesc: '每日调用量变化',
        successCalls: '成功',
        errorCalls: '错误',
        topTools: '热门工具',
        topToolsDesc: '最常被调用的工具',
        responseTimeDistribution: '响应时间分布',
        recentCalls: '最近调用',
        recentCallsDesc: '最近的工具调用记录',
        time: '时间',
        tool: '工具',
        status: '状态',
        responseTime: '响应时间',
        noLogs: '暂无调用记录',
        noChartData: '暂无数据',
        autoRefreshOn: '自动刷新开启',
        autoRefreshOff: '自动刷新关闭',
        configure: '配置',
        notPublished: '服务器未发布',
        notPublishedDesc: '发布服务器后可查看监控数据。',
        goToConfigure: '前往配置',
      },
    },

    // Queries
    queries: {
      title: '查询',
      searchPlaceholder: '搜索查询...',
      noQueries: '暂无查询',
      noResults: '没有匹配的查询',
      selectPrompt: '选择一个查询或创建新查询',
      selectPromptDesc: '从列表中选择查询或点击 + 按钮创建新查询',
      createNew: '创建新查询',
      deleteConfirm: '删除查询',
      deleteConfirmDesc: '确定要删除 "{name}" 吗？此操作无法撤销。',

      // Form
      form: {
        namePlaceholder: '查询名称',
        descriptionPlaceholder: '描述（可选）',
      },

      // Actions
      actions: {
        format: '格式化',
        validate: '验证',
      },

      // Editor
      editor: {
        paramsDetected: '检测到参数：',
      },

      // Tabs
      tabs: {
        params: '参数配置',
        test: '测试执行',
        history: '执行历史',
      },

      // Parameter Config
      paramConfig: {
        type: '类型',
        defaultValue: '默认值',
        defaultValuePlaceholder: '可选',
        description: '描述',
        descriptionPlaceholder: '参数描述...',
        required: '必填',
        unconfiguredParams: '检测到未配置的参数：',
        noParams: '暂无配置的参数',
        noParamsHint: '在 SQL 中使用 :paramName 语法来定义参数',
      },

      // Test Panel
      testPanel: {
        parameters: '参数',
        execute: '执行查询',
        executing: '执行中...',
        noResults: '执行查询以查看结果',
        executionFailed: '执行失败',
        success: '成功',
        rows: '行',
        exportCSV: '导出 CSV',
        missingParams: '缺少必填参数：',
      },

      // History
      history: {
        empty: '暂无执行历史',
        emptyHint: '执行查询后在此查看历史记录',
        rows: '行',
        params: '参数',
        rerun: '重新执行',
      },

      // Schema Explorer
      schema: {
        dataSource: '数据源',
        selectDataSource: '选择数据源',
        searchTables: '搜索表...',
        selectPrompt: '请选择数据源',
        noTables: '没有找到表',
        noResults: '没有匹配的表',
        tables: '个表',
      },

      // Messages
      messages: {
        createSuccess: '查询创建成功！',
        updateSuccess: '查询更新成功！',
        deleteSuccess: '查询删除成功！',
        createError: '创建查询失败',
        updateError: '更新查询失败',
        deleteError: '删除查询失败',
        formatSuccess: 'SQL 已格式化',
        formatError: '格式化 SQL 失败',
        validateSuccess: 'SQL 验证通过',
        validateError: 'SQL 验证失败',
        selectDataSource: '请先选择数据源',
        nameRequired: '查询名称不能为空',
        sqlRequired: 'SQL 不能为空',
        saveFirst: '请先保存查询',
      },
    },

    // Error Pages
    errors: {
      notFound: {
        title: '404',
        subtitle: '页面未找到',
        description: '抱歉，您访问的页面不存在。请检查 URL 是否正确，或返回首页。',
      },
      general: {
        title: '发生错误',
        description: '应用程序遇到了一个意外错误',
        details: '错误详情',
        technicalDetails: '技术详情（开发者信息）',
        persistentError: '如果问题持续存在，请联系技术支持或刷新页面重试。',
      },
    },
  },
} as const

export type Language = keyof typeof translations
export type TranslationKey = typeof translations.en
