import { GoalSettings, Task, SkillType } from './types'

// 任务模板库 - 按技能和难度分级
interface TaskTemplate {
  title: string
  description: string
  baseMinutes: number
  minScore: number // 最低目标分数才出现
  maxScore: number // 最高目标分数才出现
}

const taskTemplates: Record<SkillType, TaskTemplate[]> = {
  listening: [
    { title: '精听练习', description: '选取一篇Section3/4，逐句听写，对照原文纠正', baseMinutes: 40, minScore: 5, maxScore: 9 },
    { title: '泛听训练', description: '听BBC/TED，练习抓取主旨和关键信息', baseMinutes: 30, minScore: 5, maxScore: 9 },
    { title: '听力真题', description: '完成一套剑桥真题听力部分，限时30分钟', baseMinutes: 40, minScore: 5.5, maxScore: 9 },
    { title: '场景词汇听写', description: '听力高频场景词汇听写练习', baseMinutes: 20, minScore: 5, maxScore: 7 },
    { title: '倍速训练', description: '1.25倍速听真题，提升反应速度', baseMinutes: 25, minScore: 6.5, maxScore: 9 },
  ],
  reading: [
    { title: '阅读真题', description: '完成一篇阅读Passage，限时20分钟', baseMinutes: 30, minScore: 5, maxScore: 9 },
    { title: '长难句分析', description: '精读3-5个长难句，拆解语法结构', baseMinutes: 25, minScore: 5, maxScore: 7.5 },
    { title: '同义替换积累', description: '整理阅读中的同义替换词对', baseMinutes: 20, minScore: 5.5, maxScore: 9 },
    { title: '段落匹配练习', description: '专项练习段落信息匹配题', baseMinutes: 25, minScore: 6, maxScore: 9 },
    { title: '阅读速度训练', description: '限时略读+扫读练习，提升阅读速度', baseMinutes: 20, minScore: 6, maxScore: 9 },
  ],
  writing: [
    { title: '小作文练习', description: '完成一篇Task1（图表/流程/地图），限时20分钟', baseMinutes: 30, minScore: 5, maxScore: 9 },
    { title: '大作文练习', description: '完成一篇Task2议论文，限时40分钟', baseMinutes: 50, minScore: 5, maxScore: 9 },
    { title: '范文精读', description: '分析一篇高分范文的结构和用词', baseMinutes: 25, minScore: 5, maxScore: 7.5 },
    { title: '写作素材积累', description: '整理各话题观点和高分表达', baseMinutes: 20, minScore: 5, maxScore: 8 },
    { title: '语法纠错练习', description: '修改常见语法错误，提升准确度', baseMinutes: 20, minScore: 5, maxScore: 7 },
  ],
  speaking: [
    { title: 'Part1练习', description: '练习5个Part1话题，每个回答15-30秒', baseMinutes: 20, minScore: 5, maxScore: 9 },
    { title: 'Part2独白练习', description: '练习一个Part2话题卡，准备1分钟说2分钟', baseMinutes: 25, minScore: 5, maxScore: 9 },
    { title: 'Part3深度回答', description: '练习Part3抽象问题，提升论证能力', baseMinutes: 25, minScore: 6, maxScore: 9 },
    { title: '口语录音回听', description: '录音自己的回答，回听找问题', baseMinutes: 20, minScore: 5.5, maxScore: 9 },
    { title: '跟读模仿', description: '跟读native speaker音频，模仿语调节奏', baseMinutes: 15, minScore: 5, maxScore: 7.5 },
  ],
}

// 根据目标分数决定每个技能的任务数量
function getTaskCount(targetScore: number): number {
  if (targetScore <= 5.5) return 2
  if (targetScore <= 6.5) return 3
  if (targetScore <= 7.5) return 3
  return 4
}

// 根据目标分数决定重点技能
function getFocusSkills(goal: GoalSettings): SkillType[] {
  const { targetScores } = goal
  const skills: SkillType[] = ['listening', 'reading', 'writing', 'speaking']
  // 分数差距大的技能需要更多关注
  return skills.sort((a, b) => targetScores[a] - targetScores[b])
}

// 生成今日任务
export function generateDailyTasks(goal: GoalSettings, date: string): Task[] {
  const tasks: Task[] = []
  const focusSkills = getFocusSkills(goal)
  const totalMinutes = goal.dailyStudyHours * 60
  let usedMinutes = 0

  // 为重点技能分配更多时间
  const timeAllocation: Record<SkillType, number> = {
    listening: 0,
    reading: 0,
    writing: 0,
    speaking: 0,
  }

  // 基础分配
  const baseMinutes = Math.floor(totalMinutes / 4)
  focusSkills.forEach((skill, index) => {
    // 排名越靠前（越弱的技能）分配越多时间
    const bonus = (4 - index) * 5
    timeAllocation[skill] = baseMinutes + bonus
  })

  // 为每个技能生成任务
  for (const skill of focusSkills) {
    const availableTemplates = taskTemplates[skill].filter(
      t => goal.targetScores[skill] >= t.minScore && goal.targetScores[skill] <= t.maxScore
    )

    const count = Math.min(getTaskCount(goal.targetScores[skill]), availableTemplates.length)
    const skillMinutes = timeAllocation[skill]
    let skillUsed = 0

    // 随机选择任务，但保证每天不同
    const seed = date.split('-').reduce((sum, n) => sum + parseInt(n), 0)
    const shuffled = [...availableTemplates].sort((a, b) => {
      const hashA = (a.title.charCodeAt(0) + seed) % availableTemplates.length
      const hashB = (b.title.charCodeAt(0) + seed) % availableTemplates.length
      return hashA - hashB
    })

    for (let i = 0; i < count && i < shuffled.length; i++) {
      const template = shuffled[i]
      const minutes = Math.min(template.baseMinutes, skillMinutes - skillUsed)
      if (minutes <= 0) break

      tasks.push({
        id: `${date}-${skill}-${i}`,
        skill,
        title: template.title,
        description: template.description,
        targetMinutes: minutes,
        actualMinutes: 0,
        status: 'pending',
        date,
        createdAt: Date.now(),
      })

      skillUsed += minutes
      usedMinutes += minutes
    }
  }

  return tasks
}

// 获取技能中文名
export function getSkillName(skill: SkillType): string {
  const names: Record<SkillType, string> = {
    listening: '听力',
    reading: '阅读',
    writing: '写作',
    speaking: '口语',
  }
  return names[skill]
}

// 获取技能颜色
export function getSkillColor(skill: SkillType): string {
  const colors: Record<SkillType, string> = {
    listening: '#3B82F6', // blue
    reading: '#10B981',   // green
    writing: '#F59E0B',   // amber
    speaking: '#8B5CF6',  // purple
  }
  return colors[skill]
}

// 获取任务状态中文名
export function getStatusName(status: string): string {
  const names: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    skipped: '已跳过',
  }
  return names[status] ?? status
}
