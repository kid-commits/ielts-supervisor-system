import { getSupabase, getOrCreateUser } from './supabase'
import { AppState, GoalSettings, DayRecord, Task, FocusSession, StreakData } from './types'

const defaultState: AppState = {
  goal: null,
  dayRecords: {},
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: '',
    totalStudyDays: 0,
  },
  focusSessions: [],
  isOnboarded: false,
}

// 获取当前用户的 license key
function getCurrentLicenseKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('user-key')
}

// 从 Supabase 加载完整状态
export async function loadState(): Promise<AppState> {
  const licenseKey = getCurrentLicenseKey()
  if (!licenseKey) return defaultState

  const userId = await getOrCreateUser(licenseKey)
  if (!userId) {
    console.error('❌ 无法获取用户ID，加载数据失败')
    return defaultState
  }

  console.log('📥 从 Supabase 加载数据，用户ID:', userId)

  try {
    // 并行加载所有数据
    const [goalsRes, tasksRes, focusRes, streakRes] = await Promise.all([
      getSupabase().from('user_goals').select('*').eq('user_id', userId).single(),
      getSupabase().from('daily_tasks').select('*').eq('user_id', userId),
      getSupabase().from('focus_sessions').select('*').eq('user_id', userId),
      getSupabase().from('streak_data').select('*').eq('user_id', userId).single(),
    ])

    // 检查是否有错误
    if (goalsRes.error && goalsRes.error.code !== 'PGRST116') {
      console.error('❌ 加载目标失败:', goalsRes.error)
    }
    if (tasksRes.error) {
      console.error('❌ 加载任务失败:', tasksRes.error)
    }
    if (focusRes.error) {
      console.error('❌ 加载专注记录失败:', focusRes.error)
    }
    if (streakRes.error && streakRes.error.code !== 'PGRST116') {
      console.error('❌ 加载打卡记录失败:', streakRes.error)
    }

    // 构建 goal
    let goal: GoalSettings | null = null
    let isOnboarded = false
    if (goalsRes.data) {
      goal = {
        targetScore: goalsRes.data.target_score,
        targetScores: {
          listening: goalsRes.data.target_listening,
          reading: goalsRes.data.target_reading,
          writing: goalsRes.data.target_writing,
          speaking: goalsRes.data.target_speaking,
        },
        examDate: goalsRes.data.exam_date,
        currentScore: goalsRes.data.current_score,
        dailyStudyHours: goalsRes.data.daily_study_hours,
      }
      isOnboarded = goalsRes.data.is_onboarded
    }

    // 构建 dayRecords
    const dayRecords: Record<string, DayRecord> = {}
    if (tasksRes.data) {
      for (const task of tasksRes.data) {
        const date = task.date
        if (!dayRecords[date]) {
          dayRecords[date] = {
            date,
            tasks: [],
            focusMinutes: 0,
            completedCount: 0,
            totalCount: 0,
            isCompleted: false,
          }
        }
        dayRecords[date].tasks.push({
          id: task.task_id,
          skill: task.skill,
          title: task.title,
          description: task.description,
          targetMinutes: task.target_minutes,
          actualMinutes: task.actual_minutes,
          status: task.status,
          date: task.date,
          createdAt: new Date(task.created_at).getTime(),
        })
      }
      // 计算每个日期的统计
      for (const date of Object.keys(dayRecords)) {
        const record = dayRecords[date]
        record.totalCount = record.tasks.length
        record.completedCount = record.tasks.filter(t => t.status === 'completed').length
        record.isCompleted = record.tasks.every(t => t.status === 'completed' || t.status === 'skipped')
      }
    }

    // 构建 focusSessions
    const focusSessions: FocusSession[] = []
    if (focusRes.data) {
      for (const session of focusRes.data) {
        focusSessions.push({
          id: session.session_id,
          skill: session.skill,
          startTime: session.start_time,
          endTime: session.end_time,
          durationMinutes: session.duration_minutes,
          date: session.date,
        })
      }
      // 计算每天的专注分钟数
      for (const session of focusSessions) {
        if (dayRecords[session.date]) {
          dayRecords[session.date].focusMinutes += session.durationMinutes
        }
      }
    }

    // 构建 streak
    let streak: StreakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: '',
      totalStudyDays: 0,
    }
    if (streakRes.data) {
      streak = {
        currentStreak: streakRes.data.current_streak,
        longestStreak: streakRes.data.longest_streak,
        lastCompletedDate: streakRes.data.last_completed_date || '',
        totalStudyDays: streakRes.data.total_study_days,
      }
    }

    console.log('✅ 数据加载完成:', {
      hasGoal: !!goal,
      dayRecordsCount: Object.keys(dayRecords).length,
      focusSessionsCount: focusSessions.length,
      hasStreak: !!streakRes.data,
      isOnboarded
    })

    return {
      goal,
      dayRecords,
      streak,
      focusSessions,
      isOnboarded,
    }
  } catch (error) {
    console.error('❌ 从 Supabase 加载数据失败:', error)
    return defaultState
  }
}

// 保存目标设置
export async function updateGoal(goal: GoalSettings): Promise<void> {
  const licenseKey = getCurrentLicenseKey()
  if (!licenseKey) return

  const userId = await getOrCreateUser(licenseKey)
  if (!userId) {
    console.error('❌ 无法获取用户ID，保存目标失败')
    return
  }

  const { error } = await getSupabase()
    .from('user_goals')
    .upsert({
      user_id: userId,
      target_score: goal.targetScore,
      target_listening: goal.targetScores.listening,
      target_reading: goal.targetScores.reading,
      target_writing: goal.targetScores.writing,
      target_speaking: goal.targetScores.speaking,
      exam_date: goal.examDate,
      current_score: goal.currentScore,
      daily_study_hours: goal.dailyStudyHours,
      is_onboarded: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('❌ 保存目标失败:', error)
  } else {
    console.log('✅ 目标保存成功')
  }
}

// 保存每日任务
export async function saveTasks(date: string, tasks: Task[]): Promise<void> {
  const licenseKey = getCurrentLicenseKey()
  if (!licenseKey) return

  const userId = await getOrCreateUser(licenseKey)
  if (!userId) {
    console.error('❌ 无法获取用户ID，保存任务失败')
    return
  }

  // 先删除该日期的旧任务
  const { error: deleteError } = await getSupabase()
    .from('daily_tasks')
    .delete()
    .eq('user_id', userId)
    .eq('date', date)

  if (deleteError) {
    console.error('❌ 删除旧任务失败:', deleteError)
  }

  // 插入新任务
  if (tasks.length > 0) {
    const tasksToInsert = tasks.map(task => ({
      user_id: userId,
      task_id: task.id,
      date: date,
      skill: task.skill,
      title: task.title,
      description: task.description,
      target_minutes: task.targetMinutes,
      actual_minutes: task.actualMinutes,
      status: task.status,
    }))

    const { error: insertError } = await getSupabase()
      .from('daily_tasks')
      .insert(tasksToInsert)

    if (insertError) {
      console.error('❌ 保存任务失败:', insertError)
    } else {
      console.log('✅ 任务保存成功，数量:', tasks.length)
    }
  }
}

// 更新单个任务
export async function updateTask(date: string, taskId: string, updates: Partial<Task>): Promise<void> {
  const licenseKey = getCurrentLicenseKey()
  if (!licenseKey) return

  const userId = await getOrCreateUser(licenseKey)
  if (!userId) return

  const updateData: any = {}
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.actualMinutes !== undefined) updateData.actual_minutes = updates.actualMinutes

  await getSupabase()
    .from('daily_tasks')
    .update(updateData)
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .eq('date', date)
}

// 添加专注记录
export async function addFocusSession(session: FocusSession): Promise<void> {
  const licenseKey = getCurrentLicenseKey()
  if (!licenseKey) return

  const userId = await getOrCreateUser(licenseKey)
  if (!userId) return

  await getSupabase()
    .from('focus_sessions')
    .insert({
      user_id: userId,
      session_id: session.id,
      skill: session.skill,
      start_time: session.startTime,
      end_time: session.endTime,
      duration_minutes: session.durationMinutes,
      date: session.date,
    })
}

// 更新连续打卡
export async function updateStreak(streak: StreakData): Promise<void> {
  const licenseKey = getCurrentLicenseKey()
  if (!licenseKey) return

  const userId = await getOrCreateUser(licenseKey)
  if (!userId) return

  await getSupabase()
    .from('streak_data')
    .upsert({
      user_id: userId,
      current_streak: streak.currentStreak,
      longest_streak: streak.longestStreak,
      last_completed_date: streak.lastCompletedDate || null,
      total_study_days: streak.totalStudyDays,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
}

// 获取每日记录
export async function getDayRecord(date: string): Promise<DayRecord | null> {
  const licenseKey = getCurrentLicenseKey()
  if (!licenseKey) return null

  const userId = await getOrCreateUser(licenseKey)
  if (!userId) return null

  const { data: tasks } = await getSupabase()
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)

  if (!tasks || tasks.length === 0) return null

  const { data: focusSessions } = await getSupabase()
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)

  const focusMinutes = (focusSessions || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  const mappedTasks: Task[] = tasks.map(t => ({
    id: t.task_id,
    skill: t.skill,
    title: t.title,
    description: t.description,
    targetMinutes: t.target_minutes,
    actualMinutes: t.actual_minutes,
    status: t.status,
    date: t.date,
    createdAt: new Date(t.created_at).getTime(),
  }))

  return {
    date,
    tasks: mappedTasks,
    focusMinutes,
    completedCount: mappedTasks.filter(t => t.status === 'completed').length,
    totalCount: mappedTasks.length,
    isCompleted: mappedTasks.every(t => t.status === 'completed' || t.status === 'skipped'),
  }
}

// 获取最近几天的记录
export async function getRecentDays(days: number): Promise<DayRecord[]> {
  const licenseKey = getCurrentLicenseKey()
  if (!licenseKey) return []

  const userId = await getOrCreateUser(licenseKey)
  if (!userId) return []

  const result: DayRecord[] = []
  const today = new Date()

  // 计算日期范围
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }

  // 批量获取任务
  const { data: tasks } = await getSupabase()
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .in('date', dates)

  // 批量获取专注记录
  const { data: focusSessions } = await getSupabase()
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .in('date', dates)

  // 按日期组织数据
  for (const date of dates) {
    const dayTasks = (tasks || []).filter(t => t.date === date)
    const dayFocus = (focusSessions || []).filter(s => s.date === date)
    const focusMinutes = dayFocus.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

    const mappedTasks: Task[] = dayTasks.map(t => ({
      id: t.task_id,
      skill: t.skill,
      title: t.title,
      description: t.description,
      targetMinutes: t.target_minutes,
      actualMinutes: t.actual_minutes,
      status: t.status,
      date: t.date,
      createdAt: new Date(t.created_at).getTime(),
    }))

    result.push({
      date,
      tasks: mappedTasks,
      focusMinutes,
      completedCount: mappedTasks.filter(t => t.status === 'completed').length,
      totalCount: mappedTasks.length,
      isCompleted: mappedTasks.length > 0 && mappedTasks.every(t => t.status === 'completed' || t.status === 'skipped'),
    })
  }

  return result
}

// 重置所有数据
export async function resetAll(): Promise<void> {
  const licenseKey = getCurrentLicenseKey()
  if (!licenseKey) return

  const userId = await getOrCreateUser(licenseKey)
  if (!userId) return

  await Promise.all([
    getSupabase().from('daily_tasks').delete().eq('user_id', userId),
    getSupabase().from('focus_sessions').delete().eq('user_id', userId),
    getSupabase().from('streak_data').delete().eq('user_id', userId),
    getSupabase().from('user_goals').delete().eq('user_id', userId),
  ])
}
