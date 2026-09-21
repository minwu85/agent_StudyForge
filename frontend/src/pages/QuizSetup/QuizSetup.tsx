import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCourses, getWeeks } from '../../services/courseApi'
import { createQuiz, generateQuestions, getTopics } from '../../services/quizApi'
import type { CoursePublic, WeekSummary } from '../../types/Course'
import type { Difficulty, TopicSummary } from '../../types/Question'
import type { QuestionGenerationResponse } from '../../types/Quiz'

const DIFFICULTIES: (Difficulty | 'any')[] = ['any', 'easy', 'medium', 'hard']
const GENERATE_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export function QuizSetup() {
  const navigate = useNavigate()
  const [course, setCourse] = useState<CoursePublic | null>(null)
  const [weeks, setWeeks] = useState<WeekSummary[]>([])
  const [selectedWeekIds, setSelectedWeekIds] = useState<Set<number>>(new Set())
  const [topics, setTopics] = useState<TopicSummary[]>([])
  const [topic, setTopic] = useState<string>('any')
  const [difficulty, setDifficulty] = useState<Difficulty | 'any'>('any')
  const [questionCount, setQuestionCount] = useState(10)
  const [timeLimit, setTimeLimit] = useState<number | ''>(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [genDifficulty, setGenDifficulty] = useState<Difficulty>('medium')
  const [genCount, setGenCount] = useState(5)
  const [genTopic, setGenTopic] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<QuestionGenerationResponse | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  function refreshTopicsAndWeeks(courseId: number) {
    getTopics().then(setTopics).catch(() => undefined)
    getWeeks(courseId).then(setWeeks).catch(() => undefined)
  }

  useEffect(() => {
    getTopics()
      .then(setTopics)
      .catch(() => setError('Could not load topics. Is the backend running?'))

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

  const maxAvailable =
    selectedWeekIds.size > 0
      ? weeks
          .filter((w) => selectedWeekIds.has(w.id))
          .reduce((sum, w) => sum + w.question_count, 0)
      : topic === 'any'
        ? topics.reduce((sum, t) => sum + t.question_count, 0)
        : (topics.find((t) => t.topic === topic)?.question_count ?? 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const quiz = await createQuiz({
        topic: topic === 'any' ? null : topic,
        difficulty: difficulty === 'any' ? null : difficulty,
        week_ids: selectedWeekIds.size > 0 ? Array.from(selectedWeekIds) : null,
        question_count: questionCount,
        time_limit_minutes: timeLimit === '' ? null : timeLimit,
      })
      navigate(`/quiz/${quiz.id}`)
    } catch {
      setError('Could not create quiz. Try different filters.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    if (!course) return
    setGenerating(true)
    setGenError(null)
    setGenResult(null)
    try {
      const result = await generateQuestions({
        course_id: course.id,
        week_ids: selectedWeekIds.size > 0 ? Array.from(selectedWeekIds) : null,
        topic: genTopic.trim() || null,
        difficulty: genDifficulty,
        question_count: genCount,
      })
      setGenResult(result)
      if (result.accepted.length > 0) refreshTopicsAndWeeks(course.id)
    } catch {
      setGenError('Could not generate questions. Make sure the selected weeks have uploaded, processed documents.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Quiz Setup</h1>
      {course && <p className="text-sm text-stone-500 mb-6">{course.name}</p>}

      {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

      <div className="mb-8 rounded-xl border border-leaf-200 bg-leaf-50 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-leaf-700" />
          <h2 className="font-semibold text-stone-900">Quiz Agent: generate questions</h2>
        </div>
        <p className="text-sm text-stone-600 mb-4">
          Turns your uploaded documents into new questions for the weeks selected above (or all weeks, if
          none are selected) — retrieval + rule-based evaluation run for real; generation itself is a local
          stub until an LLM is wired up (see Study page).
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Difficulty</label>
            <select
              value={genDifficulty}
              onChange={(e) => setGenDifficulty(e.target.value as Difficulty)}
              className="w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm bg-white"
            >
              {GENERATE_DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d[0].toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">How many</label>
            <input
              type="number"
              min={1}
              max={20}
              value={genCount}
              onChange={(e) => setGenCount(Number(e.target.value))}
              className="w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm bg-white"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-stone-700 mb-1">Topic label (optional)</label>
          <input
            type="text"
            value={genTopic}
            onChange={(e) => setGenTopic(e.target.value)}
            placeholder="Generated"
            className="w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm bg-white"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !course}
          className="w-full rounded-lg bg-leaf-700 px-4 py-2 text-sm text-white font-medium hover:bg-leaf-800 disabled:opacity-50 transition-colors"
        >
          {generating ? 'Generating…' : 'Generate questions from my documents'}
        </button>

        {genError && <p className="mt-3 text-sm text-red-600">{genError}</p>}

        {genResult && (
          <div className="mt-4 text-sm">
            <p className="font-medium text-stone-900">
              {genResult.accepted.length} of {genResult.requested} requested question
              {genResult.requested === 1 ? '' : 's'} accepted
              {genResult.rejected.length > 0 && `, ${genResult.rejected.length} rejected`}.
            </p>
            {genResult.accepted.length > 0 && (
              <ul className="mt-2 space-y-1 text-stone-700 list-disc list-inside">
                {genResult.accepted.map((q) => (
                  <li key={q.id}>{q.question_text}</li>
                ))}
              </ul>
            )}
            {genResult.rejected.length > 0 && (
              <details className="mt-2 text-stone-500">
                <summary className="cursor-pointer">Why some candidates were rejected</summary>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  {genResult.rejected.map((r, i) => (
                    <li key={i}>
                      {r.document_filename}
                      {r.page_number ? ` (p.${r.page_number})` : ''}: {r.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {genResult.requested > 0 && genResult.accepted.length === 0 && genResult.rejected.length === 0 && (
              <p className="mt-2 text-stone-500">
                No processed documents found for the selected weeks — upload some on the Documents page first.
              </p>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {weeks.length > 0 && (
          <div>
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
                    Week {w.week_number}: {w.title}{' '}
                    <span className="text-stone-400">({w.question_count})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Topic</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          >
            <option value="any">Any topic</option>
            {topics.map((t) => (
              <option key={t.topic} value={t.topic}>
                {t.topic} ({t.question_count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | 'any')}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d === 'any' ? 'Any difficulty' : d[0].toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Number of questions {maxAvailable > 0 && `(up to ${maxAvailable} available)`}
          </label>
          <input
            type="number"
            min={1}
            max={Math.max(maxAvailable, 1)}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Time limit (minutes, optional)
          </label>
          <input
            type="number"
            min={1}
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
            placeholder="No time limit"
          />
        </div>

        <button
          type="submit"
          disabled={loading || maxAvailable === 0}
          className="w-full rounded-lg bg-leaf-600 px-6 py-3 text-white font-medium hover:bg-leaf-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Starting…' : 'Start Exam'}
        </button>
      </form>
    </div>
  )
}
