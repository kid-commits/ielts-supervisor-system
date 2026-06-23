// 雅思四科
export type SkillType = 'listening' | 'reading' | 'writing' | 'speaking'

// 任务状态
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

// 单个任务
export interface Task {
  id: string
  skill: SkillType
  title: string
  description: string
  targetMinutes: number
  actualMinutes: number
  status: TaskStatus
  date: string // YYYY-MM-DD
  createdAt: number
}

// 每日记录
export interface DayRecord {
  date: string
  tasks: Task[]
  focusMinutes: number
  completedCount: number
  totalCount: number
  isCompleted: boolean // 当天所有任务是否完成
}

// 目标设置
export interface GoalSettings {
  targetScore: number // 目标总分，如 6.5
  targetScores: {
    listening: number
    reading: number
    writing: number
    speaking: number
  }
  examDate: string // YYYY-MM-DD
  currentScore?: number // 当前水平预估
  dailyStudyHours: number // 每天可用学习时间（小时）
}

// 连续打卡记录
export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string
  totalStudyDays: number
}

// 专注计时记录
export interface FocusSession {
  id: string
  skill: SkillType
  startTime: number
  endTime: number | null
  durationMinutes: number
  date: string
}

// 应用完整状态
export interface AppState {
  goal: GoalSettings | null
  dayRecords: Record<string, DayRecord>
  streak: StreakData
  focusSessions: FocusSession[]
  isOnboarded: boolean
}
