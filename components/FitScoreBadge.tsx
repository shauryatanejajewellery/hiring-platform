export default function FitScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return <span className="text-brand-stone text-xs">—</span>
  }
  const color =
    score >= 75 ? 'text-brand-gold font-semibold' :
    score >= 50 ? 'text-brand-stone-light font-medium' :
    'text-brand-stone'
  return (
    <span className={`text-xs tabular-nums ${color}`}>
      {score}
    </span>
  )
}
