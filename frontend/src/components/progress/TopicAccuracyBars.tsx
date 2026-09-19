import type { TopicAccuracy } from '../../types/Progress'

export function TopicAccuracyBars({ data }: { data: TopicAccuracy[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-stone-400">No answered questions yet.</p>
  }

  return (
    <div className="space-y-3">
      {data.map((t) => (
        <div key={t.topic}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-stone-700">{t.topic}</span>
            <span className="text-stone-500">
              {t.accuracy_percentage}% <span className="text-stone-400">({t.attempts})</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-leaf-500"
              style={{ width: `${Math.max(2, Math.min(100, t.accuracy_percentage))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
