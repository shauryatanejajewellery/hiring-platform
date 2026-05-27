'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Candidate, PipelineStage } from '@/types'
import StageBadge from '@/components/StageBadge'
import FitScoreBadge from '@/components/FitScoreBadge'

const STAGES: PipelineStage[] = ['Applied', 'Interviewed', 'Offered', 'Hired', 'Rejected']

const STAGE_COLORS: Record<PipelineStage, string> = {
  Applied:     '#0C1C2C',
  Interviewed: '#CE9F55',
  Offered:     '#2D6A4F',
  Hired:       '#1B4332',
  Rejected:    '#7A7570',
}

export default function Dashboard() {
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({})
  const [recent, setRecent] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: candidates } = await supabase
        .from('candidates')
        .select('id, full_name, pipeline_stage, fit_score, current_title, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (candidates) {
        const counts: Record<string, number> = {}
        STAGES.forEach(s => (counts[s] = 0))
        candidates.forEach(c => {
          counts[c.pipeline_stage] = (counts[c.pipeline_stage] || 0) + 1
        })
        setStageCounts(counts)
        setRecent(candidates.slice(0, 8) as Candidate[])
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-brand-forest text-2xl tracking-[0.15em] uppercase mb-1"
          style={{ fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif" }}
        >
          Dashboard
        </h1>
        <p className="text-brand-stone text-sm">Overview of your hiring pipeline.</p>
      </div>

      {/* Pipeline stage counts */}
      <div className="grid grid-cols-5 gap-3 mb-10">
        {STAGES.map(stage => (
          <Link
            key={stage}
            href="/pipeline"
            className="bg-brand-surface border border-brand-border rounded-md p-5 hover:border-brand-gold hover:shadow-sm transition-brand group"
          >
            <div
              className="text-3xl font-light tabular-nums mb-2"
              style={{ color: STAGE_COLORS[stage] }}
            >
              {loading ? '—' : stageCounts[stage] ?? 0}
            </div>
            <div className="text-brand-stone text-[11px] uppercase tracking-wider">{stage}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { href: '/candidates?action=add', label: 'Add Candidate', desc: 'Create a new candidate profile' },
          { href: '/jd-generator', label: 'Generate JD', desc: 'Draft a branded job description' },
          { href: '/resume-analyser', label: 'Analyse Resume', desc: 'Score a resume against a JD' },
        ].map(a => (
          <Link
            key={a.href}
            href={a.href}
            className="bg-brand-surface border border-brand-border rounded-md p-5 hover:border-brand-gold hover:shadow-sm transition-brand group"
          >
            <div
              className="text-sm font-medium mb-1.5 uppercase tracking-wider"
              style={{
                fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif",
                color: '#011B03',
                fontSize: 11,
                letterSpacing: '0.12em',
              }}
            >
              {a.label}
            </div>
            <div className="text-brand-stone text-xs">{a.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent candidates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-brand-forest text-xs uppercase tracking-widest"
            style={{ fontFamily: "'CopperplateGothicST', 'Copperplate Gothic Bold', Copperplate, serif", letterSpacing: '0.12em' }}
          >
            Recent Candidates
          </h2>
          <Link href="/candidates" className="text-brand-gold text-xs hover:text-brand-gold-light transition-brand">
            View all →
          </Link>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-md overflow-hidden">
          {loading ? (
            <div className="p-6 text-brand-stone text-sm text-center">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="p-6 text-brand-stone text-sm text-center">No candidates yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface-2">
                  <th className="text-left px-4 py-3 text-brand-stone text-[11px] uppercase tracking-wider font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-brand-stone text-[11px] uppercase tracking-wider font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-brand-stone text-[11px] uppercase tracking-wider font-medium">Stage</th>
                  <th className="text-right px-4 py-3 text-brand-stone text-[11px] uppercase tracking-wider font-medium">Fit</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-brand-surface-2 transition-brand cursor-pointer ${i < recent.length - 1 ? 'border-b border-brand-border' : ''}`}
                    onClick={() => { window.location.href = `/candidates/${c.id}` }}
                  >
                    <td className="px-4 py-3 text-brand-forest font-medium">{c.full_name}</td>
                    <td className="px-4 py-3 text-brand-stone">{c.current_title || '—'}</td>
                    <td className="px-4 py-3"><StageBadge stage={c.pipeline_stage} /></td>
                    <td className="px-4 py-3 text-right"><FitScoreBadge score={c.fit_score} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
