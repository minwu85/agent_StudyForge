import { useEffect, useState } from 'react'
import { getCourses, getWeeks } from '../../services/courseApi'
import { createTutorSession, getTutorHint, submitTutorAnswer } from '../../services/tutorApi'
import type { CoursePublic, WeekSummary } from '../../types/Course'
import type { AnswerOption } from '../../types/Question'
import type { TutorAnswerResponse, TutorSessionPublic } from '../../types/Tutor'

const DIFFICULTY_LABEL: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const DIFFICULTY_RANK: Record<string, number> = { easy: 0, medium: 1, hard: 2 }

export function Tutor() {
  const [course, setCourse] = useState<CoursePublic | null>(null)
  const [weeks, setWeeks] = useState<WeekSummary[]>([])
  const [selectedWeekIds, setSelectedWeekIds] = useState<Set<number>>(new Set())
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [session, setSession] = useState<TutorSessionPublic | null>(null)
  const [turnIndex, setTurnIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<AnswerOption | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<TutorAnswerResponse | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [hintLoading, setHintLoading] = useState(false)

  useEffect(() => {
    getCourses()
      .then((courses) => {
        const first = courses[0] ?? null
        setCourse(first)
        if (first) return getWeeks(first.id).then(setWeeks)
      })
      .catch(() => setError('Could not load courses/weeks. Is the backend running?'))
  }, [])

  const toggleWeek = (weekId: number) => {
    setSelectedWeekIds((prev) => {
      const next = new Set(prev)
      if (next.has(weekId)) next.delete(weekId)
      else next.add(weekId)
      return next
    })
  }

  async function handleStart() {
    if (!course) return
    setStarting(true)
    setError(null)
    try {
      const newSession = await createTutorSession({
        course_id: course.id,
        week_ids: selectedWeekIds.size > 0 ? Array.from(selectedWeekIds) : null,
      })
      setSession(newSession)
      setTurnIndex(0)
      setResult(null)
      setSelectedOption(null)
      setHint(null)
    } catch {
      setError('Could not start a tutoring session — make sure the selected weeks have uploaded, processed documents.')
    } finally {
      setStarting(false)
    }
  }

  async function handleSubmit() {
    if (!session || !selectedOption || submitting) return
    setSubmitting(true)
    try {
      const response = await submitTutorAnswer(session.id, { selected_answer: selectedOption })
      setResult(response)
      setSession(response.session)
    } catch {
      setError('Could not submit your answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleHint() {
    if (!session || hintLoading) return
    setHintLoading(true)
    try {
      const response = await getTutorHint(session.id)
      setHint(response.hint)
    } catch {
      setError('Could not get a hint for this question.')
    } finally {
      setHintLoading(false)
    }
  }

  function handleContinue() {
    setTurnIndex((i) => i + 1)
    setResult(null)
    setSelectedOption(null)
    setHint(null)
  }

  if (error) return <p className="text-red-600">{error}</p>

  if (!session) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Tutor</h1>
        {course && <p className="text-sm text-stone-500 mb-6">{course.name}</p>}
        <p className="text-sm text-stone-600 mb-6">
          The Tutor Agent walks through your uploaded material one passage at a time: it shows you a
          passage, checks your understanding with a question, gives feedback, and adjusts difficulty
          based on how you're doing (roadmap section 5.3 / 9). Question generation reuses the same
          local stub as the Quiz Agent — no LLM connected yet.
        </p>

        {weeks.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Weeks {selectedWeekIds.size === 0 && '(none selected = all weeks)'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {weeks.map((w) => (
                <label
                  key={w.id}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm ${
                    selectedWeekIds.has(w.id)
                      ? 'border-leaf-500 bg-leaf-50'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedWeekIds.has(w.id)}
                    onChange={() => toggleWeek(w.id)}
                    className="accent-leaf-600"
                  />
                  <span>
                    Week {w.week_number}: {w.title}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={starting || !course}
          className="w-full rounded-lg bg-leaf-600 px-6 py-3 text-white font-medium hover:bg-leaf-700 disabled:opacity-50 transition-colors"
        >
          {starting ? 'Starting…' : 'Start tutoring session'}
        </button>
      </div>
    )
  }

  const turn = session.turns[turnIndex]

  if (!turn) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Session complete</h1>
        <p className="text-stone-600 mb-6">
          {session.questions_correct} of {session.questions_asked} correct — that's all the
          processed material available for the weeks you picked.
        </p>
        <button
          onClick={() => setSession(null)}
          className="rounded-lg bg-leaf-600 px-6 py-3 text-white font-medium hover:bg-leaf-700"
        >
          Start another session
        </button>
      </div>
    )
  }

  const options: [AnswerOption, string][] = [
    ['A', turn.option_a],
    ['B', turn.option_b],
    ['C', turn.option_c],
    ['D', turn.option_d],
  ]
  const answered = result !== null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 text-sm text-stone-500">
        <span>
          Question {session.questions_asked + (answered ? 0 : 1)} &middot; {session.questions_correct}/
          {session.questions_asked} correct
        </span>
        <span className="rounded-full bg-leaf-100 text-leaf-800 px-3 py-1 font-medium">
          Difficulty: {DIFFICULTY_LABEL[session.difficulty]}
        </span>
      </div>

      <div className="rounded-lg border border-leaf-200 bg-leaf-50 p-5 mb-4">
        <p className="text-xs font-medium text-leaf-700 mb-2">
          Explanation &middot; {turn.document_filename}
          {turn.page_number !== null && `, page ${turn.page_number}`}
        </p>
        <p className="text-stone-800 whitespace-pre-wrap text-sm">{turn.explanation}</p>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <p className="text-lg font-medium text-stone-900 mb-5">{turn.question_text}</p>

        <div className="space-y-2">
          {options.map(([key, text]) => {
            const isSelected = selectedOption === key
            const isCorrectOption = answered && result.correct_answer === key
            const isWrongSelected = answered && isSelected && !result.is_correct
            return (
              <button
                key={key}
                type="button"
                disabled={answered}
                onClick={() => setSelectedOption(key)}
                className={`w-full flex items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
                  isCorrectOption
                    ? 'border-emerald-500 bg-emerald-50'
                    : isWrongSelected
                      ? 'border-red-400 bg-red-50'
                      : isSelected
                        ? 'border-leaf-500 bg-leaf-50'
                        : 'border-stone-200 hover:bg-stone-50'
                } ${answered ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="font-medium text-stone-500">{key}.</span>
                <span>{text}</span>
              </button>
            )
          })}
        </div>

        {hint && !answered && (
          <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Hint: <span className="font-mono">{hint}</span>
          </p>
        )}

        {!answered ? (
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={!selectedOption || submitting}
              className="rounded-md bg-leaf-600 px-5 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-50"
            >
              {submitting ? 'Checking…' : 'Submit answer'}
            </button>
            <button
              onClick={handleHint}
              disabled={hintLoading || !!hint}
              className="text-sm text-stone-500 hover:text-stone-800 underline disabled:opacity-50"
            >
              {hintLoading ? 'Thinking…' : hint ? 'Hint shown' : 'Get a hint'}
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <p className={`text-sm font-medium ${result.is_correct ? 'text-emerald-700' : 'text-red-600'}`}>
              {result.is_correct ? 'Correct!' : `Not quite — the correct answer was ${result.correct_answer}.`}
            </p>
            {result.difficulty_changed && (
              <p className="text-sm text-leaf-700 mt-1">
                Difficulty {DIFFICULTY_RANK[result.new_difficulty] > DIFFICULTY_RANK[result.previous_difficulty] ? 'increased' : 'decreased'} to{' '}
                {DIFFICULTY_LABEL[result.new_difficulty]} based on your recent answers.
              </p>
            )}
            <button
              onClick={handleContinue}
              className="mt-4 rounded-md bg-leaf-600 px-5 py-2 text-sm font-medium text-white hover:bg-leaf-700"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
