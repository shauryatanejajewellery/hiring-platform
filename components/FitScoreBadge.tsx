export default function FitScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return <span className="text-brand-stone text-xs">—</span>
  }
  const color =
    score >= 75 ? 'text-brand-gold' : score >= 50 ? 'text-brand-stone-light' : 'text-brand-stone'
  return (
    <span className={`text-xs font-semibold tabular-nums ${color}`}>
      {score}
    </span>
  )
}
