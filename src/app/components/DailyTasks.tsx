'use client'

import { useState } from 'react'
import { Task, SkillType } from '@/lib/types'
import { getSkillName, getSkillColor, getStatusName } from '@/lib/taskGenerator'
import { formatMinutes } from '@/lib/utils'

interface DailyTasksProps {
  tasks: Task[]
  onToggle: (taskId: string, status: 'completed' | 'pending') => void
  onStartFocus: (task: Task) => void
}

const skillIcons: Record<SkillType, string> = {
  listening: '🎧',
  reading: '📖',
  writing: '✍️',
  speaking: '🗣️',
}

export default function DailyTasks({ tasks, onToggle, onStartFocus }: DailyTasksProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const grouped = tasks.reduce<Record<SkillType, Task[]>>((acc, task) => {
    if (!acc[task.skill]) acc[task.skill] = []
    acc[task.skill].push(task)
    return acc
  }, {} as Record<SkillType, Task[]>)

  const skills: SkillType[] = ['listening', 'reading', 'writing', 'speaking']

  return (
    <div className="space-y-4">
      {skills.map(skill => {
        const skillTasks = grouped[skill]
        if (!skillTasks?.length) return null
        const completed = skillTasks.filter(t => t.status === 'completed').length
        const color = getSkillColor(skill)

        return (
          <div key={skill} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderLeft: `4px solid ${color}` }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{skillIcons[skill]}</span>
                <span className="font-medium text-gray-800">{getSkillName(skill)}</span>
              </div>
              <span className="text-sm text-gray-500">
                {completed}/{skillTasks.length} 完成
              </span>
            </div>

            <div className="divide-y divide-gray-50">
              {skillTasks.map(task => (
                <div
                  key={task.id}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggle(task.id, task.status === 'completed' ? 'pending' : 'completed')
                      }}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        task.status === 'completed'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {task.status === 'completed' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${
                        task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'
                      }`}>
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {formatMinutes(task.targetMinutes)}
                        {task.actualMinutes > 0 && ` · 实际 ${formatMinutes(task.actualMinutes)}`}
                      </p>
                    </div>

                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {getStatusName(task.status)}
                    </span>
                  </div>

                  {expandedId === task.id && (
                    <div className="mt-3 ml-9 text-sm text-gray-600">
                      <p>{task.description}</p>
                      {task.status !== 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onStartFocus(task)
                          }}
                          className="mt-2 px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          🎯 开始专注
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
