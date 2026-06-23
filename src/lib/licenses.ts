// 试用密钥配置
// 每个密钥首次使用后有72小时试用期

import { supabase, getOrCreateUser } from './supabase'

export interface LicenseKey {
  key: string
  activatedAt: number | null
  expiresAt: number | null
}

const TRIAL_HOURS = 72

export const LICENSE_KEYS: Record<string, LicenseKey> = {
  'IELTS-TRIAL-2024-A1': { key: 'IELTS-TRIAL-2024-A1', activatedAt: null, expiresAt: null },
  'IELTS-TRIAL-2024-B2': { key: 'IELTS-TRIAL-2024-B2', activatedAt: null, expiresAt: null },
  'IELTS-TRIAL-2024-C3': { key: 'IELTS-TRIAL-2024-C3', activatedAt: null, expiresAt: null },
  'IELTS-TRIAL-2024-D4': { key: 'IELTS-TRIAL-2024-D4', activatedAt: null, expiresAt: null },
  'IELTS-TRIAL-2024-E5': { key: 'IELTS-TRIAL-2024-E5', activatedAt: null, expiresAt: null },
  'IELTS-TRIAL-2024-F6': { key: 'IELTS-TRIAL-2024-F6', activatedAt: null, expiresAt: null },
  'IELTS-TRIAL-2024-G7': { key: 'IELTS-TRIAL-2024-G7', activatedAt: null, expiresAt: null },
  'IELTS-TRIAL-2024-H8': { key: 'IELTS-TRIAL-2024-H8', activatedAt: null, expiresAt: null },
  'IELTS-TRIAL-2024-J9': { key: 'IELTS-TRIAL-2024-J9', activatedAt: null, expiresAt: null },
  'IELTS-TRIAL-2024-K0': { key: 'IELTS-TRIAL-2024-K0', activatedAt: null, expiresAt: null },
}

// 验证密钥是否有效（存在于预设列表中）
export function isValidLicenseKey(key: string): boolean {
  const normalizedKey = key.toUpperCase()
  return Object.keys(LICENSE_KEYS).some(k => k.toUpperCase() === normalizedKey)
}

// 从 Supabase 获取密钥信息
export async function getLicenseInfo(key: string): Promise<LicenseKey | null> {
  const normalizedKey = key.toUpperCase()
  const presetKey = Object.keys(LICENSE_KEYS).find(k => k.toUpperCase() === normalizedKey)
  if (!presetKey) return null

  const { data, error } = await supabase
    .from('users')
    .select('activated_at, expires_at')
    .eq('license_key', presetKey)
    .single()

  if (error || !data) {
    return LICENSE_KEYS[presetKey]
  }

  return {
    key: presetKey,
    activatedAt: data.activated_at ? new Date(data.activated_at).getTime() : null,
    expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : null,
  }
}

// 激活密钥（首次使用时调用）
export async function activateLicenseKey(key: string): Promise<LicenseKey | null> {
  const normalizedKey = key.toUpperCase()
  const presetKey = Object.keys(LICENSE_KEYS).find(k => k.toUpperCase() === normalizedKey)
  if (!presetKey) return null

  // 先获取或创建用户（这是核心：确保用户记录存在）
  const userId = await getOrCreateUser(presetKey)
  if (!userId) {
    console.error('无法获取用户ID')
    return null
  }

  // 检查是否已激活
  const existing = await getLicenseInfo(key)
  if (existing && existing.activatedAt) {
    // 已激活，直接返回
    return existing
  }

  // 首次激活：更新激活时间
  const now = new Date()
  const expiresAt = new Date(now.getTime() + TRIAL_HOURS * 60 * 60 * 1000)

  const { error } = await supabase
    .from('users')
    .update({
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('激活密钥失败:', error)
    return null
  }

  return {
    key: presetKey,
    activatedAt: now.getTime(),
    expiresAt: expiresAt.getTime(),
  }
}

// 检查密钥是否已过期
export async function isLicenseExpired(key: string): Promise<boolean> {
  const info = await getLicenseInfo(key)
  if (!info || !info.expiresAt) return false
  return Date.now() > info.expiresAt
}

// 检查密钥是否可用
export async function isLicenseValid(key: string): Promise<{ valid: boolean; message?: string }> {
  if (!isValidLicenseKey(key)) {
    return { valid: false, message: '无效的密钥' }
  }

  const info = await getLicenseInfo(key)
  if (!info) {
    return { valid: false, message: '密钥信息获取失败' }
  }

  if (!info.activatedAt) {
    return { valid: true }
  }

  if (info.expiresAt && Date.now() > info.expiresAt) {
    return { valid: false, message: '试用期已结束' }
  }

  return { valid: true }
}

// 获取剩余试用时间（小时）
export async function getRemainingHours(key: string): Promise<number> {
  const info = await getLicenseInfo(key)
  if (!info || !info.expiresAt) return TRIAL_HOURS
  const remaining = info.expiresAt - Date.now()
  return Math.max(0, Math.ceil(remaining / (60 * 60 * 1000)))
}

// 获取剩余试用时间（格式化字符串）
export async function getRemainingTimeFormatted(key: string): Promise<string> {
  const hours = await getRemainingHours(key)
  if (hours <= 0) return '已过期'
  if (hours < 1) return '不到1小时'
  if (hours < 24) return `${hours}小时`
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return `${days}天${remainingHours}小时`
}
