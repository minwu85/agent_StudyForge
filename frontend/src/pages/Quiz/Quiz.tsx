import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatSeconds, useTimer } from '../../hooks/useTimer'
import { getQuiz, submitQuiz } from '../../services/quizApi'
import type { AnswerOption } from '../../types/Question'
import type { QuizPublic } from '../../types/Quiz'

export function Quiz() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState<QuizPublic | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, AnswerOption>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!quizId) return
    getQuiz(Number(quizId))
      .then((data) => {
        if (data.status === 'completed') {
          navigate(`/results/${data.id}`, { replace: true })
          return
        }
        setQuiz(data)
      })
      .catch(() => setError('Could not load this quiz.'))
  }, [quizId, navigate])

  const totalSeconds = quiz?.time_limit_minutes ? quiz.time_limit_minutes * 60 : null

  const handleSubmit = async () => {
    if (!quiz || submitting) return
    setSubmitting(true)
    try {
      await submitQuiz(quiz.id, {
        answers: quiz.quiz_questions.map((qq) => ({
          question_id: qq.question.id,
          selected_answer: answers[qq.question.id] ?? null,
          flagged: flagged.has(qq.question.id),
        })),
      })
      navigate(`/results/${quiz.id}`)
    } catch {
      setError('Could not submit the quiz. Please try again.')
      setSubmitting(false)
    }
  }

  const secondsLeft = useTimer(totalSeconds, () => {
    void handleSubmit()
  })

  const questions = useMemo(() => quiz?.quiz_questions ?? [], [quiz])
  const current = questions[currentIndex]
  const answeredCount = Object.keys(answers).length

  if (error) return <p className="text-red-600">{error}</p>
  if (!quiz || !current) return <p className="text-stone-500">Loading quiz…</p>

  const selectAnswer = (option: AnswerOption) => {
    setAnswers((prev) => ({ ...prev, [current.question.id]: option }))
  }

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(current.question.id)) next.delete(current.question.id)
      else next.add(current.question.id)
      return next
    })
  }

  const options: [AnswerOption, string][] = [
    ['A', current.question.option_a],
    ['B', current.question.option_b],
    ['C', current.question.option_c],
    ['D', current.question.option_d],
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-stone-500">
          Question {currentIndex + 1} of {questions.length} &middot; {answeredCount} answered
        </div>
        {secondsLeft !== null && (
          <div
            className={`font-mono text-lg font-semibold ${secondsLeft <= 60 ? 'text-red-600' : 'text-stone-800'}`}
          >
            {formatSeconds(secondsLeft)}
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {questions.map((qq, i) => {
          const isAnswered = answers[qq.question.id] !== undefined
          const isFlagged = flagged.has(qq.question.id)
          const isCurrent = i === currentIndex
          return (
            <button
              key={qq.question.id}
              onClick={() => setCurrentIndex(i)}
              className={`h-8 w-8 rounded text-sm font-medium border ${
                isCurrent
                  ? 'border-leaf-600 bg-leaf-600 text-white'
                  : isAnswered
                    ? 'border-leaf-300 bg-leaf-50 text-leaf-700'
                    : 'border-stone-300 bg-white text-stone-600'
              } ${isFlagged ? 'ring-2 ring-amber-400' : ''}`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="text-lg font-medium text-stone-900">{current.question.question_text}</p>
          <button
            onClick={toggleFlag}
            className={`shrink-0 rounded px-2 py-1 text-xs font-medium border ${
              flagged.has(current.question.id)
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-stone-300 text-stone-500'
            }`}
          >
            {flagged.has(current.question.id) ? 'Flagged' : 'Flag'}
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {options.map(([key, text]) => (
            <label
              key={key}
              className={`flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer ${
                answers[current.question.id] === key
                  ? 'border-leaf-500 bg-leaf-50'
                  : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <input
                type="radio"
                name={`question-${current.question.id}`}
                checked={answers[current.question.id] === key}
                onChange={() => selectAnswer(key)}
                className="accent-leaf-600"
              />
              <span className="font-medium text-stone-500">{key}.</span>
              <span>{text}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="rounded-md bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => {
              if (answeredCount < questions.length) {
                const confirmed = window.confirm(
                  `You have ${questions.length - answeredCount} unanswered question(s). Submit anyway?`,
                )
                if (!confirmed) return
              }
              void handleSubmit()
            }}
            disabled={submitting}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Exam'}
          </button>
        )}
      </div>
    </div>
  )
}
