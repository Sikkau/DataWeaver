export const translations = {
  en: {
    // Common
    common: {
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      cancel: 'Cancel',
      save: 'Save',
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
