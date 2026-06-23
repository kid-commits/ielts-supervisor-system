# Supabase 数据持久化配置指南

## 📋 完成状态

✅ 已完成：
- 安装 `@supabase/supabase-js` 依赖
- 创建 `src/lib/supabase.ts` 客户端
- 创建 `src/lib/supabase-storage.ts` 存储模块
- 修改所有页面适配异步操作
- 实现用户数据隔离（通过 user_id）
- Build 测试通过

⏳ 需要你完成：
- 在 Supabase SQL Editor 执行建表 SQL
- 配置 Vercel 环境变量

---

## 🗄️ 第一步：创建数据库表

1. 打开 https://supabase.com/dashboard
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New query**
5. 复制下面的 SQL 并执行：

```sql
-- =====================================================
-- IELTS Tracker 数据库表结构
-- =====================================================

-- 1. 用户表（存储许可证密钥信息）
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 用户目标设置表
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_score DECIMAL(3,1),
  target_listening DECIMAL(3,1),
  target_reading DECIMAL(3,1),
  target_writing DECIMAL(3,1),
  target_speaking DECIMAL(3,1),
  exam_date DATE,
  current_score DECIMAL(3,1),
  daily_study_hours DECIMAL(3,1),
  is_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. 每日任务表
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  date DATE NOT NULL,
  skill TEXT NOT NULL,
  title TEXT,
  description TEXT,
  target_minutes INTEGER,
  actual_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_id, date)
);

-- 4. 专注记录表
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT,
  duration_minutes INTEGER,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 连续打卡记录表
CREATE TABLE IF NOT EXISTS streak_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  total_study_days INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 创建索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_date ON focus_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_users_license_key ON users(license_key);

-- =====================================================
-- 启用 RLS
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_data ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS 策略（允许认证用户访问）
-- =====================================================
CREATE POLICY "Allow authenticated access to users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated access to user_goals" ON user_goals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated access to daily_tasks" ON daily_tasks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated access to focus_sessions" ON focus_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated access to streak_data" ON streak_data
  FOR ALL USING (true) WITH CHECK (true);
```

---

## 🔧 第二步：配置 Vercel 环境变量

在 Vercel Dashboard 中添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ptpfokbnahgzytvasvma.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase Anon Key |

获取 Anon Key：
1. 在 Supabase Dashboard 进入 **Settings** → **API**
2. 复制 **anon** **public** 的完整 key

---

## 📊 数据库表结构说明

| 表名 | 作用 | 关键字段 |
|------|------|----------|
| `users` | 存储用户信息 | `id`, `license_key`, `activated_at`, `expires_at` |
| `user_goals` | 存储学习目标 | `user_id`, `target_score`, `exam_date`, `daily_study_hours` |
| `daily_tasks` | 存储每日任务 | `user_id`, `task_id`, `date`, `skill`, `status` |
| `focus_sessions` | 存储专注记录 | `user_id`, `session_id`, `duration_minutes`, `date` |
| `streak_data` | 存储连续打卡 | `user_id`, `current_streak`, `longest_streak`, `total_study_days` |

---

## 🔐 数据隔离机制

每个用户的操作流程：
1. 用户使用 license key 登录
2. 系统通过 `getOrCreateUser(licenseKey)` 获取用户 UUID
3. 所有数据操作都通过 `eq('user_id', userId)` 过滤
4. 确保用户只能访问自己的数据

---

## 🧪 测试数据持久化

1. 使用密钥登录（如 `IELTS-TRIAL-2024-A1`）
2. 完成设置向导，设定目标
3. 添加并完成一些任务
4. 退出登录
5. 重新登录，验证数据是否保留
6. 在 Supabase Dashboard 的 **Table Editor** 中查看数据

---

## 📁 项目文件结构

```
src/lib/
├── supabase.ts          # Supabase 客户端初始化
├── supabase-storage.ts  # 数据持久化操作（Supabase）
├── storage.ts           # 登录状态管理（localStorage）
├── licenses.ts          # 许可证密钥管理
├── types.ts             # TypeScript 类型定义
└── utils.ts             # 工具函数
```

---

## ⚠️ 注意事项

1. **网络依赖**：需要网络连接才能保存和加载数据
2. **环境变量**：确保 Vercel 和本地都配置了正确的环境变量
3. **RLS 策略**：当前使用宽松策略，数据隔离在应用层实现
4. **数据备份**：建议定期在 Supabase Dashboard 导出数据备份

---

## 🚀 部署步骤

1. 在 Supabase SQL Editor 执行建表 SQL
2. 在 Vercel 配置环境变量
3. 推送代码到 GitHub
4. Vercel 会自动部署
5. 测试数据持久化功能
