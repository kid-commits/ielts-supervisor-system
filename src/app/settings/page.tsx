'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GoalSettings, SkillType } from '@/lib/types'
import { isLoggedIn } from '@/lib/storage'
import { loadState, updateGoal, resetAll } from '@/lib/supabase-storage'
import { getSkillName } from '@/lib/taskGenerator'

const defaultGoal: GoalSettings = {
  targetScore: 6.5,
  targetScores: {
    listening: 6.5,
    reading: 6.5,
    writing: 6.0,
    speaking: 6.0,
  },
  examDate: '',
  dailyStudyHours: 3,
}

export default function SettingsPage() {
  const router = useRouter()
  const [goal, setGoal] = useState<GoalSettings>(defaultGoal)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login')
      return
    }
    const loadData = async () => {
      const state = await loadState()
      if (state.goal) {
        setGoal(state.goal)
      }
    }
    loadData()
  }, [])

  const handleSave = async () => {
    if (!goal.examDate) {
      alert('请设置考试日期')
      return
    }
    await updateGoal(goal)
    setSaved(true)
    setTimeout(() => {
      router.push('/')
    }, 1000)
  }

  const handleReset = async () => {
    if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
      await resetAll()
      router.push('/')
    }
  }

  const skillLabels: { key: SkillType; emoji: string }[] = [
    { key: 'listening', emoji: '🎧' },
    { key: 'reading', emoji: '📖' },
    { key: 'writing', emoji: '✍️' },
    { key: 'speaking', emoji: '🗣️' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">目标设置</h1>
        <p className="text-sm text-gray-500 mt-1">设定你的雅思目标，系统会自动生成每日任务</p>
      </div>

      {/* 目标总分 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">目标总分</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="4"
            max="9"
            step="0.5"
            value={goal.targetScore}
            onChange={(e) => setGoal({ ...goal, targetScore: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-3xl font-bold text-blue-500 min-w-[60px] text-center">
            {goal.targetScore}
          </span>
        </div>
      </div>

      {/* 各科目标 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">各科目标分数</label>
        <div className="space-y-3">
          {skillLabels.map(({ key, emoji }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-lg">{emoji}</span>
              <span className="text-sm text-gray-600 w-12">{getSkillName(key)}</span>
              <input
                type="range"
                min="4"
                max="9"
                step="0.5"
                value={goal.targetScores[key]}
                onChange={(e) =>
                  setGoal({
                    ...goal,
                    targetScores: { ...goal.targetScores, [key]: parseFloat(e.target.value) },
                  })
                }
                className="flex-1"
              />
              <span className="text-lg font-bold text-gray-800 w-10 text-right">
                {goal.targetScores[key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 考试日期 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">考试日期</label>
        <input
          type="date"
          value={goal.examDate}
          onChange={(e) => setGoal({ ...goal, examDate: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 每日学习时长 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">每日可用学习时间</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="8"
            step="0.5"
            value={goal.dailyStudyHours}
            onChange={(e) => setGoal({ ...goal, dailyStudyHours: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xl font-bold text-blue-500 min-w-[50px] text-center">
            {goal.dailyStudyHours}h
          </span>
        </div>
      </div>

      {/* 保存按钮 */}
      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-xl text-white font-medium transition-all ${
          saved ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600 active:scale-98'
        }`}
      >
        {saved ? '✓ 已保存' : '保存设置'}
      </button>

      {/* 重置按钮 */}
      <button
        onClick={handleReset}
        className="w-full py-3 rounded-xl text-red-500 font-medium border-2 border-red-200 hover:bg-red-50 transition-colors"
      >
        重置所有数据
      </button>
    </div>
  )
}
