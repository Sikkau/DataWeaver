# 国际化（i18n）实现文档

## 概述

DataWeaver 前端应用已完整实现中英文国际化支持，所有用户界面元素都支持实时语言切换。

## 已实现的功能

### 1. 核心国际化系统

#### 文件结构
```
src/i18n/
├── translations.ts      # 翻译内容（中英文）
├── I18nContext.tsx      # React Context 和 Provider
└── index.ts            # 统一导出
```

#### 特性
- ✅ 支持 **English (en)** 和 **简体中文 (zh)**
- ✅ 自动检测浏览器语言
- ✅ 语言偏好保存到 localStorage
- ✅ 实时切换，无需刷新页面
- ✅ HTML lang 属性自动更新
- ✅ 错误边界页面独立语言检测（不依赖 Context）

### 2. 语言切换器组件

位置：页面右上角工具栏
- **组件路径**: `src/components/LanguageSwitcher.tsx`
- **图标**: 地球图标（Languages）
- **功能**: 下拉菜单选择语言，当前语言高亮显示

### 3. 已国际化的页面和组件

#### 核心页面
- ✅ **Login 页面** - 完整的登录界面国际化
- ✅ **DataSources 页面** - 数据源管理的所有文本
- ✅ **NotFound 页面** - 404 错误页面
- ✅ **ErrorBoundary** - 通用错误边界

#### 布局组件
- ✅ **Sidebar** - 导航菜单标签
- ✅ **Header** - 已集成语言切换器

#### 数据源相关组件
- ✅ **DataSourceCard** - 卡片显示（使用父组件翻译）
- ✅ **DataSourceForm** - 表单字段和验证
- ✅ **ConnectionTestDialog** - 连接测试对话框
- ✅ **TableBrowser** - 表浏览器

### 4. 翻译覆盖范围

#### 通用文本 (common)
- create, edit, delete, cancel, save, update
- search, loading, error, success
- back, home, goBack, goHome

#### 导航 (nav)
- Dashboard, Data Sources, Queries, Jobs, Settings

#### 认证 (auth)
- 登录表单所有字段
- 错误消息
- 开发模式跳过登录按钮

#### 数据源管理 (dataSources)
- 页面标题和按钮
- 搜索和过滤
- 空状态提示
- 表单字段和验证消息
- 详情视图
- 状态文本（活跃、禁用、错误）
- 连接测试
- 表列表
- 成功/错误消息

#### 错误页面 (errors)
- 404 页面文本
- 通用错误页面文本
- 技术详情标签

## 使用方法

### 在组件中使用国际化

```typescript
import { useI18n } from '@/i18n/I18nContext'

function MyComponent() {
  const { t, language, setLanguage } = useI18n()

  return (
    <div>
      <h1>{t.dataSources.title}</h1>
      <button>{t.common.create}</button>
      <p>Current language: {language}</p>
    </div>
  )
}
```

### 编程式切换语言

```typescript
const { setLanguage } = useI18n()

// 切换到英文
setLanguage('en')

// 切换到中文
setLanguage('zh')
```

### 在错误边界中使用（无 Context）

```typescript
import { translations, Language } from '@/i18n/translations'

function getTranslations() {
  const storedLang = localStorage.getItem('dataweaver-language') as Language | null
  const browserLang = navigator.language.toLowerCase()
  const defaultLang: Language = browserLang.startsWith('zh') ? 'zh' : 'en'
  const lang = (storedLang && (storedLang === 'en' || storedLang === 'zh'))
    ? storedLang
    : defaultLang

  return translations[lang]
}
```

## 添加新的翻译

### 1. 在翻译文件中添加内容

编辑 `src/i18n/translations.ts`:

```typescript
export const translations = {
  en: {
    // 添加新的翻译键
    myFeature: {
      title: 'My Feature',
      description: 'This is my feature',
    },
  },
  zh: {
    // 添加对应的中文翻译
    myFeature: {
      title: '我的功能',
      description: '这是我的功能',
    },
  },
}
```

### 2. 在组件中使用

```typescript
const { t } = useI18n()
return <h1>{t.myFeature.title}</h1>
```

## 认证流程

### 登录页面
- **路由**: `/login`
- **功能**:
  - JWT 认证登录表单
  - 开发模式下提供"跳过登录"按钮
  - 完整国际化支持
  - 语言切换器

### API 拦截器
- **401 错误**: 自动清除 token 并重定向到 `/login`
- **防止循环重定向**: 已在 `/login` 页面时不再重定向

### 开发模式快速访问
在开发环境下，点击"跳过登录"按钮可以设置临时 token 直接进入应用。

## 技术实现细节

### Context 提供者
所有路由都包裹在 `I18nProvider` 中（`App.tsx`），确保所有组件都能访问翻译。

### localStorage 持久化
语言选择保存在 `localStorage` 的 `dataweaver-language` 键中。

### HTML lang 属性
语言切换时自动更新 `<html lang="xx">` 属性，有利于 SEO 和无障碍访问。

### 错误边界特殊处理
由于错误边界在路由树外渲染，无法访问 Context，因此使用独立的语言检测逻辑，直接从 localStorage 读取。

## 测试

### 测试语言切换
1. 启动开发服务器: `npm run dev`
2. 打开浏览器访问应用
3. 点击右上角的语言图标
4. 选择不同的语言
5. 验证所有文本都正确切换

### 测试 404 页面
1. 访问一个不存在的路径（如 `/nonexistent`）
2. 验证 404 页面显示正确的语言
3. 切换语言确认 404 页面也会更新

### 测试登录页面
1. 访问 `/login`
2. 验证登录表单使用正确的语言
3. 切换语言确认所有字段都更新

### 测试认证流程
1. 清除 localStorage 中的 token
2. 访问数据源页面
3. 应该被重定向到登录页面
4. 使用"跳过登录"（开发模式）进入应用

## 注意事项

1. **新增页面**: 创建新页面时，确保导入并使用 `useI18n()` hook
2. **硬编码文本**: 避免在组件中直接写中文或英文，所有文本都应该从翻译文件中读取
3. **动态文本**: 对于需要插入变量的文本，使用 `.replace()` 方法（如删除确认对话框）
4. **类型安全**: TypeScript 会检查翻译键是否存在，避免拼写错误

## 未来改进

- [ ] 添加更多语言支持（日语、韩语等）
- [ ] 使用 i18next 或其他成熟的 i18n 库以支持更复杂的场景
- [ ] 添加日期、数字、货币格式化的国际化
- [ ] 实现翻译缺失的降级机制
- [ ] 支持 RTL（从右到左）语言
