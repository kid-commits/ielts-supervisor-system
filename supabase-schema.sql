-- =====================================================
-- IELTS Tracker 数据库表结构
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本
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
-- 创建索引以提高查询性能
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_date ON focus_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_users_license_key ON users(license_key);

-- =====================================================
-- 启用 RLS（Row Level Security）
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_data ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 删除可能存在的旧策略
-- =====================================================
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can view own tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can view own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can insert own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can view own streak" ON streak_data;
DROP POLICY IF EXISTS "Users can insert own streak" ON streak_data;
DROP POLICY IF EXISTS "Users can update own streak" ON streak_data;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on user_goals" ON user_goals;
DROP POLICY IF EXISTS "Allow all operations on daily_tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Allow all operations on focus_sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Allow all operations on streak_data" ON streak_data;

-- =====================================================
-- RLS 策略
-- 由于项目使用自定义认证（license key），不使用 Supabase Auth
-- 数据隔离在应用层通过 user_id 过滤实现
-- 这里使用宽松的策略允许认证用户访问
-- =====================================================

-- 用户表策略：允许所有操作（应用层已通过 user_id 隔离）
CREATE POLICY "Allow authenticated access to users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- 目标设置策略：允许所有操作
CREATE POLICY "Allow authenticated access to user_goals" ON user_goals
  FOR ALL USING (true) WITH CHECK (true);

-- 每日任务策略：允许所有操作
CREATE POLICY "Allow authenticated access to daily_tasks" ON daily_tasks
  FOR ALL USING (true) WITH CHECK (true);

-- 专注记录策略：允许所有操作
CREATE POLICY "Allow authenticated access to focus_sessions" ON focus_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- 连续打卡策略：允许所有操作
CREATE POLICY "Allow authenticated access to streak_data" ON streak_data
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 完成！
-- =====================================================
