'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Candidate, PipelineStage } from '@/types'
import StageBadge from '@/components/StageBadge'
import FitScoreBadge from '@/components/FitScoreBadge'

const STAGES: PipelineStage[] = ['Applied', 'Interviewed', 'Offered', 'Hired', 'Rejected']

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
          className="text-xl text-brand-gold tracking-[0.15em] uppercase mb-1"
          style={{ fontFamily: '"Copperplate Gothic Bold", "Copperplate Gothic", Copperplate, serif' }}
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
            className="bg-brand-surface border border-brand-border rounded p-4 hover:border-brand-border-light transition-brand"
          >
            <div className="text-2xl font-light text-brand-text tabular-nums mb-1">
              {loading ? '—' : stageCounts[stage] ?? 0}
            </div>
            <div className="text-brand-stone text-xs uppercase tracking-wider">{stage}</div>
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
            className="bg-brand-surface border border-brand-border rounded p-5 hover:border-brand-gold/40 hover:bg-brand-surface-2 transition-brand group"
          >
            <div className="text-brand-gold text-sm font-medium mb-1 group-hover:text-brand-gold-light">
              {a.label}
            </div>
            <div className="text-brand-stone text-xs">{a.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent candidates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-brand-stone-light text-xs uppercase tracking-widest">Recent Candidates</h2>
          <Link href="/candidates" className="text-brand-gold text-xs hover:text-brand-gold-light">
            View all →
          </Link>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded overflow-hidden">
          {loading ? (
            <div className="p-6 text-brand-stone text-sm text-center">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="p-6 text-brand-stone text-sm text-center">No candidates yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left px-4 py-3 text-brand-stone text-xs uppercase tracking-wider font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-brand-stone text-xs uppercase tracking-wider font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-brand-stone text-xs uppercase tracking-wider font-medium">Stage</th>
                  <th className="text-right px-4 py-3 text-brand-stone text-xs uppercase tracking-wider font-medium">Fit</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-brand-surface-2 transition-brand cursor-pointer ${i < recent.length - 1 ? 'border-b border-brand-border' : ''}`}
                    onClick={() => { window.location.href = `/candidates/${c.id}` }}
                  >
                    <td className="px-4 py-3 text-brand-text font-medium">{c.full_name}</td>
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
