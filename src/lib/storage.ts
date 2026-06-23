import { AppState, GoalSettings, DayRecord, Task, FocusSession, StreakData } from './types'
import { isLicenseExpired, getRemainingHours, getLicenseInfo } from './licenses'

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

// 获取当前用户的存储 key
function getStorageKey(): string {
  if (typeof window === 'undefined') return 'ielts-default'
  const userKey = localStorage.getItem('user-key')
  return userKey ? `ielts-${userKey}` : 'ielts-default'
}

// 检查是否已登录
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('user-key')
}

// 检查当前用户的试用期是否已过期
export async function isTrialExpired(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const userKey = localStorage.getItem('user-key')
  if (!userKey) return false
  return await isLicenseExpired(userKey)
}

// 获取当前用户剩余试用时间（小时）
export async function getTrialRemainingHours(): Promise<number> {
  if (typeof window === 'undefined') return 0
  const userKey = localStorage.getItem('user-key')
  if (!userKey) return 0
  return await getRemainingHours(userKey)
}

// 获取当前用户的试用状态信息
export async function getTrialStatus(): Promise<{ expired: boolean; remainingHours: number; message: string }> {
  if (typeof window === 'undefined') {
    return { expired: false, remainingHours: 0, message: '' }
  }
  const userKey = localStorage.getItem('user-key')
  if (!userKey) {
    return { expired: false, remainingHours: 0, message: '未登录' }
  }

  const expired = await isLicenseExpired(userKey)
  const remainingHours = await getRemainingHours(userKey)

  if (expired) {
    return { expired: true, remainingHours: 0, message: '试用期已结束' }
  }

  if (remainingHours < 1) {
    return { expired: false, remainingHours, message: '试用期即将结束' }
  }

  return { expired: false, remainingHours, message: `剩余${remainingHours}小时` }
}

// 获取当前用户密钥
export function getUserKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('user-key')
}

// 退出登录
export function logout(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('user-key')
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState
  try {
    const raw = localStorage.getItem(getStorageKey())
    if (!raw) return defaultState
    return { ...defaultState, ...JSON.parse(raw) }
  } catch {
    return defaultState
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getStorageKey(), JSON.stringify(state))
}

export function updateGoal(goal: GoalSettings): void {
  const state = loadState()
  state.goal = goal
  state.isOnboarded = true
  saveState(state)
}

export function saveDayRecord(record: DayRecord): void {
  const state = loadState()
  state.dayRecords[record.date] = record
  saveState(state)
}

export function saveTasks(date: string, tasks: Task[]): void {
  const state = loadState()
  const existing = state.dayRecords[date]
  state.dayRecords[date] = {
    date,
    tasks,
    focusMinutes: existing?.focusMinutes ?? 0,
    completedCount: tasks.filter(t => t.status === 'completed').length,
    totalCount: tasks.length,
    isCompleted: tasks.every(t => t.status === 'completed' || t.status === 'skipped'),
  }
  saveState(state)
}

export function updateTask(date: string, taskId: string, updates: Partial<Task>): void {
  const state = loadState()
  const record = state.dayRecords[date]
  if (!record) return
  record.tasks = record.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
  record.completedCount = record.tasks.filter(t => t.status === 'completed').length
  record.isCompleted = record.tasks.every(t => t.status === 'completed' || t.status === 'skipped')
  saveState(state)
}

export function addFocusSession(session: FocusSession): void {
  const state = loadState()
  state.focusSessions.push(session)
  const record = state.dayRecords[session.date]
  if (record) {
    record.focusMinutes = state.focusSessions
      .filter(s => s.date === session.date)
      .reduce((sum, s) => sum + s.durationMinutes, 0)
  }
  saveState(state)
}

export function updateStreak(streak: StreakData): void {
  const state = loadState()
  state.streak = streak
  saveState(state)
}

export function getDayRecord(date: string): DayRecord | null {
  const state = loadState()
  return state.dayRecords[date] ?? null
}

export function getRecentDays(days: number): DayRecord[] {
  const state = loadState()
  const result: DayRecord[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    result.push(state.dayRecords[dateStr] ?? {
      date: dateStr,
      tasks: [],
      focusMinutes: 0,
      completedCount: 0,
      totalCount: 0,
      isCompleted: false,
    })
  }
  return result
}

export function resetAll(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(getStorageKey())
}
