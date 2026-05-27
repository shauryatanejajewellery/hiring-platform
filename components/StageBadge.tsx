import type { PipelineStage } from '@/types'

const stageColors: Record<PipelineStage, string> = {
  Applied:     'text-brand-navy bg-blue-50 border-blue-200',
  Interviewed: 'text-brand-gold bg-amber-50 border-amber-200',
  Offered:     'text-emerald-700 bg-emerald-50 border-emerald-200',
  Hired:       'text-green-700 bg-green-50 border-green-200',
  Rejected:    'text-brand-stone bg-gray-100 border-gray-200',
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
