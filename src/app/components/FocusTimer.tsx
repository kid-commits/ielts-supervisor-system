'use client'

import { useState, useEffect, useRef } from 'react'
import { Task, FocusSession } from '@/lib/types'
import { getSkillName, getSkillColor } from '@/lib/taskGenerator'
import { formatMinutes, generateId, getToday } from '@/lib/utils'

interface FocusTimerProps {
  task: Task
  onComplete: (session: FocusSession) => void
  onClose: () => void
}

export default function FocusTimer({ task, onComplete, onClose }: FocusTimerProps) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const handlePause = () => setIsRunning(!isRunning)

  const handleComplete = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const session: FocusSession = {
      id: generateId(),
      skill: task.skill,
      startTime: startTimeRef.current,
      endTime: Date.now(),
      durationMinutes: Math.ceil(seconds / 60),
      date: getToday(),
    }
    onComplete(session)
  }

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const targetSeconds = task.targetMinutes * 60
  const progress = Math.min((seconds / targetSeconds) * 100, 100)
  const color = getSkillColor(task.skill)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">{getSkillName(task.skill)}</p>
            <h3 className="font-medium text-gray-800">{task.title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center py-8">
          <div className="text-6xl font-mono font-bold" style={{ color }}>
            {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          <p className="text-sm text-gray-400 mt-2">
            目标 {task.targetMinutes} 分钟 · 已完成 {Math.round(progress)}%
          </p>

          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress}%`, backgroundColor: color }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePause}
            className="flex-1 py-3 rounded-xl border-2 font-medium transition-colors"
            style={{ borderColor: color, color }}
          >
            {isRunning ? '暂停' : '继续'}
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 py-3 rounded-xl text-white font-medium transition-colors"
            style={{ backgroundColor: color }}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
