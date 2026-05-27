'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Candidate, PipelineStage } from '@/types'
import FitScoreBadge from '@/components/FitScoreBadge'

const STAGES: PipelineStage[] = ['Applied', 'Interviewed', 'Offered', 'Hired', 'Rejected']

const STAGE_STYLES: Record<PipelineStage, { headerColor: string; borderColor: string }> = {
  Applied:     { headerColor: '#0C1C2C', borderColor: '#BFCFE0' },
  Interviewed: { headerColor: '#CE9F55', borderColor: '#E8D5A3' },
  Offered:     { headerColor: '#2D6A4F', borderColor: '#A8D5B5' },
  Hired:       { headerColor: '#1B4332', borderColor: '#95D5B2' },
  Rejected:    { headerColor: '#7A7570', borderColor: '#E8E2D6' },
}

export default function PipelinePage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('candidates')
      .select('*, job_descriptions(role_title)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (data) setCandidates(data as Candidate[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = candidates.filter(c => c.pipeline_stage === stage)
    return acc
  }, {} as Record<PipelineStage, Candidate[]>)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('candidateId', id)
    setDraggingId(id)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverStage(null)
  }

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault()
    setDragOverStage(stage)
  }

  const handleDrop = async (e: React.DragEvent, toStage: PipelineStage) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('candidateId')
    if (!id) return
    const candidate = candidates.find(c => c.id === id)
    if (!candidate || candidate.pipeline_stage === toStage) {
      setDragOverStage(null)
      setDraggingId(null)
      return
    }

    setCandidates(prev =>
      prev.map(c => c.id === id ? { ...c, pipeline_stage: toStage } : c)
    )
    setDragOverStage(null)
    setDraggingId(null)

    await supabase.from('candidates').update({ pipeline_stage: toStage }).eq('id', id)
    await supabase.from('candidate_activity').insert({
      candidate_id: id,
      activity_type: 'stage_change',
      description: `Moved from ${candidate.pipeline_stage} to ${toStage}.`,
      metadata: { from: candidate.pipeline_stage, to: toStage },
    })
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-brand-stone text-sm">Loading pipeline…</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="text-brand-forest text-2xl tracking-[0.15em] uppercase mb-1"
          style={{ fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif" }}
        >
          Pipeline
        </h1>
        <p className="text-brand-stone text-sm">Drag candidates between stages.</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 180px)' }}>
        {STAGES.map(stage => {
          const cards = grouped[stage]
          const styles = STAGE_STYLES[stage]
          const isOver = dragOverStage === stage

          return (
            <div
              key={stage}
              className="flex-shrink-0 w-64 flex flex-col rounded-md transition-brand"
              style={{
                border: `1px solid ${isOver ? '#CE9F55' : styles.borderColor}`,
                backgroundColor: isOver ? '#EDEAE3' : '#FFFFFF',
              }}
              onDragOver={e => handleDragOver(e, stage)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={e => handleDrop(e, stage)}
            >
              {/* Column header */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${styles.borderColor}` }}
              >
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{
                    fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
                    color: styles.headerColor,
                    letterSpacing: '0.12em',
                  }}
                >
                  {stage}
                </span>
                <span className="text-brand-stone text-xs tabular-nums">{cards.length}</span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {cards.map(c => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={e => handleDragStart(e, c.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => router.push(`/candidates/${c.id}`)}
                    className="rounded-md p-3 cursor-grab active:cursor-grabbing select-none transition-brand"
                    style={{
                      backgroundColor: '#F6F1E8',
                      border: '1px solid #E8E2D6',
                      opacity: draggingId === c.id ? 0.4 : 1,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#D5CFC4' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E8E2D6' }}
                  >
                    <div className="text-brand-forest text-sm font-medium mb-1 truncate">
                      {c.full_name}
                    </div>
                    <div className="text-brand-stone text-xs truncate mb-2">
                      {c.current_title || (c.job_descriptions as { role_title?: string } | null)?.role_title || '—'}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-brand-stone text-[10px] uppercase tracking-wide">Fit</span>
                      <FitScoreBadge score={c.fit_score} />
                    </div>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div className="text-brand-stone text-xs text-center py-6 opacity-50">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
