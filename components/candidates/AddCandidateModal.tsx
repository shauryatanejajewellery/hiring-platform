'use client'

import { useState } from 'react'
import type { PipelineStage } from '@/types'

interface Props {
  onClose: () => void
  onCreated: () => void
  prefill?: {
    full_name?: string
    resume_text?: string
    ai_summary?: string
    ai_strengths?: string[]
    ai_concerns?: string[]
    fit_score?: number
  }
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #E8E2D6',
  borderRadius: 4,
  fontFamily: "'ManropeST', 'Manrope', sans-serif",
  fontSize: 13,
  color: '#2C2A25',
  backgroundColor: '#FFFFFF',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  display: 'block',
  fontFamily: "'ManropeST', 'Manrope', sans-serif",
  color: '#7A7570',
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  marginBottom: 6,
}

export default function AddCandidateModal({ onClose, onCreated, prefill }: Props) {
  const [form, setForm] = useState({
    full_name: prefill?.full_name || '',
    email: '',
    phone: '',
    location: '',
    current_title: '',
    current_company: '',
    linkedin_url: '',
    pipeline_stage: 'Applied' as PipelineStage,
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Full name is required'); return }
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          resume_text: prefill?.resume_text,
          ai_summary: prefill?.ai_summary,
          ai_strengths: prefill?.ai_strengths,
          ai_concerns: prefill?.ai_concerns,
          fit_score: prefill?.fit_score,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to create candidate')
      }
      onCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-lg rounded-md shadow-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D6' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E8E2D6' }}>
          <h2
            style={{
              fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
              color: '#011B03',
              fontSize: 13,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Add Candidate
          </h2>
          <button onClick={onClose} style={{ color: '#7A7570', fontSize: 20, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                style={inputStyle} placeholder="Jiya Agarwal" />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                style={inputStyle} placeholder="jiya@example.com" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input type="text" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input type="text" value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                style={inputStyle} placeholder="New Delhi" />
            </div>
            <div>
              <label style={labelStyle}>Current Title</label>
              <input type="text" value={form.current_title}
                onChange={e => setForm(p => ({ ...p, current_title: e.target.value }))}
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Current Company</label>
              <input type="text" value={form.current_company}
                onChange={e => setForm(p => ({ ...p, current_company: e.target.value }))}
                style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>LinkedIn URL</label>
            <input type="url" value={form.linkedin_url}
              onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Pipeline Stage</label>
            <select
              value={form.pipeline_stage}
              onChange={e => setForm(p => ({ ...p, pipeline_stage: e.target.value as PipelineStage }))}
              style={{ ...inputStyle, appearance: 'none' as const }}
            >
              {(['Applied', 'Interviewed', 'Offered', 'Hired', 'Rejected'] as PipelineStage[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>
          {error && <div style={{ color: '#44050A', fontSize: 12, fontFamily: "'ManropeST', 'Manrope', sans-serif" }}>{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontFamily: "'ManropeST', 'Manrope', sans-serif",
                color: '#7A7570',
                fontSize: 13,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 20px',
                backgroundColor: saving ? '#5C5753' : '#011B03',
                color: '#F6F1E8',
                fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                border: 'none',
                borderRadius: 4,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Creating…' : 'Create Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
