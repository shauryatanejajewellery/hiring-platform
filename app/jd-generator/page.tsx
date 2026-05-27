'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead', 'Director', 'VP', 'C-Suite']

const inputClass = "w-full bg-white border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
const labelClass = "block text-brand-stone text-[11px] mb-1.5 uppercase tracking-wider"

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
    doc.setTextColor(1, 27, 3)
    doc.text('SHAURYA TANEJA', margin, 60)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(122, 117, 112)
    doc.text('Hiring Platform — Job Description', margin, 78)

    doc.setDrawColor(206, 159, 85)
    doc.line(margin, 90, pageWidth - margin, 90)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(44, 42, 37)

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
          className="text-brand-forest text-2xl tracking-[0.15em] uppercase mb-1"
          style={{ fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif" }}
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
              <label className={labelClass}>Role Title *</label>
              <input value={form.role_title} onChange={e => update('role_title', e.target.value)}
                className={inputClass} placeholder="Senior Designer" />
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <input value={form.department} onChange={e => update('department', e.target.value)}
                className={inputClass} placeholder="Creative" />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input value={form.location} onChange={e => update('location', e.target.value)}
                className={inputClass} placeholder="New Delhi / Hybrid" />
            </div>
            <div>
              <label className={labelClass}>Employment Type</label>
              <select value={form.employment_type} onChange={e => update('employment_type', e.target.value)}
                className={inputClass}>
                {EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Experience Level</label>
              <select value={form.experience_level} onChange={e => update('experience_level', e.target.value)}
                className={inputClass}>
                {EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Reporting To</label>
              <input value={form.reporting_to} onChange={e => update('reporting_to', e.target.value)}
                className={inputClass} placeholder="Creative Director" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Responsibilities *</label>
            <textarea value={form.responsibilities} onChange={e => update('responsibilities', e.target.value)}
              rows={4} className={`${inputClass} resize-none`}
              placeholder="List key responsibilities, one per line…" />
          </div>

          <div>
            <label className={labelClass}>Must-Have Skills *</label>
            <textarea value={form.must_have_skills} onChange={e => update('must_have_skills', e.target.value)}
              rows={3} className={`${inputClass} resize-none`}
              placeholder="Required qualifications and skills…" />
          </div>

          <div>
            <label className={labelClass}>Nice-to-Have Skills</label>
            <textarea value={form.nice_to_have_skills} onChange={e => update('nice_to_have_skills', e.target.value)}
              rows={2} className={`${inputClass} resize-none`}
              placeholder="Bonus skills…" />
          </div>

          <div>
            <label className={labelClass}>Additional Context</label>
            <textarea value={form.additional_context} onChange={e => update('additional_context', e.target.value)}
              rows={2} className={`${inputClass} resize-none`}
              placeholder="Brand notes, team context, culture cues…" />
          </div>

          {error && <div className="text-brand-burgundy text-xs">{error}</div>}

          <button
            type="submit"
            disabled={generating}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: generating ? '#5C5753' : '#011B03',
              color: '#F6F1E8',
              fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: 4,
              cursor: generating ? 'not-allowed' : 'pointer',
            }}
          >
            {generating ? 'Generating…' : 'Generate Job Description'}
          </button>
        </form>

        {/* Preview */}
        <div>
          {jd ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-brand-stone text-[11px] uppercase tracking-wider">Generated JD</div>
                <div className="flex gap-2 items-center">
                  {savedId && (
                    <span className="text-brand-gold text-xs">Saved ✓</span>
                  )}
                  <button
                    onClick={handleExportPDF}
                    style={{
                      padding: '6px 14px',
                      border: '1px solid #E8E2D6',
                      borderRadius: 4,
                      backgroundColor: '#FFFFFF',
                      color: '#7A7570',
                      fontFamily: "'ManropeST', 'Manrope', sans-serif",
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Export PDF
                  </button>
                </div>
              </div>
              <div className="bg-white border border-brand-border rounded-md p-5 h-[600px] overflow-y-auto shadow-sm">
                <div className="prose prose-sm max-w-none text-brand-text whitespace-pre-wrap text-sm leading-relaxed">
                  {jd}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-brand-border rounded-md h-[600px] flex items-center justify-center shadow-sm">
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
