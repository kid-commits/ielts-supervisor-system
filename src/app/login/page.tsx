'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isLicenseValid, activateLicenseKey, getRemainingTimeFormatted } from '@/lib/licenses'

export default function LoginPage() {
  const router = useRouter()
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async () => {
    const trimmed = key.trim()
    if (!trimmed) {
      setError('请输入密钥')
      return
    }

    // 验证密钥
    const validation = await isLicenseValid(trimmed)
    if (!validation.valid) {
      setError(validation.message || '密钥无效')
      return
    }

    // 激活密钥（如果是首次使用）
    const licenseInfo = await activateLicenseKey(trimmed)
    if (!licenseInfo) {
      setError('密钥激活失败')
      return
    }

    // 显示剩余时间
    const remaining = await getRemainingTimeFormatted(trimmed)
    setSuccess(`密钥验证成功！剩余试用时间：${remaining}`)

    // 存储用户密钥
    localStorage.setItem('user-key', trimmed)

    // 延迟跳转，让用户看到提示
    setTimeout(() => {
      router.push('/')
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-gray-800">IELTS 监督系统</h1>
          <p className="text-sm text-gray-500 mt-2">输入密钥进入你的专属备考空间</p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">访问密钥</label>
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value)
                  setError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="输入你的专属密钥"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              {success && (
                <p className="text-green-500 text-sm mt-2">{success}</p>
              )}
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:scale-[0.98] transition-all"
            >
              进入系统
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              💡 每个密钥提供240小时（10天）试用期，首次使用开始计时
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
