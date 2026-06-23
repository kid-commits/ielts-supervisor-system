'use client'

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
  totalStudyDays: number
}

export default function StreakCounter({
  currentStreak,
  longestStreak,
  totalStudyDays,
}: StreakCounterProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-3">学习统计</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-3xl mb-1">🔥</div>
          <p className="text-2xl font-bold text-orange-500">{currentStreak}</p>
          <p className="text-xs text-gray-400">连续天数</p>
        </div>
        <div>
          <div className="text-3xl mb-1">🏆</div>
          <p className="text-2xl font-bold text-yellow-500">{longestStreak}</p>
          <p className="text-xs text-gray-400">最长连续</p>
        </div>
        <div>
          <div className="text-3xl mb-1">📚</div>
          <p className="text-2xl font-bold text-blue-500">{totalStudyDays}</p>
          <p className="text-xs text-gray-400">总学习天数</p>
        </div>
      </div>
    </div>
  )
}
