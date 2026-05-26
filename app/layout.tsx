import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Shaurya Taneja — Hiring Platform',
  description: 'Internal hiring platform for Shaurya Taneja fine jewellery and accessories.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <div className="flex min-h-screen bg-brand-bg">
          <Sidebar />
          <main className="flex-1 ml-[220px] min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
