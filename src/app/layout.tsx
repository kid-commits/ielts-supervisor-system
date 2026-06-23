import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'IELTS 监督系统 - 备考进度可视化',
  description: '把抽象目标拆解成可视化进度，让每一天的努力都看得见',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-6 pb-20">
          {children}
        </main>
      </body>
    </html>
  )
}
