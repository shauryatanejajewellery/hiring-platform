'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLogin = pathname === '/'

  useEffect(() => {
    if (!isLogin && typeof window !== 'undefined') {
      if (!sessionStorage.getItem('st_auth')) {
        router.push('/')
      }
    }
  }, [isLogin, router])

  // Login page — full screen, no sidebar
  if (isLogin) {
    return <>{children}</>
  }

  // Authenticated app shell
  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar />
      <main className="flex-1 ml-[220px] min-h-screen bg-brand-bg">
        {children}
      </main>
    </div>
  )
}
