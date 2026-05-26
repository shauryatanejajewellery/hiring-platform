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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface border border-brand-border rounded w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-brand-text text-sm font-semibold">Add Candidate</h2>
          <button onClick={onClose} className="text-brand-stone hover:text-brand-text text-lg leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Full Name *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                className="w-full bg-brand-surface-2 border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
                placeholder="Jiya Agarwal"
              />
            </div>
            <div>
              <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-brand-surface-2 border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
                placeholder="jiya@example.com"
              />
            </div>
            <div>
              <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full bg-brand-surface-2 border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="w-full bg-brand-surface-2 border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
                placeholder="New Delhi"
              />
            </div>
            <div>
              <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Current Title</label>
              <input
                type="text"
                value={form.current_title}
                onChange={e => setForm(p => ({ ...p, current_title: e.target.value }))}
                className="w-full bg-brand-surface-2 border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Current Company</label>
              <input
                type="text"
                value={form.current_company}
                onChange={e => setForm(p => ({ ...p, current_company: e.target.value }))}
                className="w-full bg-brand-surface-2 border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>
          <div>
            <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">LinkedIn URL</label>
            <input
              type="url"
              value={form.linkedin_url}
              onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))}
              className="w-full bg-brand-surface-2 border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Pipeline Stage</label>
            <select
              value={form.pipeline_stage}
              onChange={e => setForm(p => ({ ...p, pipeline_stage: e.target.value as PipelineStage }))}
              className="w-full bg-brand-surface-2 border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
            >
              {(['Applied', 'Interviewed', 'Offered', 'Hired', 'Rejected'] as PipelineStage[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full bg-brand-surface-2 border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold resize-none"
            />
          </div>
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-brand-stone text-sm hover:text-brand-text transition-brand"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-gold text-brand-bg text-sm font-medium rounded hover:bg-brand-gold-light transition-brand disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
