import { useEffect, useState } from 'react'
import { ScoreTrendChart } from '../../components/progress/ScoreTrendChart'
import { TopicAccuracyBars } from '../../components/progress/TopicAccuracyBars'
import { getProgress } from '../../services/progressApi'
import type { ProgressSummary } from '../../types/Progress'

export function Progress() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProgress()
      .then(setSummary)
      .catch(() => setError('Could not load progress. Is the backend running?'))
  }, [])

  if (error) return <p className="text-red-600">{error}</p>
  if (!summary) return <p className="text-stone-500">Loading progress…</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Progress</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Quizzes completed</p>
          <p className="mt-1 text-3xl font-bold text-stone-900">{summary.total_quizzes}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Average score</p>
          <p className="mt-1 text-3xl font-bold text-leaf-700">{summary.average_score_percentage}%</p>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 mb-6">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">Score over time</h2>
        <ScoreTrendChart points={summary.score_trend} />
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">Accuracy by topic</h2>
        <TopicAccuracyBars data={summary.topic_accuracy} />
      </div>
    </div>
  )
}
