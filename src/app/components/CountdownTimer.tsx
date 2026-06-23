'use client'

import { useEffect, useState } from 'react'
import { daysUntil } from '@/lib/utils'

interface CountdownTimerProps {
  examDate: string
  targetScore: number
}

export default function CountdownTimer({ examDate, targetScore }: CountdownTimerProps) {
  const [days, setDays] = useState(0)

  useEffect(() => {
    setDays(daysUntil(examDate))
    const timer = setInterval(() => setDays(daysUntil(examDate)), 1000 * 60 * 60)
    return () => clearInterval(timer)
  }, [examDate])

  const isUrgent = days <= 30
  const isWarning = days <= 60

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-blue-100 text-sm">目标分数</p>
          <p className="text-4xl font-bold">{targetScore}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-100 text-sm">考试日期</p>
          <p className="text-lg font-medium">{examDate}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/20">
        <p className="text-blue-100 text-sm mb-1">距离考试</p>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-5xl font-bold ${
              isUrgent ? 'text-red-300' : isWarning ? 'text-yellow-300' : 'text-white'
            }`}
          >
            {days > 0 ? days : 0}
          </span>
          <span className="text-xl text-blue-100">天</span>
        </div>
        {days <= 0 && (
          <p className="text-red-300 text-sm mt-2">考试已结束或今天考试</p>
        )}
        {days > 0 && days <= 7 && (
          <p className="text-red-300 text-sm mt-2">⚡ 最后冲刺！加油！</p>
        )}
        {days > 7 && days <= 30 && (
          <p className="text-yellow-300 text-sm mt-2">🔥 进入倒计时，保持节奏</p>
        )}
      </div>
    </div>
  )
}
