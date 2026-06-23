import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 核心函数：根据 license_key 获取或创建用户
 * 这是用户身份的唯一来源，确保同一个 license_key 永远对应同一个用户 ID
 */
export async function getOrCreateUser(licenseKey: string): Promise<string | null> {
  // 统一转大写，避免大小写不一致导致的问题
  const normalizedKey = licenseKey.toUpperCase()

  // 1. 先查询是否已存在
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('license_key', normalizedKey)
    .single()

  if (existing) {
    return existing.id
  }

  // 2. 不存在则创建
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ license_key: normalizedKey })
    .select('id')
    .single()

  if (error || !newUser) {
    console.error('创建用户失败:', error)
    return null
  }

  return newUser.id
}
