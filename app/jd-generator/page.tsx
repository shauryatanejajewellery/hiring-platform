'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead', 'Director', 'VP', 'C-Suite']

export default function JDGeneratorPage() {
  const [form, setForm] = useState({
    role_title: '',
    department: '',
    location: '',
    employment_type: 'Full-time',
    experience_level: 'Mid',
    responsibilities: '',
    must_have_skills: '',
    nice_to_have_skills: '',
    reporting_to: '',
    additional_context: '',
  })
  const [generating, setGenerating] = useState(false)
  const [jd, setJd] = useState('')
  const [savedId, setSavedId] = useState('')
  const [error, setError] = useState('')

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.role_title || !form.responsibilities || !form.must_have_skills) {
      setError('Role title, responsibilities, and must-have skills are required.')
      return
    }
    setError('')
    setGenerating(true)
    setJd('')
    try {
      const res = await fetch('/api/jd-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setJd(data.jd)
      setSavedId(data.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleExportPDF = async () => {
    if (!jd) return
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 50
    const pageWidth = doc.internal.pageSize.getWidth()
    const usableWidth = pageWidth - margin * 2

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(201, 169, 110)
    doc.text('SHAURYA TANEJA', margin, 60)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(138, 127, 114)
    doc.text('Hiring Platform — Job Description', margin, 78)

    doc.setDrawColor(42, 37, 32)
    doc.line(margin, 90, pageWidth - margin, 90)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(240, 235, 226)

    const lines = doc.splitTextToSize(jd.replace(/[#*`]/g, ''), usableWidth)
    let y = 110
    const lineHeight = 14

    lines.forEach((line: string) => {
      if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += lineHeight
    })

    doc.save(`${form.role_title.replace(/\s+/g, '-').toLowerCase()}-jd.pdf`)
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1
          className="text-xl text-brand-gold tracking-[0.15em] uppercase mb-1"
          style={{ fontFamily: '"Copperplate Gothic Bold", "Copperplate Gothic", Copperplate, serif' }}
        >
          JD Generator
        </h1>
        <p className="text-brand-stone text-sm">Generate a branded Shaurya Taneja job description using AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Role Title *</label>
              <input value={form.role_title} onChange={e => update('role_title', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
                placeholder="Senior Designer" />
            </div>
            <div>
              <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Department</label>
              <input value={form.department} onChange={e => update('department', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
                placeholder="Creative" />
            </div>
            <div>
              <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Location</label>
              <input value={form.location} onChange={e => update('location', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
                placeholder="New Delhi / Hybrid" />
            </div>
            <div>
              <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Employment Type</label>
              <select value={form.employment_type} onChange={e => update('employment_type', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold">
                {EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Experience Level</label>
              <select value={form.experience_level} onChange={e => update('experience_level', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold">
                {EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Reporting To</label>
              <input value={form.reporting_to} onChange={e => update('reporting_to', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
                placeholder="Creative Director" />
            </div>
          </div>

          <div>
            <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Responsibilities *</label>
            <textarea value={form.responsibilities} onChange={e => update('responsibilities', e.target.value)}
              rows={4}
              className="w-full bg-brand-surface border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold resize-none"
              placeholder="List key responsibilities, one per line…" />
          </div>

          <div>
            <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Must-Have Skills *</label>
            <textarea value={form.must_have_skills} onChange={e => update('must_have_skills', e.target.value)}
              rows={3}
              className="w-full bg-brand-surface border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold resize-none"
              placeholder="Required qualifications and skills…" />
          </div>

          <div>
            <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Nice-to-Have Skills</label>
            <textarea value={form.nice_to_have_skills} onChange={e => update('nice_to_have_skills', e.target.value)}
              rows={2}
              className="w-full bg-brand-surface border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold resize-none"
              placeholder="Bonus skills…" />
          </div>

          <div>
            <label className="block text-brand-stone text-xs mb-1.5 uppercase tracking-wider">Additional Context</label>
            <textarea value={form.additional_context} onChange={e => update('additional_context', e.target.value)}
              rows={2}
              className="w-full bg-brand-surface border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold resize-none"
              placeholder="Brand notes, team context, culture cues…" />
          </div>

          {error && <div className="text-red-400 text-xs">{error}</div>}

          <button
            type="submit"
            disabled={generating}
            className="w-full py-2.5 bg-brand-gold text-brand-bg text-sm font-medium rounded hover:bg-brand-gold-light transition-brand disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate Job Description'}
          </button>
        </form>

        {/* Preview */}
        <div>
          {jd ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-brand-stone text-xs uppercase tracking-wider">Generated JD</div>
                <div className="flex gap-2">
                  {savedId && (
                    <span className="text-brand-stone text-xs">Saved ✓</span>
                  )}
                  <button
                    onClick={handleExportPDF}
                    className="px-3 py-1.5 border border-brand-border text-brand-stone text-xs rounded hover:text-brand-text hover:border-brand-border-light transition-brand"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
              <div className="bg-brand-surface border border-brand-border rounded p-5 h-[600px] overflow-y-auto">
                <div className="prose prose-sm max-w-none text-brand-text whitespace-pre-wrap text-sm leading-relaxed">
                  {jd}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-brand-surface border border-brand-border rounded h-[600px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-brand-stone text-sm">Fill the form and generate</div>
                <div className="text-brand-stone/40 text-xs mt-1">Preview will appear here</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
