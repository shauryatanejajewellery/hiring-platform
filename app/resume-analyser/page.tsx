'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { JobDescription, ResumeAnalysis } from '@/types'
import AddCandidateModal from '@/components/candidates/AddCandidateModal'

const inputClass = "w-full bg-white border border-brand-border rounded px-3 py-2 text-brand-text text-sm focus:outline-none focus:border-brand-gold"
const labelClass = "block text-brand-stone text-[11px] mb-1.5 uppercase tracking-wider"

export default function ResumeAnalyserPage() {
  const [resumeText, setResumeText] = useState('')
  const [jdSource, setJdSource] = useState<'saved' | 'paste'>('paste')
  const [jdText, setJdText] = useState('')
  const [selectedJdId, setSelectedJdId] = useState('')
  const [savedJds, setSavedJds] = useState<JobDescription[]>([])
  const [analysing, setAnalysing] = useState(false)
  const [result, setResult] = useState<ResumeAnalysis | null>(null)
  const [error, setError] = useState('')
  const [showAddCandidate, setShowAddCandidate] = useState(false)

  useEffect(() => {
    supabase.from('job_descriptions').select('*').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setSavedJds(data as JobDescription[]) })
  }, [])

  const getJdText = () => {
    if (jdSource === 'saved') {
      return savedJds.find(j => j.id === selectedJdId)?.generated_jd || ''
    }
    return jdText
  }

  const handleAnalyse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resumeText.trim()) { setError('Resume text is required'); return }
    setError('')
    setAnalysing(true)
    setResult(null)
    try {
      const res = await fetch('/api/resume-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText, jd_text: getJdText() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalysing(false)
    }
  }

  const scoreColor = (score: number) =>
    score >= 75 ? '#CE9F55' : score >= 50 ? '#5C5753' : '#7A7570'

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1
          className="text-brand-forest text-2xl tracking-[0.15em] uppercase mb-1"
          style={{ fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif" }}
        >
          Resume Analyser
        </h1>
        <p className="text-brand-stone text-sm">Score and summarise a candidate&apos;s resume against a job description.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input form */}
        <form onSubmit={handleAnalyse} className="space-y-5">
          <div>
            <label className={labelClass}>Resume Text *</label>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              rows={10}
              className={`${inputClass} resize-none font-mono`}
              placeholder="Paste resume text here…"
            />
          </div>

          <div>
            <label className={labelClass}>Job Description</label>
            <div className="flex gap-2 mb-3">
              {(['paste', 'saved'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setJdSource(s)}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-brand"
                  style={{
                    fontFamily: "'ManropeST', 'Manrope', sans-serif",
                    backgroundColor: jdSource === s ? '#CE9F55' : '#FFFFFF',
                    color: jdSource === s ? '#F6F1E8' : '#7A7570',
                    border: jdSource === s ? '1px solid #CE9F55' : '1px solid #E8E2D6',
                  }}
                >
                  {s === 'paste' ? 'Paste JD' : 'Saved JDs'}
                </button>
              ))}
            </div>

            {jdSource === 'paste' ? (
              <textarea
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                rows={5}
                className={`${inputClass} resize-none`}
                placeholder="Paste job description (optional — without a JD, we evaluate general luxury brand fit)…"
              />
            ) : (
              <select
                value={selectedJdId}
                onChange={e => setSelectedJdId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a saved JD…</option>
                {savedJds.map(j => (
                  <option key={j.id} value={j.id}>{j.role_title} — {j.department || 'No dept'}</option>
                ))}
              </select>
            )}
          </div>

          {error && <div className="text-brand-burgundy text-xs">{error}</div>}

          <button
            type="submit"
            disabled={analysing}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: analysing ? '#5C5753' : '#011B03',
              color: '#F6F1E8',
              fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: 4,
              cursor: analysing ? 'not-allowed' : 'pointer',
            }}
          >
            {analysing ? 'Analysing…' : 'Analyse Resume'}
          </button>
        </form>

        {/* Results */}
        <div>
          {result ? (
            <div className="space-y-5">
              {/* Fit score */}
              <div className="bg-white border border-brand-border rounded-md p-5 text-center shadow-sm">
                <div className="text-brand-stone text-[11px] uppercase tracking-widest mb-2">Fit Score</div>
                <div
                  className="text-5xl font-light tabular-nums"
                  style={{ color: scoreColor(result.fitScore) }}
                >
                  {result.fitScore}
                </div>
                <div className="text-brand-stone text-xs mt-1">/100</div>
              </div>

              {/* Summary */}
              <div>
                <div className="text-brand-stone text-[11px] uppercase tracking-wider mb-2">Summary</div>
                <div className="bg-white border border-brand-border rounded-md p-4 text-brand-text text-sm leading-relaxed shadow-sm">
                  {result.summary}
                </div>
              </div>

              {/* Strengths & Concerns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-brand-stone text-[11px] uppercase tracking-wider mb-2">Strengths</div>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-brand-gold mt-0.5 flex-shrink-0 font-semibold">+</span>
                        <span className="text-brand-text">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-brand-stone text-[11px] uppercase tracking-wider mb-2">Concerns</div>
                  <ul className="space-y-2">
                    {result.concerns.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-brand-stone mt-0.5 flex-shrink-0">−</span>
                        <span className="text-brand-stone">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Save as candidate */}
              <button
                onClick={() => setShowAddCandidate(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #CE9F55',
                  borderRadius: 4,
                  backgroundColor: 'transparent',
                  color: '#CE9F55',
                  fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Save as Candidate
              </button>
            </div>
          ) : (
            <div className="bg-white border border-brand-border rounded-md min-h-[400px] flex items-center justify-center shadow-sm">
              <div className="text-center">
                <div className="text-brand-stone text-sm">Analysis results will appear here</div>
                <div className="text-brand-stone/40 text-xs mt-1">Powered by Claude Sonnet</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddCandidate && result && (
        <AddCandidateModal
          prefill={{
            resume_text: resumeText,
            ai_summary: result.summary,
            ai_strengths: result.strengths,
            ai_concerns: result.concerns,
            fit_score: result.fitScore,
          }}
          onClose={() => setShowAddCandidate(false)}
          onCreated={() => { setShowAddCandidate(false) }}
        />
      )}
    </div>
  )
}
