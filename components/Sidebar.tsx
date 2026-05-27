'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/candidates', label: 'Candidates' },
  { href: '/jd-generator', label: 'JD Generator' },
  { href: '/resume-analyser', label: 'Resume Analyser' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => pathname.startsWith(href)

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('st_auth')
      router.push('/')
    }
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[220px] flex flex-col z-50"
      style={{ backgroundColor: '#011B03' }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        <Image
          src="/images/st-snake-logo.png"
          alt="Shaurya Taneja"
          width={80}
          height={80}
          style={{ filter: 'invert(1)', opacity: 0.9 }}
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center px-3 py-2.5 rounded text-sm transition-brand"
            style={{
              fontFamily: "'ManropeST', 'Manrope', sans-serif",
              color: isActive(href) ? '#CE9F55' : 'rgba(246,241,232,0.75)',
              backgroundColor: isActive(href) ? 'rgba(206,159,85,0.12)' : 'transparent',
              fontWeight: isActive(href) ? 500 : 400,
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-5" style={{ borderTop: '1px solid rgba(246,241,232,0.1)' }}>
        <div
          style={{
            fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
            color: 'rgba(246,241,232,0.4)',
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          New Delhi · New York
        </div>
        <button
          onClick={handleLogout}
          style={{
            fontFamily: "'ManropeST', 'Manrope', sans-serif",
            color: 'rgba(246,241,232,0.3)',
            fontSize: 11,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
