import type { PipelineStage } from '@/types'

const stageColors: Record<PipelineStage, string> = {
  Applied: 'text-blue-300 bg-blue-900/20 border-blue-800/40',
  Interviewed: 'text-brand-gold bg-brand-gold/10 border-brand-gold/20',
  Offered: 'text-emerald-300 bg-emerald-900/20 border-emerald-800/40',
  Hired: 'text-green-300 bg-green-900/20 border-green-800/40',
  Rejected: 'text-brand-stone bg-brand-surface-2 border-brand-border',
}

export default function StageBadge({ stage }: { stage: PipelineStage }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border tracking-wide uppercase ${stageColors[stage]}`}
    >
      {stage}
    </span>
  )
}
