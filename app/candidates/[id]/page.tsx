'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type {
  Candidate, InterviewRound, ScorecardCriterion, ScorecardScore,
  CandidateActivity, PipelineStage, PostInterviewAnalysis
} from '@/types'
import StageBadge from '@/components/StageBadge'

type Tab = 'profile' | 'scorecard' | 'analysis' | 'activity'
const STAGES: PipelineStage[] = ['Applied', 'Interviewed', 'Offered', 'Hired', 'Rejected']

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: '#011B03' }}
    >
      <span
        style={{
          color: '#CE9F55',
          fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        {initials}
      </span>
    </div>
  )
}

export default function CandidateDetailPage() {
  const { id } = useParams() as { id: string }
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [rounds, setRounds] = useState<InterviewRound[]>([])
  const [criteria, setCriteria] = useState<ScorecardCriterion[]>([])
  const [scores, setScores] = useState<Record<string, ScorecardScore[]>>({})
  const [activity, setActivity] = useState<CandidateActivity[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [selectedRoundId, setSelectedRoundId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [savingStage, setSavingStage] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<Record<string, PostInterviewAnalysis>>({})
  const [scoreNotes, setScoreNotes] = useState<Record<string, string>>({})
  const [fitExpanded, setFitExpanded] = useState(false)

  const load = useCallback(async () => {
    const [
      { data: c },
      { data: r },
      { data: cr },
      { data: act }
    ] = await Promise.all([
      supabase.from('candidates').select('*, job_descriptions(role_title)').eq('id', id).single(),
      supabase.from('interview_rounds').select('*').eq('candidate_id', id).order('round_number'),
      supabase.from('scorecard_criteria').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('candidate_activity').select('*').eq('candidate_id', id).order('created_at', { ascending: false }),
    ])
    if (c) setCandidate(c as Candidate)
    if (r) {
      setRounds(r as InterviewRound[])
      if (r.length > 0) setSelectedRoundId(r[0].id)
    }
    if (cr) setCriteria(cr as ScorecardCriterion[])
    if (act) setActivity(act as CandidateActivity[])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (rounds.length === 0) return
    rounds.forEach(async (round) => {
      const { data } = await supabase
        .from('scorecard_scores')
        .select('*, scorecard_criteria(*)')
        .eq('round_id', round.id)
      if (data) {
        setScores(prev => ({ ...prev, [round.id]: data as ScorecardScore[] }))
      }
    })
  }, [rounds])

  const handleStageChange = async (stage: PipelineStage) => {
    if (!candidate || savingStage) return
    const prev = candidate.pipeline_stage
    setCandidate(c => c ? { ...c, pipeline_stage: stage } : c)
    setSavingStage(true)
    await supabase.from('candidates').update({ pipeline_stage: stage }).eq('id', id)
    await supabase.from('candidate_activity').insert({
      candidate_id: id,
      activity_type: 'stage_change',
      description: `Stage changed from ${prev} to ${stage}.`,
      metadata: { from: prev, to: stage },
    })
    setSavingStage(false)
    load()
  }

  const handleScoreSet = async (criterionId: string, score: number) => {
    if (!selectedRoundId) return
    const existing = scores[selectedRoundId]?.find(s => s.criterion_id === criterionId)
    if (existing) {
      await supabase.from('scorecard_scores').update({ score }).eq('id', existing.id)
    } else {
      await supabase.from('scorecard_scores').insert({
        round_id: selectedRoundId,
        criterion_id: criterionId,
        score,
      })
    }
    const { data } = await supabase
      .from('scorecard_scores')
      .select('*, scorecard_criteria(*)')
      .eq('round_id', selectedRoundId)
    if (data) setScores(prev => ({ ...prev, [selectedRoundId]: data as ScorecardScore[] }))
  }

  const handleScoreNoteBlur = async (criterionId: string) => {
    const note = scoreNotes[criterionId] ?? ''
    const existing = scores[selectedRoundId]?.find(s => s.criterion_id === criterionId)
    if (existing) {
      await supabase.from('scorecard_scores').update({ notes: note }).eq('id', existing.id)
    } else {
      await supabase.from('scorecard_scores').insert({
        round_id: selectedRoundId,
        criterion_id: criterionId,
        score: 0,
        notes: note,
      })
    }
  }

  const handleAddRound = async () => {
    const nextNum = rounds.length + 1
    const { data } = await supabase
      .from('interview_rounds')
      .insert({
        candidate_id: id,
        round_number: nextNum,
        round_name: `Round ${nextNum}`,
        status: 'scheduled',
        max_score: 60,
      })
      .select()
      .single()
    if (data) {
      setRounds(prev => [...prev, data as InterviewRound])
      setSelectedRoundId(data.id)
    }
  }

  const handleGenerateAnalysis = async () => {
    if (!selectedRoundId || !id) return
    setAnalysisLoading(true)
    try {
      const res = await fetch('/api/post-interview-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round_id: selectedRoundId, candidate_id: id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAnalysisResult(prev => ({ ...prev, [selectedRoundId]: data }))
      setRounds(prev => prev.map(r =>
        r.id === selectedRoundId
          ? { ...r, ai_summary: data.summary, ai_recommendation: data.recommendation, next_steps: data.nextSteps, status: 'completed', total_score: data.totalScore }
          : r
      ))
      await load()
    } finally {
      setAnalysisLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-brand-stone text-sm">Loading…</div>
  }
  if (!candidate) {
    return <div className="p-8 text-brand-stone text-sm">Candidate not found.</div>
  }

  const selectedRound = rounds.find(r => r.id === selectedRoundId)
  const roundScores = scores[selectedRoundId] || []
  const totalScore = roundScores.reduce((s, sc) => s + (sc.score || 0), 0)
  const totalPct = Math.round((totalScore / 60) * 100)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile & Resume' },
    { key: 'scorecard', label: 'Scorecard' },
    { key: 'analysis', label: 'AI Analysis' },
    { key: 'activity', label: 'Activity' },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Left sidebar */}
      <div
        className="w-64 flex-shrink-0 p-6 flex flex-col"
        style={{ borderRight: '1px solid #E8E2D6', backgroundColor: '#FFFFFF' }}
      >
        <div className="mb-5">
          <Avatar name={candidate.full_name} />
          <h2
            className="font-semibold mt-3 text-base"
            style={{ color: '#011B03' }}
          >
            {candidate.full_name}
          </h2>
          {candidate.current_title && (
            <div className="text-brand-stone text-xs mt-0.5">{candidate.current_title}</div>
          )}
          {candidate.current_company && (
            <div className="text-brand-stone text-xs">{candidate.current_company}</div>
          )}
        </div>

        {/* Fit score with breakdown */}
        <div className="mb-5 pb-5" style={{ borderBottom: '1px solid #E8E2D6' }}>
          <div className="text-brand-stone text-[10px] uppercase tracking-wider mb-1">Fit Score</div>
          <div className="flex items-baseline gap-1 mb-2">
            <span
              className="text-3xl font-light tabular-nums"
              style={{ color: candidate.fit_score !== null && candidate.fit_score >= 75 ? '#CE9F55' : candidate.fit_score !== null && candidate.fit_score >= 50 ? '#5C5753' : '#7A7570' }}
            >
              {candidate.fit_score ?? '—'}
            </span>
            {candidate.fit_score !== null && (
              <span className="text-brand-stone text-sm">/100</span>
            )}
          </div>
          {candidate.fit_score !== null && (
            <>
              {/* Score bar */}
              <div className="w-full rounded-full h-1.5 mb-2" style={{ backgroundColor: '#E8E2D6' }}>
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${candidate.fit_score}%`,
                    backgroundColor: candidate.fit_score >= 75 ? '#CE9F55' : candidate.fit_score >= 50 ? '#5C5753' : '#7A7570',
                  }}
                />
              </div>
              <button
                onClick={() => setFitExpanded(v => !v)}
                className="text-brand-stone text-[10px] hover:text-brand-stone-light transition-brand"
              >
                {fitExpanded ? 'Hide breakdown ▲' : 'How calculated? ▾'}
              </button>
              {fitExpanded && (
                <p className="text-brand-stone text-[10px] mt-2 leading-relaxed">
                  Based on AI resume analysis. Scored across: relevance of experience, skills match, communication signals, and motivation indicators.
                </p>
              )}
            </>
          )}
        </div>

        {/* Stage selector */}
        <div className="mb-5 pb-5" style={{ borderBottom: '1px solid #E8E2D6' }}>
          <div className="text-brand-stone text-[10px] uppercase tracking-wider mb-2">Stage</div>
          <select
            value={candidate.pipeline_stage}
            onChange={e => handleStageChange(e.target.value as PipelineStage)}
            disabled={savingStage}
            style={{
              width: '100%',
              padding: '7px 10px',
              border: '1px solid #E8E2D6',
              borderRadius: 4,
              backgroundColor: '#FFFFFF',
              color: '#2C2A25',
              fontSize: 12,
              fontFamily: "'ManropeST', 'Manrope', sans-serif",
              outline: 'none',
            }}
          >
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Contact info */}
        <div className="space-y-3">
          {candidate.email && (
            <div>
              <div className="text-brand-stone text-[10px] uppercase tracking-wider">Email</div>
              <div className="text-brand-text text-xs truncate mt-0.5">{candidate.email}</div>
            </div>
          )}
          {candidate.phone && (
            <div>
              <div className="text-brand-stone text-[10px] uppercase tracking-wider">Phone</div>
              <div className="text-brand-text text-xs mt-0.5">{candidate.phone}</div>
            </div>
          )}
          {candidate.location && (
            <div>
              <div className="text-brand-stone text-[10px] uppercase tracking-wider">Location</div>
              <div className="text-brand-text text-xs mt-0.5">{candidate.location}</div>
            </div>
          )}
          {candidate.linkedin_url && (
            <div>
              <div className="text-brand-stone text-[10px] uppercase tracking-wider">LinkedIn</div>
              <a
                href={candidate.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-gold text-xs hover:text-brand-gold-light truncate block mt-0.5"
              >
                View Profile →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 bg-brand-bg">
        {/* Tabs */}
        <div className="flex gap-1 mb-8" style={{ borderBottom: '1px solid #E8E2D6' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="px-4 py-2.5 text-sm font-medium transition-brand border-b-2 -mb-px"
              style={{
                fontFamily: "'ManropeST', 'Manrope', sans-serif",
                borderBottomColor: activeTab === t.key ? '#CE9F55' : 'transparent',
                color: activeTab === t.key ? '#CE9F55' : '#7A7570',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile & Resume tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-2xl">
            {candidate.notes && (
              <div>
                <div className="text-brand-stone text-[11px] uppercase tracking-wider mb-2">Notes</div>
                <div className="bg-white border border-brand-border rounded-md p-4 text-brand-text text-sm shadow-sm">
                  {candidate.notes}
                </div>
              </div>
            )}
            {candidate.ai_summary && (
              <div>
                <div className="text-brand-stone text-[11px] uppercase tracking-wider mb-2">AI Summary</div>
                <div className="bg-white border border-brand-border rounded-md p-4 text-brand-text text-sm leading-relaxed shadow-sm">
                  {candidate.ai_summary}
                </div>
              </div>
            )}
            {candidate.ai_strengths && candidate.ai_strengths.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-brand-stone text-[11px] uppercase tracking-wider mb-2">Strengths</div>
                  <ul className="space-y-2">
                    {candidate.ai_strengths.map((s, i) => (
                      <li key={i} className="text-sm text-brand-text flex gap-2">
                        <span className="text-brand-gold mt-0.5 font-semibold">+</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {candidate.ai_concerns && candidate.ai_concerns.length > 0 && (
                  <div>
                    <div className="text-brand-stone text-[11px] uppercase tracking-wider mb-2">Concerns</div>
                    <ul className="space-y-2">
                      {candidate.ai_concerns.map((s, i) => (
                        <li key={i} className="text-sm text-brand-stone flex gap-2">
                          <span className="mt-0.5">−</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {candidate.resume_text && (
              <div>
                <div className="text-brand-stone text-[11px] uppercase tracking-wider mb-2">Resume Text</div>
                <div
                  className="bg-white border border-brand-border rounded-md p-4 text-brand-stone text-xs font-mono whitespace-pre-wrap max-h-80 overflow-y-auto shadow-sm"
                >
                  {candidate.resume_text}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scorecard tab */}
        {activeTab === 'scorecard' && (
          <div className="max-w-3xl">
            {/* Round selector */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-2">
                {rounds.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoundId(r.id)}
                    className="px-3 py-1.5 rounded text-xs font-medium transition-brand"
                    style={{
                      fontFamily: "'ManropeST', 'Manrope', sans-serif",
                      backgroundColor: selectedRoundId === r.id ? '#CE9F55' : '#FFFFFF',
                      color: selectedRoundId === r.id ? '#F6F1E8' : '#7A7570',
                      border: selectedRoundId === r.id ? '1px solid #CE9F55' : '1px solid #E8E2D6',
                    }}
                  >
                    {r.round_name}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddRound}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #E8E2D6',
                  borderRadius: 4,
                  backgroundColor: '#FFFFFF',
                  color: '#7A7570',
                  fontFamily: "'ManropeST', 'Manrope', sans-serif",
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                + Add Round
              </button>
            </div>

            {selectedRound && (
              <>
                {/* Score grid */}
                <div className="space-y-3 mb-6">
                  {criteria.map(criterion => {
                    const scoreEntry = roundScores.find(s => s.criterion_id === criterion.id)
                    const currentScore = scoreEntry?.score ?? 0
                    const note = scoreNotes[criterion.id] ?? scoreEntry?.notes ?? ''
                    const scorePct = (currentScore / criterion.max_score) * 100

                    return (
                      <div
                        key={criterion.id}
                        className="bg-white border border-brand-border rounded-md p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-brand-forest text-sm font-medium">{criterion.name}</div>
                            {criterion.description && (
                              <div className="text-brand-stone text-xs mt-0.5">{criterion.description}</div>
                            )}
                          </div>
                          <div className="ml-4 text-right flex-shrink-0">
                            <span
                              className="text-lg font-semibold tabular-nums"
                              style={{ color: currentScore >= 7 ? '#CE9F55' : currentScore >= 5 ? '#5C5753' : '#7A7570' }}
                            >
                              {currentScore}
                            </span>
                            <span className="text-brand-stone text-xs">/{criterion.max_score}</span>
                          </div>
                        </div>

                        {/* Score bar */}
                        <div className="w-full rounded-full h-1.5 mb-3" style={{ backgroundColor: '#E8E2D6' }}>
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${scorePct}%`,
                              backgroundColor: currentScore >= 7 ? '#CE9F55' : currentScore >= 5 ? '#5C5753' : '#E8E2D6',
                            }}
                          />
                        </div>

                        {/* Score buttons 0-10 */}
                        <div className="flex gap-1 mb-3 flex-wrap">
                          {Array.from({ length: criterion.max_score + 1 }, (_, i) => i).map(n => (
                            <button
                              key={n}
                              onClick={() => handleScoreSet(criterion.id, n)}
                              className="w-7 h-7 rounded text-xs font-medium transition-brand"
                              style={{
                                backgroundColor: currentScore === n ? '#CE9F55' : '#F6F1E8',
                                color: currentScore === n ? '#F6F1E8' : '#7A7570',
                                border: currentScore === n ? '1px solid #CE9F55' : '1px solid #E8E2D6',
                                fontFamily: "'ManropeST', 'Manrope', sans-serif",
                                fontWeight: currentScore === n ? 600 : 400,
                              }}
                            >
                              {n}
                            </button>
                          ))}
                        </div>

                        {/* Notes */}
                        <input
                          type="text"
                          placeholder="Notes for this criterion…"
                          value={note}
                          onChange={e => setScoreNotes(prev => ({ ...prev, [criterion.id]: e.target.value }))}
                          onBlur={() => handleScoreNoteBlur(criterion.id)}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            border: '1px solid #E8E2D6',
                            borderRadius: 4,
                            backgroundColor: '#F6F1E8',
                            color: '#5C5753',
                            fontSize: 12,
                            fontFamily: "'ManropeST', 'Manrope', sans-serif",
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Total score */}
                <div
                  className="flex items-center justify-between rounded-md p-4 mb-4 shadow-sm"
                  style={{ backgroundColor: '#FFFFFF', border: '2px solid #E8E2D6' }}
                >
                  <span
                    style={{
                      fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
                      color: '#011B03',
                      fontSize: 12,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Total Score
                  </span>
                  <div className="text-right">
                    <span className="text-brand-gold text-2xl font-semibold tabular-nums">
                      {totalScore}
                    </span>
                    <span className="text-brand-stone text-sm font-normal"> / 60</span>
                    <div className="text-brand-stone text-xs">{totalPct}%</div>
                  </div>
                </div>

                {/* Generate analysis */}
                <button
                  onClick={handleGenerateAnalysis}
                  disabled={analysisLoading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: analysisLoading ? '#5C5753' : '#011B03',
                    color: '#F6F1E8',
                    fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRadius: 4,
                    cursor: analysisLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {analysisLoading ? 'Generating Analysis…' : 'Generate Post-Interview Analysis'}
                </button>
              </>
            )}

            {rounds.length === 0 && (
              <div className="text-brand-stone text-sm">No interview rounds yet.</div>
            )}
          </div>
        )}

        {/* AI Analysis tab */}
        {activeTab === 'analysis' && (
          <div className="max-w-2xl">
            {rounds.length > 0 && (
              <div className="flex gap-2 mb-6">
                {rounds.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoundId(r.id)}
                    className="px-3 py-1.5 rounded text-xs font-medium transition-brand"
                    style={{
                      fontFamily: "'ManropeST', 'Manrope', sans-serif",
                      backgroundColor: selectedRoundId === r.id ? '#CE9F55' : '#FFFFFF',
                      color: selectedRoundId === r.id ? '#F6F1E8' : '#7A7570',
                      border: selectedRoundId === r.id ? '1px solid #CE9F55' : '1px solid #E8E2D6',
                    }}
                  >
                    {r.round_name}
                  </button>
                ))}
              </div>
            )}
            {selectedRound ? (
              selectedRound.ai_summary || analysisResult[selectedRoundId] ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-6 bg-white border border-brand-border rounded-md p-4 shadow-sm">
                    <div>
                      <div className="text-brand-stone text-[10px] uppercase tracking-wider mb-1">Score</div>
                      <div>
                        <span className="text-brand-gold text-2xl font-semibold tabular-nums">
                          {selectedRound.total_score ?? analysisResult[selectedRoundId]?.totalScore ?? 0}
                        </span>
                        <span className="text-brand-stone text-sm">/{selectedRound.max_score}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="w-full rounded-full h-2" style={{ backgroundColor: '#E8E2D6' }}>
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${((selectedRound.total_score ?? 0) / selectedRound.max_score) * 100}%`,
                            backgroundColor: '#CE9F55',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-brand-stone text-[11px] uppercase tracking-wider mb-2">Summary</div>
                    <div className="bg-white border border-brand-border rounded-md p-4 text-brand-text text-sm leading-relaxed shadow-sm">
                      {selectedRound.ai_summary || analysisResult[selectedRoundId]?.summary}
                    </div>
                  </div>
                  <div>
                    <div className="text-brand-stone text-[11px] uppercase tracking-wider mb-2">Recommendation</div>
                    <div
                      className="bg-white border rounded-md p-4 text-sm font-medium shadow-sm"
                      style={{ borderColor: '#CE9F55', color: '#CE9F55' }}
                    >
                      {selectedRound.ai_recommendation || analysisResult[selectedRoundId]?.recommendation}
                    </div>
                  </div>
                  <div>
                    <div className="text-brand-stone text-[11px] uppercase tracking-wider mb-2">Next Steps</div>
                    <div className="bg-white border border-brand-border rounded-md p-4 text-brand-text text-sm leading-relaxed shadow-sm">
                      {selectedRound.next_steps || analysisResult[selectedRoundId]?.nextSteps}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-brand-stone text-sm">
                  No analysis yet for this round. Score the round in the Scorecard tab and click &ldquo;Generate Post-Interview Analysis&rdquo;.
                </div>
              )
            ) : (
              <div className="text-brand-stone text-sm">No interview rounds yet.</div>
            )}
          </div>
        )}

        {/* Activity tab */}
        {activeTab === 'activity' && (
          <div className="max-w-xl">
            {activity.length === 0 ? (
              <div className="text-brand-stone text-sm">No activity recorded.</div>
            ) : (
              <div className="space-y-0 relative">
                <div
                  className="absolute left-3 top-2 bottom-2 w-px"
                  style={{ backgroundColor: '#E8E2D6' }}
                />
                {activity.map(a => (
                  <div key={a.id} className="flex gap-4 pb-5 relative">
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center z-10"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E2D6' }}
                    >
                      <span
                        className="w-2 h-2 rounded-full block"
                        style={{ backgroundColor: '#CE9F55' }}
                      />
                    </div>
                    <div>
                      <div className="text-brand-text text-sm">{a.description}</div>
                      <div className="text-brand-stone text-xs mt-0.5">
                        {new Date(a.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
