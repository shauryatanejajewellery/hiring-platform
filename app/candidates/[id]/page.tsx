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
    <div className="w-14 h-14 rounded-full bg-brand-surface-2 border border-brand-border flex items-center justify-center">
      <span className="text-brand-gold text-lg font-semibold">{initials}</span>
    </div>
  )
}

export default function CandidateDetailPage() {
  const { id } = useParams() as { id: string }
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [rounds, setRounds] = useState<InterviewRound[]>([])
  const [criteria, setCriteria] = useState<ScorecardCriterion[]>([])
  const [scores, setScores] = useState<Record<string, ScorecardScore[]>>({}) // round_id -> scores
  const [activity, setActivity] = useState<CandidateActivity[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [selectedRoundId, setSelectedRoundId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [savingStage, setSavingStage] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<Record<string, PostInterviewAnalysis>>({})
  const [roundNotes, setRoundNotes] = useState<Record<string, string>>({})
  const [scoreNotes, setScoreNotes] = useState<Record<string, string>>({}) // criterion_id -> note

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

  // Load scores for each round
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile & Resume' },
    { key: 'scorecard', label: 'Scorecard' },
    { key: 'analysis', label: 'AI Analysis' },
    { key: 'activity', label: 'Activity' },
  ]

  return (
    <div className="flex min-h-screen">
      {/* Left sidebar */}
      <div className="w-64 border-r border-brand-border bg-brand-surface p-6 flex-shrink-0">
        <div className="mb-5">
          <Avatar name={candidate.full_name} />
          <h2 className="text-brand-text font-semibold mt-3 text-base">{candidate.full_name}</h2>
          {candidate.current_title && (
            <div className="text-brand-stone text-xs mt-0.5">{candidate.current_title}</div>
          )}
          {candidate.current_company && (
            <div className="text-brand-stone text-xs">{candidate.current_company}</div>
          )}
        </div>

        {/* Fit score */}
        <div className="mb-5 pb-5 border-b border-brand-border">
          <div className="text-brand-stone text-[10px] uppercase tracking-wider mb-1">Fit Score</div>
          <div className="text-2xl font-light text-brand-gold tabular-nums">
            {candidate.fit_score ?? '—'}
            {candidate.fit_score !== null && <span className="text-brand-stone text-sm">/100</span>}
          </div>
        </div>

        {/* Stage selector */}
        <div className="mb-5 pb-5 border-b border-brand-border">
          <div className="text-brand-stone text-[10px] uppercase tracking-wider mb-2">Stage</div>
          <select
            value={candidate.pipeline_stage}
            onChange={e => handleStageChange(e.target.value as PipelineStage)}
            disabled={savingStage}
            className="w-full bg-brand-surface-2 border border-brand-border rounded px-2 py-1.5 text-brand-text text-xs focus:outline-none focus:border-brand-gold"
          >
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Contact info */}
        <div className="space-y-2">
          {candidate.email && (
            <div>
              <div className="text-brand-stone text-[10px] uppercase tracking-wider">Email</div>
              <div className="text-brand-text text-xs truncate">{candidate.email}</div>
            </div>
          )}
          {candidate.phone && (
            <div>
              <div className="text-brand-stone text-[10px] uppercase tracking-wider">Phone</div>
              <div className="text-brand-text text-xs">{candidate.phone}</div>
            </div>
          )}
          {candidate.location && (
            <div>
              <div className="text-brand-stone text-[10px] uppercase tracking-wider">Location</div>
              <div className="text-brand-text text-xs">{candidate.location}</div>
            </div>
          )}
          {candidate.linkedin_url && (
            <div>
              <div className="text-brand-stone text-[10px] uppercase tracking-wider">LinkedIn</div>
              <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-brand-gold text-xs hover:text-brand-gold-light truncate block">
                View Profile →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-brand-border">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-brand border-b-2 -mb-px ${
                activeTab === t.key
                  ? 'border-brand-gold text-brand-gold'
                  : 'border-transparent text-brand-stone hover:text-brand-text'
              }`}
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
                <div className="text-brand-stone text-xs uppercase tracking-wider mb-2">Notes</div>
                <div className="bg-brand-surface-2 border border-brand-border rounded p-4 text-brand-stone-light text-sm">
                  {candidate.notes}
                </div>
              </div>
            )}
            {candidate.ai_summary && (
              <div>
                <div className="text-brand-stone text-xs uppercase tracking-wider mb-2">AI Summary</div>
                <div className="bg-brand-surface-2 border border-brand-border rounded p-4 text-brand-text text-sm">
                  {candidate.ai_summary}
                </div>
              </div>
            )}
            {candidate.ai_strengths && candidate.ai_strengths.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-brand-stone text-xs uppercase tracking-wider mb-2">Strengths</div>
                  <ul className="space-y-1">
                    {candidate.ai_strengths.map((s, i) => (
                      <li key={i} className="text-sm text-brand-text flex gap-2">
                        <span className="text-brand-gold mt-0.5">+</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {candidate.ai_concerns && candidate.ai_concerns.length > 0 && (
                  <div>
                    <div className="text-brand-stone text-xs uppercase tracking-wider mb-2">Concerns</div>
                    <ul className="space-y-1">
                      {candidate.ai_concerns.map((s, i) => (
                        <li key={i} className="text-sm text-brand-stone-light flex gap-2">
                          <span className="text-brand-stone mt-0.5">−</span>
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
                <div className="text-brand-stone text-xs uppercase tracking-wider mb-2">Resume Text</div>
                <div className="bg-brand-surface-2 border border-brand-border rounded p-4 text-brand-stone-light text-xs font-mono whitespace-pre-wrap max-h-80 overflow-y-auto">
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
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-brand ${
                      selectedRoundId === r.id
                        ? 'bg-brand-gold text-brand-bg'
                        : 'bg-brand-surface border border-brand-border text-brand-stone hover:text-brand-text'
                    }`}
                  >
                    {r.round_name}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddRound}
                className="px-3 py-1.5 rounded text-xs border border-brand-border text-brand-stone hover:text-brand-text hover:border-brand-border-light transition-brand"
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

                    return (
                      <div key={criterion.id} className="bg-brand-surface border border-brand-border rounded p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-brand-text text-sm font-medium">{criterion.name}</div>
                            {criterion.description && (
                              <div className="text-brand-stone text-xs mt-0.5">{criterion.description}</div>
                            )}
                          </div>
                          <div className="text-brand-gold text-sm font-semibold tabular-nums ml-4">
                            {currentScore}/{criterion.max_score}
                          </div>
                        </div>
                        {/* Score buttons */}
                        <div className="flex gap-1 mb-3 flex-wrap">
                          {Array.from({ length: criterion.max_score + 1 }, (_, i) => i).map(n => (
                            <button
                              key={n}
                              onClick={() => handleScoreSet(criterion.id, n)}
                              className={`w-7 h-7 rounded text-xs font-medium transition-brand ${
                                currentScore === n
                                  ? 'bg-brand-gold text-brand-bg'
                                  : 'bg-brand-surface-2 border border-brand-border text-brand-stone hover:border-brand-gold/40 hover:text-brand-text'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        {/* Notes */}
                        <input
                          type="text"
                          placeholder="Notes…"
                          value={note}
                          onChange={e => setScoreNotes(prev => ({ ...prev, [criterion.id]: e.target.value }))}
                          onBlur={() => handleScoreNoteBlur(criterion.id)}
                          className="w-full bg-brand-surface-2 border border-brand-border rounded px-3 py-1.5 text-brand-stone text-xs focus:outline-none focus:border-brand-gold"
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Total score */}
                <div className="flex items-center justify-between bg-brand-surface-2 border border-brand-border rounded p-4 mb-4">
                  <span className="text-brand-stone text-sm">Total Score</span>
                  <span className="text-brand-gold text-xl font-semibold tabular-nums">
                    {totalScore}<span className="text-brand-stone text-sm">/60</span>
                  </span>
                </div>

                {/* Generate analysis button */}
                <button
                  onClick={handleGenerateAnalysis}
                  disabled={analysisLoading}
                  className="px-5 py-2.5 bg-brand-gold text-brand-bg text-sm font-medium rounded hover:bg-brand-gold-light transition-brand disabled:opacity-50"
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
            {/* Round selector */}
            {rounds.length > 0 && (
              <div className="flex gap-2 mb-6">
                {rounds.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoundId(r.id)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-brand ${
                      selectedRoundId === r.id
                        ? 'bg-brand-gold text-brand-bg'
                        : 'bg-brand-surface border border-brand-border text-brand-stone hover:text-brand-text'
                    }`}
                  >
                    {r.round_name}
                  </button>
                ))}
              </div>
            )}
            {selectedRound ? (
              selectedRound.ai_summary || analysisResult[selectedRoundId] ? (
                <div className="space-y-5">
                  {/* Score bar */}
                  <div className="flex items-center gap-4 bg-brand-surface border border-brand-border rounded p-4">
                    <div>
                      <div className="text-brand-stone text-[10px] uppercase tracking-wider">Score</div>
                      <div className="text-brand-gold text-xl font-semibold tabular-nums">
                        {selectedRound.total_score ?? analysisResult[selectedRoundId]?.totalScore ?? 0}
                        <span className="text-brand-stone text-sm">/{selectedRound.max_score}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-brand-stone text-xs uppercase tracking-wider mb-2">Summary</div>
                    <div className="bg-brand-surface-2 border border-brand-border rounded p-4 text-brand-text text-sm">
                      {selectedRound.ai_summary || analysisResult[selectedRoundId]?.summary}
                    </div>
                  </div>
                  <div>
                    <div className="text-brand-stone text-xs uppercase tracking-wider mb-2">Recommendation</div>
                    <div className="bg-brand-surface-2 border border-brand-border rounded p-4 text-brand-gold-light text-sm font-medium">
                      {selectedRound.ai_recommendation || analysisResult[selectedRoundId]?.recommendation}
                    </div>
                  </div>
                  <div>
                    <div className="text-brand-stone text-xs uppercase tracking-wider mb-2">Next Steps</div>
                    <div className="bg-brand-surface-2 border border-brand-border rounded p-4 text-brand-text text-sm">
                      {selectedRound.next_steps || analysisResult[selectedRoundId]?.nextSteps}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-brand-stone text-sm">
                  No analysis yet for this round. Score the round in the Scorecard tab and click "Generate Post-Interview Analysis".
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
                <div className="absolute left-3 top-2 bottom-2 w-px bg-brand-border" />
                {activity.map(a => (
                  <div key={a.id} className="flex gap-4 pb-5 relative">
                    <div className="w-6 h-6 rounded-full bg-brand-surface-2 border border-brand-border flex-shrink-0 flex items-center justify-center z-10">
                      <span className="w-2 h-2 rounded-full bg-brand-gold-dim block" />
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
