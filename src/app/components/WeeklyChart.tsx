'use client'

import { DayRecord } from '@/lib/types'
import { getSkillColor } from '@/lib/taskGenerator'

interface WeeklyChartProps {
  days: DayRecord[]
}

const dayNames = ['一', '二', '三', '四', '五', '六', '日']

export default function WeeklyChart({ days }: WeeklyChartProps) {
  const maxMinutes = Math.max(...days.map(d => d.focusMinutes), 60)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-4">本周专注时长</h3>

      <div className="flex items-end gap-2 h-32">
        {days.map((day, index) => {
          const height = maxMinutes > 0 ? (day.focusMinutes / maxMinutes) * 100 : 0
          const isToday = index === days.length - 1
          const date = new Date(day.date)
          const dayName = dayNames[(date.getDay() + 6) % 7]

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-1">
                  {day.focusMinutes > 0 ? `${day.focusMinutes}m` : ''}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isToday ? 'bg-blue-500' : day.isCompleted ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
              <span className={`text-xs ${isToday ? 'text-blue-500 font-bold' : 'text-gray-400'}`}>
                {dayName}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
        <span className="text-gray-400">
          本周专注 {days.reduce((sum, d) => sum + d.focusMinutes, 0)} 分钟
        </span>
        <span className="text-gray-400">
          完成 {days.filter(d => d.isCompleted).length}/7 天
        </span>
      </div>
    </div>
  )
}
