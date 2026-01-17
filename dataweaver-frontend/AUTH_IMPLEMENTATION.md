# 认证功能实现文档

## 概述

DataWeaver 前端已完全实现后端认证功能，包括登录和注册。

## 后端 API 对接

### API 端点

#### 登录
- **URL**: `POST /api/v1/auth/login`
- **请求体**:
  ```json
  {
    "username": "admin",
    "password": "password123"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "is_active": true
      }
    }
  }
  ```

#### 注册
- **URL**: `POST /api/v1/auth/register`
- **请求体**:
  ```json
  {
    "username": "newuser",
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **响应**: 与登录相同

## 前端实现

### 文件结构

```
src/
├── api/
│   └── auth.ts              # 认证 API 调用
├── types/
│   └── auth.ts              # 认证类型定义
├── pages/
│   ├── Login.tsx            # 登录页面
│   └── Register.tsx         # 注册页面
└── i18n/
    └── translations.ts      # 包含认证相关翻译
```

### 类型定义

**`src/types/auth.ts`**:
```typescript
export interface LoginRequest {
  username: string  // 注意：使用 username 而不是 email
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface UserInfo {
  id: number
  username: string
  email: string
  is_active: boolean
}

export interface AuthResponse {
  token: string
  expires_at: string
  user: UserInfo
}
```

### API 客户端

**`src/api/auth.ts`**:
```typescript
export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/v1/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/v1/auth/register', data),
}
```

### 页面功能

#### 登录页面 (`/login`)

**功能**:
- ✅ 使用 `username` 和 `password` 登录
- ✅ 完整的错误处理（401, 403 等）
- ✅ 成功后存储 JWT token 和用户信息到 localStorage
- ✅ 显示成功 toast 提示
- ✅ 自动跳转到首页
- ✅ 开发模式"跳过登录"功能
- ✅ 链接到注册页面
- ✅ 完整的国际化支持

**验证规则**:
- Username: 必填
- Password: 必填

#### 注册页面 (`/register`)

**功能**:
- ✅ 使用 `username`、`email` 和 `password` 注册
- ✅ 完整的错误处理（409 冲突等）
- ✅ 成功后自动登录（存储 token 和用户信息）
- ✅ 显示成功 toast 提示
- ✅ 自动跳转到首页
- ✅ 链接到登录页面
- ✅ 完整的国际化支持

**验证规则**:
- Username: 3-50 字符，必填
- Email: 有效邮箱格式，最长 100 字符，必填
- Password: 6-100 字符，必填

### 路由配置

```typescript
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/register',
    element: <Register />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorBoundary />,
    children: [...],
  },
])
```

### 认证流程

#### 1. 用户登录
```
用户输入 username 和 password
  ↓
POST /api/v1/auth/login
  ↓
后端验证凭据
  ↓
返回 JWT token 和用户信息
  ↓
前端存储到 localStorage
  ↓
更新 Zustand store 的用户状态
  ↓
显示成功提示
  ↓
跳转到首页（使用 window.location.href）
```

#### 2. API 请求认证
```
用户访问受保护的资源（如 /datasources）
  ↓
axios 拦截器自动添加 Authorization header
  ↓
Bearer {token}
  ↓
后端验证 JWT
  ↓
返回数据 或 401 错误
```

#### 3. 登录态恢复
```
用户刷新页面或重新打开应用
  ↓
MainLayout 组件加载
  ↓
检查 localStorage 中的 token
  ↓
如果没有 token → 重定向到 /login
  ↓
如果有 token 但 store 中没有 user
  ↓
从 localStorage 恢复 user 到 store
  ↓
继续渲染应用
```

#### 4. 401 错误处理
```
API 返回 401 Unauthorized
  ↓
axios 响应拦截器捕获
  ↓
清除 localStorage 中的 token
  ↓
重定向到 /login
```

### Token 管理

#### 存储位置
- **Token**: `localStorage.setItem('token', jwt_token)`
- **用户信息**: `localStorage.setItem('user', JSON.stringify(userInfo))`

#### 自动添加到请求
**`src/api/client.ts`**:
```typescript
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  }
)
```

#### 401 处理
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
```

## 错误处理

### 登录错误

| 状态码 | 错误 | 前端显示 |
|--------|------|---------|
| 400 | 请求参数错误 | "Invalid username or password" |
| 401 | 凭据无效 | "Invalid username or password" |
| 403 | 用户未激活 | "User account is not active" |
| 500 | 服务器错误 | "Login failed. Please check your credentials." |

### 注册错误

| 状态码 | 错误 | 前端显示 |
|--------|------|---------|
| 400 | 请求参数错误 | 具体的验证错误消息 |
| 409 | 用户已存在 | "User with this username or email already exists" |
| 500 | 服务器错误 | "Registration failed" |

## 开发模式

### 跳过登录功能

在开发环境（`import.meta.env.DEV`）下，登录页面显示"跳过登录"按钮：

```typescript
const handleSkipLogin = () => {
  localStorage.setItem('token', 'dev-token')
  localStorage.setItem('user', JSON.stringify({
    id: 1,
    username: 'dev-user',
    email: 'dev@example.com',
    is_active: true
  }))
  toast.success('Development mode: Login skipped')
  navigate('/')
}
```

**注意**: 这不会通过后端验证，只用于前端 UI 开发和测试。

## 国际化

### 认证相关翻译

所有认证界面都支持中英文切换：

**英文**:
- "Welcome Back" (登录标题)
- "Username", "Password"
- "Login", "Logging in..."
- "Invalid username or password"
- "Create Account" (注册标题)
- "Don't have an account? Sign up"

**中文**:
- "欢迎回来" (登录标题)
- "用户名", "密码"
- "登录", "登录中..."
- "用户名或密码错误"
- "创建账户" (注册标题)
- "还没有账户？注册"

## 测试

### 测试登录功能

1. **启动开发服务器**:
   ```bash
   cd dataweaver-frontend
   npm run dev
   ```

2. **访问登录页面**: http://localhost:5173/login

3. **测试场景**:

   a. **跳过登录（开发模式）**:
      - 点击"Skip Login (Development)"按钮
      - 验证成功跳转到首页
      - 验证 localStorage 中有 token 和 user

   b. **真实登录**:
      - 输入有效的 username 和 password
      - 点击"Login"
      - 验证显示登录中状态
      - 验证成功后跳转和 toast 提示

   c. **错误处理**:
      - 输入无效凭据
      - 验证显示错误消息
      - 验证错误消息支持国际化

### 测试注册功能

1. **访问注册页面**: http://localhost:5173/register

2. **测试场景**:

   a. **成功注册**:
      - 输入 username (3-50 字符)
      - 输入有效的 email
      - 输入 password (6+ 字符)
      - 验证成功后自动登录并跳转

   b. **验证规则**:
      - 测试 username 少于 3 字符
      - 测试无效的 email 格式
      - 测试 password 少于 6 字符

   c. **用户已存在**:
      - 使用已存在的 username 或 email
      - 验证显示 409 错误消息

### 测试认证流程

1. **未登录访问受保护资源**:
   - 清除 localStorage
   - 访问 http://localhost:5173/datasources
   - 验证自动重定向到 /login

2. **登录后访问**:
   - 登录成功
   - 访问 /datasources
   - 验证可以正常访问

3. **Token 过期**:
   - 设置一个无效的 token
   - 访问任何受保护资源
   - 验证收到 401 并重定向到 /login

## 安全注意事项

1. **密码处理**:
   - 前端不存储明文密码
   - 使用 `type="password"` 输入框
   - 后端使用 bcrypt 哈希

2. **Token 安全**:
   - JWT token 存储在 localStorage
   - 每次请求自动添加到 Authorization header
   - 使用 Bearer scheme

3. **HTTPS**:
   - 生产环境必须使用 HTTPS
   - 防止 token 被中间人攻击窃取

4. **XSS 防护**:
   - React 自动转义输出
   - 不使用 dangerouslySetInnerHTML

5. **CORS**:
   - 后端配置了 CORS 中间件
   - 允许必要的请求头

## 与后端集成

### 环境变量

创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 开发环境

```bash
# 启动后端
cd /path/to/dataweaver
go run cmd/dataweaver/main.go

# 启动前端
cd dataweaver-frontend
npm run dev
```

### 生产环境

```bash
# 构建前端
npm run build

# 前端静态文件在 dist/ 目录
# 配置后端服务静态文件
```

## 路由保护

### MainLayout 路由守卫

**`src/components/layout/MainLayout.tsx`**:
```typescript
useEffect(() => {
  // Check if user is logged in
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')

  if (!token) {
    // No token, redirect to login
    navigate('/login', { replace: true })
    return
  }

  // Restore user from localStorage if not in store
  if (!user && userStr) {
    try {
      const userData = JSON.parse(userStr)
      setUser({
        id: String(userData.id),
        name: userData.username,
        email: userData.email,
      })
    } catch (err) {
      navigate('/login', { replace: true })
    }
  }
}, [user, setUser, navigate])
```

**功能**:
- 在每次访问受保护的路由时检查登录态
- 如果没有 token，自动重定向到登录页
- 从 localStorage 恢复用户信息到 Zustand store
- 确保页面刷新后用户信息不丢失

## 最近修复

### 2024-01-15: 修复登录跳转和状态保留问题

**问题**:
1. 登录成功后显示 success 但不跳转
2. 进入首页后没有保留登录态

**原因**:
1. `navigate()` 在某些情况下不可靠
2. Zustand store 的用户状态在页面刷新后丢失
3. MainLayout 没有检查和恢复登录态

**解决方案**:
1. **Login.tsx & Register.tsx**:
   - 改用 `window.location.href = '/'` 替代 `navigate()`
   - 添加 `setTimeout` 确保 localStorage 写入完成
   - 添加 console.log 用于调试
   - 同时更新 localStorage 和 Zustand store

2. **MainLayout.tsx**:
   - 添加 `useEffect` 检查登录态
   - 从 localStorage 恢复用户信息到 store
   - 未登录时自动重定向到 /login

3. **useAppStore.ts**:
   - logout 函数添加清除 user 和重定向逻辑

## 未来改进

- [ ] 实现"记住我"功能
- [ ] 添加密码重置功能
- [ ] 实现 OAuth 第三方登录
- [ ] 添加双因素认证（2FA）
- [ ] Token 自动刷新机制
- [ ] 实现 refresh token
- [ ] 添加登录历史记录
- [ ] 密码强度检测器
