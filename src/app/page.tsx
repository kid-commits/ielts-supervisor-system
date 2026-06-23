'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Task, FocusSession, DayRecord } from '@/lib/types'
import { isLoggedIn, getTrialStatus } from '@/lib/storage'
import { loadState, saveTasks, updateTask, addFocusSession, updateStreak, getDayRecord, getRecentDays } from '@/lib/supabase-storage'
import { generateDailyTasks } from '@/lib/taskGenerator'
import { getToday, daysUntil, formatMinutes } from '@/lib/utils'
import CountdownTimer from './components/CountdownTimer'
import ProgressRing from './components/ProgressRing'
import DailyTasks from './components/DailyTasks'
import StreakCounter from './components/StreakCounter'
import FocusTimer from './components/FocusTimer'
import WeeklyChart from './components/WeeklyChart'

export default function Dashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [focusTask, setFocusTask] = useState<Task | null>(null)
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0, totalStudyDays: 0, lastCompletedDate: '' })
  const [weekDays, setWeekDays] = useState<DayRecord[]>([])
  const [focusMinutes, setFocusMinutes] = useState(0)
  const [goal, setGoal] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [trialStatus, setTrialStatus] = useState<{ expired: boolean; remainingHours: number; message: string } | null>(null)

  const today = getToday()

  const loadData = useCallback(async () => {
    const state = await loadState()

    if (!state.isOnboarded || !state.goal) {
      router.push('/settings')
      return
    }

    setGoal(state.goal)

    // 生成或加载今日任务
    let todayRecord = state.dayRecords[today]
    if (!todayRecord || todayRecord.tasks.length === 0) {
      const newTasks = generateDailyTasks(state.goal, today)
      await saveTasks(today, newTasks)
      todayRecord = {
        date: today,
        tasks: newTasks,
        focusMinutes: 0,
        completedCount: 0,
        totalCount: newTasks.length,
        isCompleted: false,
      }
    }
    setTasks(todayRecord.tasks)
    setFocusMinutes(todayRecord.focusMinutes)

    // 更新连续打卡
    const streakData = state.streak
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (todayRecord.isCompleted) {
      if (streakData.lastCompletedDate === yesterdayStr) {
        streakData.currentStreak += 1
      } else if (streakData.lastCompletedDate !== today) {
        streakData.currentStreak = 1
      }
      streakData.lastCompletedDate = today
      streakData.totalStudyDays += 1
      if (streakData.currentStreak > streakData.longestStreak) {
        streakData.longestStreak = streakData.currentStreak
      }
      await updateStreak(streakData)
    }
    setStreak(streakData)

    // 加载本周数据
    const weekData = await getRecentDays(7)
    setWeekDays(weekData)
  }, [router, today])

  useEffect(() => {
    setMounted(true)
    // 检查是否已登录
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }

    // 检查试用期状态
    const checkTrialStatus = async () => {
      const status = await getTrialStatus()
      setTrialStatus(status)

      // 如果试用期已过期，跳转到登录页
      if (status.expired) {
        router.push('/login')
        return
      }

      loadData()
    }

    checkTrialStatus()
  }, [loadData, router])

  const handleToggleTask = async (taskId: string, status: 'completed' | 'pending') => {
    await updateTask(today, taskId, { status })
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, status } : t
    )
    setTasks(updatedTasks)

    // 检查是否全部完成
    const allDone = updatedTasks.every(t => t.status === 'completed' || t.status === 'skipped')
    if (allDone) {
      const state = await loadState()
      const streakData = state.streak
      streakData.currentStreak += 1
      streakData.totalStudyDays += 1
      streakData.lastCompletedDate = today
      if (streakData.currentStreak > streakData.longestStreak) {
        streakData.longestStreak = streakData.currentStreak
      }
      await updateStreak(streakData)
      setStreak(streakData)
    }
  }

  const handleStartFocus = (task: Task) => {
    setFocusTask(task)
  }

  const handleCompleteFocus = async (session: FocusSession) => {
    await addFocusSession(session)
    if (focusTask) {
      await updateTask(today, focusTask.id, {
        actualMinutes: focusTask.actualMinutes + session.durationMinutes,
        status: 'completed',
      })
      setTasks(prev =>
        prev.map(t =>
          t.id === focusTask.id
            ? { ...t, actualMinutes: t.actualMinutes + session.durationMinutes, status: 'completed' }
            : t
        )
      )
    }
    setFocusTask(null)
    setFocusMinutes(prev => prev + session.durationMinutes)
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!goal) return null

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 试用期状态提示 */}
      {trialStatus && !trialStatus.expired && (
        <div className={`rounded-xl p-3 text-center text-sm ${
          trialStatus.remainingHours < 24
            ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          ⏰ {trialStatus.message}
        </div>
      )}

      {/* 倒计时卡片 */}
      <CountdownTimer examDate={goal.examDate} targetScore={goal.targetScore} />

      {/* 今日进度 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">今日进度</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {completedCount}/{totalCount} 任务
            </p>
            <p className="text-sm text-gray-400 mt-1">
              专注 {formatMinutes(focusMinutes)}
            </p>
          </div>
          <ProgressRing progress={progress} size={80} strokeWidth={6} color="#3B82F6" />
        </div>
      </div>

      {/* 今日任务 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">📋 今日任务</h3>
        <DailyTasks
          tasks={tasks}
          onToggle={handleToggleTask}
          onStartFocus={handleStartFocus}
        />
      </div>

      {/* 学习统计 */}
      <StreakCounter
        currentStreak={streak.currentStreak}
        longestStreak={streak.longestStreak}
        totalStudyDays={streak.totalStudyDays}
      />

      {/* 本周图表 */}
      <WeeklyChart days={weekDays} />

      {/* 全部完成提示 */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-medium text-green-800">今日任务全部完成！</p>
          <p className="text-sm text-green-600 mt-1">继续保持，你离目标又近了一步</p>
        </div>
      )}

      {/* 专注计时弹窗 */}
      {focusTask && (
        <FocusTimer
          task={focusTask}
          onComplete={handleCompleteFocus}
          onClose={() => setFocusTask(null)}
        />
      )}
    </div>
  )
}
