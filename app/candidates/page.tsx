'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Candidate, PipelineStage } from '@/types'
import StageBadge from '@/components/StageBadge'
import FitScoreBadge from '@/components/FitScoreBadge'
import AddCandidateModal from '@/components/candidates/AddCandidateModal'
import { Suspense } from 'react'

function CandidatesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(searchParams.get('action') === 'add')
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'All'>('All')

  const STAGES: (PipelineStage | 'All')[] = ['All', 'Applied', 'Interviewed', 'Offered', 'Hired', 'Rejected']

  const load = useCallback(async () => {
    let query = supabase
      .from('candidates')
      .select('*, job_descriptions(role_title)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (stageFilter !== 'All') query = query.eq('pipeline_stage', stageFilter)
    const { data } = await query
    if (data) setCandidates(data as Candidate[])
    setLoading(false)
  }, [stageFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-brand-forest text-2xl tracking-[0.15em] uppercase mb-1"
            style={{ fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif" }}
          >
            Candidates
          </h1>
          <p className="text-brand-stone text-sm">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: '9px 20px',
            backgroundColor: '#011B03',
            color: '#F6F1E8',
            fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Add Candidate
        </button>
      </div>

      {/* Stage filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STAGES.map(s => (
          <button
            key={s}
            onClick={() => setStageFilter(s)}
            className="px-3 py-1.5 rounded text-xs font-medium transition-brand"
            style={{
              fontFamily: "'ManropeST', 'Manrope', sans-serif",
              backgroundColor: stageFilter === s ? '#CE9F55' : '#FFFFFF',
              color: stageFilter === s ? '#F6F1E8' : '#7A7570',
              border: stageFilter === s ? '1px solid #CE9F55' : '1px solid #E8E2D6',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-brand-stone text-sm">Loading…</div>
        ) : candidates.length === 0 ? (
          <div className="p-8 text-center text-brand-stone text-sm">No candidates found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-surface-2">
                <th className="text-left px-4 py-3 text-brand-stone text-[11px] uppercase tracking-wider font-medium">Name</th>
                <th className="text-left px-4 py-3 text-brand-stone text-[11px] uppercase tracking-wider font-medium">Role</th>
                <th className="text-left px-4 py-3 text-brand-stone text-[11px] uppercase tracking-wider font-medium">Location</th>
                <th className="text-left px-4 py-3 text-brand-stone text-[11px] uppercase tracking-wider font-medium">Stage</th>
                <th className="text-right px-4 py-3 text-brand-stone text-[11px] uppercase tracking-wider font-medium">Fit</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/candidates/${c.id}`)}
                  className={`hover:bg-brand-surface-2 cursor-pointer transition-brand ${
                    i < candidates.length - 1 ? 'border-b border-brand-border' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-brand-forest font-medium">{c.full_name}</td>
                  <td className="px-4 py-3 text-brand-stone">
                    {c.current_title || (c.job_descriptions as { role_title?: string } | null)?.role_title || '—'}
                  </td>
                  <td className="px-4 py-3 text-brand-stone">{c.location || '—'}</td>
                  <td className="px-4 py-3"><StageBadge stage={c.pipeline_stage} /></td>
                  <td className="px-4 py-3 text-right"><FitScoreBadge score={c.fit_score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddCandidateModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load() }}
        />
      )}
    </div>
  )
}

export default function CandidatesPage() {
  return (
    <Suspense>
      <CandidatesInner />
    </Suspense>
  )
}
