'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/candidates', label: 'Candidates' },
  { href: '/jd-generator', label: 'JD Generator' },
  { href: '/resume-analyser', label: 'Resume Analyser' },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[220px] flex flex-col border-r border-brand-border bg-brand-surface z-50"
      style={{ borderRight: '1px solid #2a2520' }}
    >
      {/* Brand mark */}
      <div className="px-6 pt-8 pb-6 border-b border-brand-border">
        <div
          className="text-brand-gold text-xs tracking-[0.2em] uppercase leading-tight"
          style={{ fontFamily: '"Copperplate Gothic Bold", "Copperplate Gothic", Copperplate, serif' }}
        >
          Shaurya Taneja
        </div>
        <div className="text-brand-stone text-[10px] tracking-widest uppercase mt-1">
          Hiring Platform
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-0.5">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-3 py-2.5 rounded text-sm transition-brand ${
              isActive(href)
                ? 'text-brand-gold bg-brand-surface-2 font-medium'
                : 'text-brand-stone hover:text-brand-text hover:bg-brand-surface-2'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-brand-border">
        <div className="text-brand-stone text-[10px] tracking-widest uppercase">
          New Delhi · New York
        </div>
      </div>
    </aside>
  )
}
