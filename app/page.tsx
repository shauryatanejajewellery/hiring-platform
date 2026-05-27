'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'shaurya2026') {
      sessionStorage.setItem('st_auth', '1')
      router.push('/dashboard')
    } else {
      setError('Incorrect password.')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left — forest green */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#011B03',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
        }}
      >
        <Image
          src="/images/st-snake-logo.png"
          alt="Shaurya Taneja"
          width={200}
          height={200}
          style={{ filter: 'invert(1)', opacity: 0.92, marginBottom: 36 }}
          priority
        />
        <div
          style={{
            fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
            color: '#F6F1E8',
            fontSize: 18,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 10,
          }}
        >
          Shaurya Taneja
        </div>
        <div
          style={{
            fontFamily: "'ManropeST', 'Manrope', sans-serif",
            color: '#CE9F55',
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          New Delhi · New York
        </div>
      </div>

      {/* Right — ivory */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#F6F1E8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h1
            style={{
              fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
              color: '#011B03',
              fontSize: 22,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 8,
              marginTop: 0,
            }}
          >
            Hiring Platform
          </h1>
          <p
            style={{
              fontFamily: "'ManropeST', 'Manrope', sans-serif",
              color: '#7A7570',
              fontSize: 13,
              marginBottom: 36,
              marginTop: 0,
            }}
          >
            Internal access only.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: "'ManropeST', 'Manrope', sans-serif",
                  color: '#7A7570',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: '1px solid #E8E2D6',
                  borderRadius: 4,
                  fontFamily: "'ManropeST', 'Manrope', sans-serif",
                  fontSize: 14,
                  color: '#2C2A25',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  color: '#44050A',
                  fontSize: 12,
                  fontFamily: "'ManropeST', 'Manrope', sans-serif",
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: '#011B03',
                color: '#F6F1E8',
                fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
                fontSize: 12,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
