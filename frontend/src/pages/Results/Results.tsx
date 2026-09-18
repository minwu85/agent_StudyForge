import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getResultSummary, getReview } from '../../services/quizApi'
import type { ResultSummary, ReviewResponse } from '../../types/Result'

export function Results() {
  const { quizId } = useParams<{ quizId: string }>()
  const [summary, setSummary] = useState<ResultSummary | null>(null)
  const [review, setReview] = useState<ReviewResponse | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!quizId) return
    getResultSummary(Number(quizId))
      .then(setSummary)
      .catch(() => setError('Could not load results for this quiz.'))
  }, [quizId])

  const loadReview = () => {
    if (!quizId) return
    setShowReview(true)
    if (!review) {
      getReview(Number(quizId))
        .then(setReview)
        .catch(() => setError('Could not load the answer review.'))
    }
  }

  if (error) return <p className="text-red-600">{error}</p>
  if (!summary) return <p className="text-slate-500">Loading results…</p>

  return (
    <div>
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm uppercase tracking-wide text-slate-500">Your Score</p>
        <p className="mt-2 text-5xl font-bold text-indigo-600">{summary.score_percentage}%</p>
        <p className="mt-2 text-slate-600">
          {summary.correct_count} out of {summary.question_count} correct
        </p>
        {summary.time_taken_seconds !== null && (
          <p className="mt-1 text-sm text-slate-400">
            Completed in {Math.round(summary.time_taken_seconds / 60)} min
          </p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/quiz/setup"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Take Another Quiz
          </Link>
          {!showReview && (
            <button
              onClick={loadReview}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Review Answers
            </button>
          )}
        </div>
      </div>

      {showReview && (
        <div className="mt-8 space-y-4">
          {!review && <p className="text-slate-500">Loading review…</p>}
          {review?.items.map((item) => (
            <div
              key={item.question_order}
              className={`rounded-lg border p-5 ${
                item.is_correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <p className="font-medium text-slate-900">
                {item.question_order + 1}. {item.question.question_text}
              </p>
              <div className="mt-3 space-y-1 text-sm">
                {(['A', 'B', 'C', 'D'] as const).map((key) => {
                  const text = item.question[
                    `option_${key.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c' | 'option_d'
                  ]
                  const isCorrectAnswer = key === item.question.correct_answer
                  const isSelected = key === item.selected_answer
                  return (
                    <p
                      key={key}
                      className={
                        isCorrectAnswer
                          ? 'font-semibold text-emerald-700'
                          : isSelected
                            ? 'font-semibold text-red-700'
                            : 'text-slate-600'
                      }
                    >
                      {key}. {text}
                      {isCorrectAnswer && ' ✓ Correct answer'}
                      {isSelected && !isCorrectAnswer && ' ✗ Your answer'}
                    </p>
                  )
                })}
              </div>
              <p className="mt-3 text-sm text-slate-500">{item.question.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
